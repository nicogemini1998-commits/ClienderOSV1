from __future__ import annotations
import json
import logging
import asyncio
import subprocess
from typing import Optional
from datetime import datetime

from database import get_conn
from services.enrichment import enrich_company

logger = logging.getLogger(__name__)

CITIES = [
    "Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao",
    "Málaga", "Alicante", "Murcia", "Zaragoza", "Córdoba"
]

SEARCH_TERMS = [
    "constructor",
    "reforma integral",
    "empresa de reformas",
    "obras y reformas"
]


async def scrape_google_maps(query: str, city: str, limit: int = 20) -> list[dict]:
    """
    Scrape Google Maps for businesses.
    Returns list of dicts with: name, phone, website, rating, reviews_count, category, address
    """
    try:
        cmd = [
            "node",
            "tools/google-maps-scraper/scraper.js",
            "--query", query,
            "--city", city,
            "--limit", str(limit),
            "--delay-ms", "2500"
        ]

        logger.info(f"Scraping Google Maps: query={query}, city={city}, limit={limit}")

        result = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd="/app" if __name__ != "__main__" else "."
        )

        stdout, stderr = await result.communicate()
        results = []

        if stdout:
            for line in stdout.decode('utf-8').strip().split('\n'):
                if line.strip():
                    try:
                        business = json.loads(line)
                        results.append(business)
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse JSON line: {line}")

        if stderr:
            logger.error(f"Scraper stderr: {stderr.decode('utf-8')}")

        logger.info(f"Scraped {len(results)} businesses from Google Maps")
        return results

    except Exception as e:
        logger.error(f"Google Maps scraping error: {e}")
        return []


async def fetch_and_store_leads(cities: Optional[list[str]] = None, terms: Optional[list[str]] = None) -> dict:
    """
    Fetch leads from Google Maps for all cities and terms, enrich with Claude, store to database.
    Returns stats: total_scraped, total_stored, duplicates_skipped, enrichment_errors
    """
    if cities is None:
        cities = CITIES
    if terms is None:
        terms = SEARCH_TERMS

    stats = {
        "total_scraped": 0,
        "total_stored": 0,
        "duplicates_skipped": 0,
        "enrichment_errors": 0,
        "errors": []
    }

    async with get_conn() as conn:
        for city in cities:
            for term in terms:
                try:
                    # Scrape businesses
                    businesses = await scrape_google_maps(term, city, limit=20)
                    stats["total_scraped"] += len(businesses)

                    for business in businesses:
                        try:
                            # Check for duplicates (by phone or website)
                            existing = None
                            if business.get("phone"):
                                cursor = await conn.execute(
                                    "SELECT id FROM lu_companies WHERE phone = ?",
                                    (business["phone"],)
                                )
                                existing = await cursor.fetchone()

                            if not existing and business.get("website"):
                                cursor = await conn.execute(
                                    "SELECT id FROM lu_companies WHERE website = ?",
                                    (business["website"],)
                                )
                                existing = await cursor.fetchone()

                            if existing:
                                stats["duplicates_skipped"] += 1
                                continue

                            # Enrich with Claude (scoring, hooks, opening_lines, opportunity_analysis)
                            enrichment = None
                            try:
                                company_data = {
                                    "name": business.get("name", ""),
                                    "phone": business.get("phone"),
                                    "website": business.get("website"),
                                    "city": city,
                                    "industry": business.get("category", "construcción y reformas")
                                }
                                enrichment = await enrich_company(company_data)
                            except Exception as e:
                                logger.error(f"Claude enrichment error for {business.get('name')}: {e}")
                                stats["enrichment_errors"] += 1

                            # Store company
                            await conn.execute(
                                """
                                INSERT INTO lu_companies (
                                    name, phone, website, city, industry,
                                    digital_score, opportunity_level,
                                    redes_sociales, captacion_leads, email_marketing,
                                    video_contenido, seo_info,
                                    hooks, opening_lines, opportunity_analysis,
                                    created_at
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    business.get("name"),
                                    business.get("phone"),
                                    business.get("website"),
                                    city,
                                    business.get("category", "Construction"),
                                    enrichment.get("digital_score", 0) if enrichment else 0,
                                    enrichment.get("opportunity_level", 0) if enrichment else 0,
                                    enrichment.get("redes_sociales", False) if enrichment else False,
                                    enrichment.get("captacion_leads", False) if enrichment else False,
                                    enrichment.get("email_marketing", False) if enrichment else False,
                                    enrichment.get("video_contenido", False) if enrichment else False,
                                    enrichment.get("seo_info", False) if enrichment else False,
                                    json.dumps(enrichment.get("hooks", [])) if enrichment else "[]",
                                    json.dumps(enrichment.get("opening_lines", [])) if enrichment else "[]",
                                    enrichment.get("opportunity_analysis") if enrichment else None,
                                    datetime.utcnow().isoformat()
                                )
                            )
                            await conn.commit()
                            stats["total_stored"] += 1

                        except Exception as e:
                            logger.error(f"Error storing business {business.get('name')}: {e}")
                            stats["errors"].append(str(e))

                except Exception as e:
                    logger.error(f"Error scraping {term} in {city}: {e}")
                    stats["errors"].append(f"{city}/{term}: {str(e)}")

    logger.info(f"Lead fetch complete: {stats}")
    return stats
