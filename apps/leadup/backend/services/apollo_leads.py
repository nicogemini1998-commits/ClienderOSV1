from __future__ import annotations
"""
Generación de leads desde Apollo.io para el sector construcción/reformas en España.
Filtra móviles españoles, deduplica y enriquece con Claude Haiku.
"""

import re
import logging
import json
from datetime import date
from typing import Any

import httpx
import aiosqlite

from config import get_settings
from services.enrichment import enrich_company

logger = logging.getLogger(__name__)
settings = get_settings()

APOLLO_SEARCH_URL = "https://api.apollo.io/v1/mixed_people/search"

SPANISH_MOBILE_PATTERN = re.compile(r"^\+34\s?[67]\d{8}$")

SPAIN_CONSTRUCTION_FILTERS = {
    "person_locations": ["Spain"],
    "organization_industry_tag_ids": [],
    "q_keywords": "construcción reformas albañilería arquitectura obras",
    "organization_locations": ["Spain"],
    "contact_email_status": [],
    "page": 1,
    "per_page": 100,
}

CONSTRUCTION_KEYWORDS = [
    "construc", "reform", "obra", "albañil", "arquitect", "instalacion",
    "fontaner", "electric", "pintura", "carpinter", "iron", "cerami",
    "solad", "remodel", "rehabilit", "contract",
]


def _is_spanish_mobile(phone: str | None) -> bool:
    if not phone:
        return False
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    return bool(SPANISH_MOBILE_PATTERN.match(cleaned))


def _is_construction_related(person: dict) -> bool:
    """Check if person/company is in construction/reform sector."""
    fields = [
        person.get("organization", {}).get("name", ""),
        person.get("organization", {}).get("industry", ""),
        person.get("title", ""),
    ]
    combined = " ".join(fields).lower()
    return any(kw in combined for kw in CONSTRUCTION_KEYWORDS)


async def _fetch_apollo_people(page: int = 1, per_page: int = 100) -> list[dict]:
    """Fetch people from Apollo.io search endpoint."""
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
    }
    payload = {
        **SPAIN_CONSTRUCTION_FILTERS,
        "page": page,
        "per_page": per_page,
        "api_key": settings.apollo_api_key,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(APOLLO_SEARCH_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("people", []) or data.get("contacts", [])


async def _get_existing_apollo_ids(conn: aiosqlite.Connection) -> set[str]:
    cursor = await conn.execute("SELECT apollo_id FROM lu_contacts WHERE apollo_id IS NOT NULL")
    rows = await cursor.fetchall()
    return {r[0] for r in rows}


async def _get_assigned_company_ids_for_user(
    conn: aiosqlite.Connection, user_id: int
) -> set[int]:
    cursor = await conn.execute(
        "SELECT company_id FROM lu_daily_assignments WHERE user_id = ?",
        (user_id,),
    )
    rows = await cursor.fetchall()
    return {r[0] for r in rows}


async def _insert_company_and_contact(
    conn: aiosqlite.Connection,
    person: dict,
    enrichment: dict,
) -> int | None:
    """Insert company and contact, return company_id."""
    org = person.get("organization") or {}

    cursor = await conn.execute(
        """
        INSERT INTO lu_companies
            (name, website, city, industry, phone,
             digital_score, opportunity_level,
             redes_sociales, captacion_leads, email_marketing,
             video_contenido, seo_info,
             hooks, opening_lines, opportunity_analysis)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            org.get("name") or person.get("name", "Empresa sin nombre"),
            org.get("website_url") or org.get("primary_domain"),
            person.get("city") or org.get("city") or "España",
            org.get("industry") or "Construcción",
            _extract_mobile(person),
            enrichment.get("digital_score", 30),
            enrichment.get("opportunity_level", "media"),
            1 if enrichment.get("redes_sociales", False) else 0,
            1 if enrichment.get("captacion_leads", False) else 0,
            1 if enrichment.get("email_marketing", False) else 0,
            1 if enrichment.get("video_contenido", False) else 0,
            1 if enrichment.get("seo_info", False) else 0,
            json.dumps(enrichment.get("hooks", [])),
            json.dumps(enrichment.get("opening_lines", [])),
            enrichment.get("opportunity_analysis", ""),
        ),
    )
    company_id = cursor.lastrowid
    await conn.commit()

    phone = _extract_mobile(person)
    await conn.execute(
        """
        INSERT OR IGNORE INTO lu_contacts (company_id, name, title, phone, email, apollo_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            company_id,
            person.get("name", "Contacto"),
            person.get("title"),
            phone,
            person.get("email"),
            person.get("id"),
        ),
    )
    await conn.commit()

    return company_id


def _extract_mobile(person: dict) -> str | None:
    """Extract the first valid Spanish mobile from person data."""
    phones = person.get("phone_numbers") or []
    for ph in phones:
        number = ph.get("sanitized_number") or ph.get("raw_number") or ""
        if _is_spanish_mobile(number):
            return number
    # Try direct phone field
    direct = person.get("mobile_phone") or person.get("phone")
    if _is_spanish_mobile(direct):
        return direct
    return None


async def fetch_and_store_leads(
    conn: aiosqlite.Connection,
    user_id: int,
    target_count: int = 20,
    assign_date: date | None = None,
) -> int:
    """
    Fetch leads from Apollo, enrich, store and assign to user_id.
    Returns number of leads actually assigned.
    """
    if assign_date is None:
        assign_date = date.today()

    existing_apollo_ids = await _get_existing_apollo_ids(conn)
    assigned_company_ids = await _get_assigned_company_ids_for_user(conn, user_id)
    assigned_count = 0
    page = 1
    max_pages = 10

    while assigned_count < target_count and page <= max_pages:
        try:
            people = await _fetch_apollo_people(page=page, per_page=100)
        except httpx.HTTPError as exc:
            logger.error(f"Apollo API error on page {page}: {exc}")
            break

        if not people:
            logger.info("No more results from Apollo")
            break

        for person in people:
            if assigned_count >= target_count:
                break

            apollo_id = person.get("id")
            if apollo_id and apollo_id in existing_apollo_ids:
                continue

            mobile = _extract_mobile(person)
            if not mobile:
                continue

            company_data = {
                "name": (person.get("organization") or {}).get("name", ""),
                "city": person.get("city") or "",
                "industry": (person.get("organization") or {}).get("industry", ""),
                "website": (person.get("organization") or {}).get("website_url", ""),
                "phone": mobile,
            }

            try:
                enrichment = await enrich_company(company_data)
            except Exception as exc:
                logger.warning(f"Enrichment failed for {company_data['name']}: {exc}")
                enrichment = {}

            try:
                company_id = await _insert_company_and_contact(conn, person, enrichment)
            except Exception as exc:
                logger.warning(f"DB insert failed: {exc}")
                continue

            if company_id in assigned_company_ids:
                continue

            try:
                await conn.execute(
                    """
                    INSERT OR IGNORE INTO lu_daily_assignments (company_id, user_id, assigned_date, status)
                    VALUES (?, ?, ?, 'pending')
                    """,
                    (company_id, user_id, str(assign_date)),
                )
                await conn.commit()
                assigned_company_ids.add(company_id)
                if apollo_id:
                    existing_apollo_ids.add(apollo_id)
                assigned_count += 1
                logger.info(f"Assigned lead {company_data['name']} to user {user_id}")
            except Exception as exc:
                logger.warning(f"Assignment insert failed: {exc}")
                continue

        page += 1

    logger.info(f"Total leads assigned to user {user_id}: {assigned_count}")
    return assigned_count
