from __future__ import annotations
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from auth import get_current_user, require_admin
from database import get_conn
from services.scheduler import trigger_manual_assignment, assign_leads_for_user
from services.enrichment import enrich_company

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


class LeadSearchToggle(BaseModel):
    user_id: int
    enabled: bool


class AssignNowRequest(BaseModel):
    user_id: Optional[int] = None
    count: int = 20


@router.post("/assign-now")
async def assign_now(
    body: AssignNowRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
):
    """Trigger immediate lead assignment for all users or a specific user."""
    if body.user_id:
        async with get_conn() as conn:
            cursor = await conn.execute(
                "SELECT id, name FROM lu_users WHERE id = ?", (body.user_id,)
            )
            user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        background_tasks.add_task(
            assign_leads_for_user, body.user_id, date.today(), body.count
        )
        return {"message": f"Asignación iniciada para {user['name']}", "user_id": body.user_id}

    background_tasks.add_task(trigger_manual_assignment)
    return {"message": "Asignación masiva iniciada para todos los usuarios activos"}


@router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(require_admin),
):
    """Return analytics: total leads, by status, by commercial, conversion rate."""
    today = date.today()

    async with get_conn() as conn:
        # Overall stats for today
        cursor = await conn.execute(
            "SELECT COUNT(*) FROM lu_daily_assignments WHERE assigned_date = ?", (str(today),)
        )
        row = await cursor.fetchone()
        total_today = row[0]

        # Breakdown by status (all time)
        cursor = await conn.execute(
            """
            SELECT status, COUNT(*) AS count
            FROM lu_daily_assignments
            GROUP BY status
            """
        )
        status_rows = await cursor.fetchall()

        # Breakdown by status today
        cursor = await conn.execute(
            """
            SELECT status, COUNT(*) AS count
            FROM lu_daily_assignments
            WHERE assigned_date = ?
            GROUP BY status
            """,
            (str(today),),
        )
        status_today_rows = await cursor.fetchall()

        # Per commercial stats
        cursor = await conn.execute(
            """
            SELECT
                u.id,
                u.name,
                u.email,
                u.lead_search_enabled,
                COUNT(da.id) AS total_assigned,
                COUNT(CASE WHEN da.status = 'closed' THEN 1 END) AS closed,
                COUNT(CASE WHEN da.status = 'no_answer' THEN 1 END) AS no_answer,
                COUNT(CASE WHEN da.status = 'rejected' THEN 1 END) AS rejected,
                COUNT(CASE WHEN da.status = 'pending' THEN 1 END) AS pending,
                COUNT(CASE WHEN da.assigned_date = ? THEN 1 END) AS today_count
            FROM lu_users u
            LEFT JOIN lu_daily_assignments da ON da.user_id = u.id
            GROUP BY u.id, u.name, u.email, u.lead_search_enabled
            ORDER BY u.name
            """,
            (str(today),),
        )
        commercial_rows = await cursor.fetchall()

        # Total companies in DB
        cursor = await conn.execute("SELECT COUNT(*) FROM lu_companies")
        row = await cursor.fetchone()
        total_companies = row[0]

    # Compute overall conversion rate
    all_assigned = sum(r["total_assigned"] for r in commercial_rows)
    all_closed = sum(r["closed"] for r in commercial_rows)
    conversion_rate = round((all_closed / all_assigned * 100), 1) if all_assigned > 0 else 0

    status_map = {r["status"]: r["count"] for r in status_rows}
    status_today_map = {r["status"]: r["count"] for r in status_today_rows}

    return {
        "today": str(today),
        "total_leads_today": total_today,
        "total_companies": total_companies,
        "all_time": {
            "total_assigned": all_assigned,
            "by_status": status_map,
            "conversion_rate": conversion_rate,
        },
        "today_by_status": status_today_map,
        "by_commercial": [
            {
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "lead_search_enabled": bool(r["lead_search_enabled"]),
                "total_assigned": r["total_assigned"],
                "today_count": r["today_count"],
                "closed": r["closed"],
                "no_answer": r["no_answer"],
                "rejected": r["rejected"],
                "pending": r["pending"],
                "conversion_rate": round(
                    (r["closed"] / r["total_assigned"] * 100) if r["total_assigned"] > 0 else 0, 1
                ),
            }
            for r in commercial_rows
        ],
    }


@router.patch("/lead-search-toggle")
async def toggle_lead_search(
    body: LeadSearchToggle,
    current_user: dict = Depends(require_admin),
):
    """Enable or disable lead search for a specific user."""
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, name FROM lu_users WHERE id = ?", (body.user_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        await conn.execute(
            "UPDATE lu_users SET lead_search_enabled = ? WHERE id = ?",
            (1 if body.enabled else 0, body.user_id),
        )
        await conn.commit()

    return {
        "user_id": body.user_id,
        "name": row["name"],
        "lead_search_enabled": body.enabled,
    }


@router.post("/trigger-enrichment")
async def trigger_enrichment(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
):
    """Enrich companies that have no enrichment data yet."""

    async def _enrich_pending() -> None:
        import json

        async with get_conn() as conn:
            cursor = await conn.execute(
                """
                SELECT id, name, city, industry, website, phone
                FROM lu_companies
                WHERE opportunity_analysis IS NULL OR opportunity_analysis = ''
                LIMIT 50
                """
            )
            companies = await cursor.fetchall()

        for company in companies:
            try:
                enrichment = await enrich_company(dict(company))
                async with get_conn() as conn:
                    await conn.execute(
                        """
                        UPDATE lu_companies SET
                            digital_score = ?,
                            opportunity_level = ?,
                            redes_sociales = ?,
                            captacion_leads = ?,
                            email_marketing = ?,
                            video_contenido = ?,
                            seo_info = ?,
                            hooks = ?,
                            opening_lines = ?,
                            opportunity_analysis = ?
                        WHERE id = ?
                        """,
                        (
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
                            company["id"],
                        ),
                    )
                    await conn.commit()
                logger.info(f"Enriched company id={company['id']}")
            except Exception as exc:
                logger.error(f"Enrichment failed for company {company['id']}: {exc}")

    background_tasks.add_task(_enrich_pending)
    return {"message": "Enriquecimiento iniciado en segundo plano"}


@router.post("/lusha-load")
async def lusha_load(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
):
    """
    Fetch 25 leads from Lusha (construction/reform sector, Spain) and
    assign them equally among Toni (2), Ruben (4), Ethan (5).
    """
    from services.lusha_leads import search_construction_leads
    from services.enrichment import enrich_company

    async def _load_task():
        import json as _json

        logger.info("Lusha load: starting 25-lead fetch")
        try:
            contacts = await search_construction_leads(count=25)
        except Exception as e:
            logger.error(f"Lusha search failed: {e}")
            return

        # Assign user IDs in round-robin: Toni=2, Ruben=4, Ethan=5
        target_users = [2, 4, 5]
        today = date.today()
        loaded = 0

        for i, c in enumerate(contacts):
            user_id = target_users[i % len(target_users)]
            try:
                # Create or find company
                async with get_conn() as conn:
                    # Dedup by name
                    cursor = await conn.execute(
                        "SELECT id FROM lu_companies WHERE name = ?",
                        (c["company_name"],),
                    )
                    existing = await cursor.fetchone()

                    if existing:
                        company_id = existing["id"]
                    else:
                        # Enrich with Claude
                        enrichment = await enrich_company({
                            "name": c["company_name"],
                            "city": c["company_city"],
                            "industry": c["company_industry"],
                            "website": c["company_website"],
                            "phone": "",
                        })

                        cursor = await conn.execute(
                            """
                            INSERT INTO lu_companies
                              (name, website, city, industry, digital_score, opportunity_level,
                               redes_sociales, captacion_leads, email_marketing,
                               video_contenido, seo_info, hooks, opening_lines, opportunity_analysis)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                            """,
                            (
                                c["company_name"],
                                c["company_website"],
                                c["company_city"],
                                c["company_industry"],
                                enrichment.get("digital_score", 30),
                                enrichment.get("opportunity_level", "media"),
                                1 if enrichment.get("redes_sociales") else 0,
                                1 if enrichment.get("captacion_leads") else 0,
                                1 if enrichment.get("email_marketing") else 0,
                                1 if enrichment.get("video_contenido") else 0,
                                1 if enrichment.get("seo_info") else 0,
                                _json.dumps(enrichment.get("hooks", [])),
                                _json.dumps(enrichment.get("opening_lines", [])),
                                enrichment.get("opportunity_analysis", ""),
                            ),
                        )
                        company_id = cursor.lastrowid
                        await conn.commit()

                        # Create contact (phone masked, not revealed)
                        if c.get("contact_name"):
                            await conn.execute(
                                """
                                INSERT INTO lu_contacts
                                  (company_id, name, title, email,
                                   lusha_person_id, phone_revealed, phone_prefix)
                                VALUES (?,?,?,?,?,0,?)
                                """,
                                (
                                    company_id,
                                    c["contact_name"],
                                    c.get("contact_title", ""),
                                    c.get("contact_email", ""),
                                    c.get("lusha_person_id", ""),
                                    c.get("phone_prefix", ""),
                                ),
                            )
                            await conn.commit()

                # Assign to user (ignore duplicate constraint)
                async with get_conn() as conn:
                    try:
                        await conn.execute(
                            """
                            INSERT OR IGNORE INTO lu_daily_assignments
                              (company_id, user_id, assigned_date, status)
                            VALUES (?,?,?,?)
                            """,
                            (company_id, user_id, str(today), "pending"),
                        )
                        await conn.commit()
                        loaded += 1
                    except Exception as ex:
                        logger.warning(f"Duplicate assignment skipped: {ex}")

            except Exception as ex:
                logger.error(f"Error processing Lusha contact {i}: {ex}")
                continue

        logger.info(f"Lusha load complete: {loaded} leads assigned")

    background_tasks.add_task(_load_task)
    return {
        "message": "Carga Lusha iniciada en segundo plano. 25 leads → Toni, Ruben, Ethan.",
        "users": ["Toni (2)", "Ruben (4)", "Ethan (5)"],
    }


@router.post("/scrape-now", tags=["admin"])
async def scrape_now(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
):
    """Trigger Google Maps scraping immediately (admin only)."""

    from services.google_maps_leads import scrape_and_enrich_leads

    async def _scrape_task():
        logger.info("Google Maps scraping initiated by admin")
        try:
            stats = await scrape_and_enrich_leads()
            logger.info(f"Scraping complete: {stats}")
        except Exception as e:
            logger.error(f"Scraping error: {e}")

    background_tasks.add_task(_scrape_task)
    return {"message": "Scraping iniciado en segundo plano"}
