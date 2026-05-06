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


@router.post("/load-real-leads")
async def load_real_leads(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin),
):
    """
    Scrape real leads from Google Maps via Apify, enrich with Claude,
    delete all fake/test leads and assign real ones to Toni(2), Ruben(4), Ethan(5).
    """
    from services.apify_gmaps import fetch_real_leads
    from services.enrichment import enrich_company

    async def _task():
        import json as _json
        from datetime import date as _date

        logger.info("Starting real lead load via Apify + Claude enrichment")

        # 1. Fetch real leads from Google Maps
        try:
            leads = await fetch_real_leads(per_search=8)
        except Exception as e:
            logger.error(f"Apify fetch failed: {e}")
            return

        if not leads:
            logger.error("No leads returned from Apify")
            return

        logger.info(f"Apify returned {len(leads)} real leads")

        # 2. Wipe all existing fake/test data (only non-real companies)
        async with get_conn() as conn:
            # Delete all assignments for Toni, Ruben, Ethan and Nicolas
            await conn.execute("DELETE FROM lu_daily_assignments WHERE user_id IN (1, 2, 4, 5)")
            # Delete contacts and companies that have no website (fake/test data markers)
            await conn.execute(
                "DELETE FROM lu_contacts WHERE company_id IN "
                "(SELECT id FROM lu_companies WHERE website IS NULL OR website = '' OR website LIKE 'www.%' OR rating IS NULL)"
            )
            await conn.execute(
                "DELETE FROM lu_companies WHERE website IS NULL OR website = '' OR website LIKE 'www.%' OR rating IS NULL"
            )
            await conn.commit()
            logger.info("Wiped fake/test leads from database")

        # 3. Insert real leads + enrich + assign
        target_users = [2, 4, 5]  # Toni, Ruben, Ethan
        today = str(_date.today())
        loaded = 0

        for i, lead in enumerate(leads[:30]):
            user_id = target_users[i % len(target_users)]
            try:
                # Dedup by phone
                async with get_conn() as conn:
                    cur = await conn.execute(
                        "SELECT id FROM lu_companies WHERE phone = ?", (lead["phone"],)
                    )
                    existing = await cur.fetchone()
                    if existing:
                        company_id = existing["id"]
                    else:
                        # Enrich with Claude
                        try:
                            enrichment = await enrich_company({
                                "name": lead["name"],
                                "phone": lead["phone"],
                                "website": lead.get("website", ""),
                                "city": lead["city"],
                                "industry": lead["industry"],
                            })
                        except Exception as ex:
                            logger.warning(f"Enrichment failed for {lead['name']}: {ex}")
                            enrichment = {}

                        cur = await conn.execute(
                            """INSERT INTO lu_companies
                              (name, phone, website, city, industry, rating, reviews_count,
                               digital_score, opportunity_level,
                               redes_sociales, captacion_leads, email_marketing,
                               video_contenido, seo_info, hooks, opening_lines, opportunity_analysis)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                            (
                                lead["name"],
                                lead["phone"],
                                lead.get("website", ""),
                                lead["city"],
                                lead["industry"],
                                lead.get("rating"),
                                lead.get("reviews_count"),
                                enrichment.get("digital_score", 40),
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
                        company_id = cur.lastrowid
                        await conn.commit()

                        # Contact with phone from Google Maps (public info)
                        await conn.execute(
                            """INSERT INTO lu_contacts (company_id, name, phone, title, phone_revealed)
                            VALUES (?, ?, ?, ?, 1)""",
                            (company_id, lead["name"], lead["phone"], "Responsable"),
                        )
                        await conn.commit()

                # Assign to user
                async with get_conn() as conn:
                    await conn.execute(
                        """INSERT OR IGNORE INTO lu_daily_assignments
                           (company_id, user_id, assigned_date, status)
                           VALUES (?,?,?,?)""",
                        (company_id, user_id, today, "pending"),
                    )
                    await conn.commit()
                loaded += 1

            except Exception as ex:
                logger.error(f"Error loading lead {lead.get('name')}: {ex}")

        logger.info(f"Real lead load complete: {loaded}/{len(leads)} leads inserted")

    background_tasks.add_task(_task)
    return {
        "message": "Carga de leads reales iniciada (Google Maps + Claude). Tarda ~5 minutos.",
        "users": ["Toni", "Ruben", "Ethan"],
        "note": "Se eliminarán leads de prueba y se cargarán leads 100% reales.",
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


@router.post("/seed-leads")
async def seed_leads(
    current_user: dict = Depends(require_admin),
):
    """Load 24 demo leads (12 constructoras + 12 abogados) for today."""
    import json as _json

    constructoras = [
        ("Construcciones Aranda S.L.", "Madrid", "Construcción", "www.construccionesaranda.es", "+34 915 234 567", 25, "alta"),
        ("Reformas Blanca & Cia", "Barcelona", "Reformas Integrales", "www.reformasblanca.com", "+34 932 456 789", 18, "alta"),
        ("Constructor Díaz Valencia", "Valencia", "Obras Civiles", "constructordiaz.es", "+34 963 567 890", 32, "media"),
        ("Obras Mayores Sevilla", "Sevilla", "Construcción de Viviendas", "www.obrmayor.es", "+34 954 678 901", 21, "alta"),
        ("Constructora Gómez & Partners", "Bilbao", "Construcción Comercial", "gomezbuilders.es", "+34 944 789 012", 28, "media"),
        ("Reformas García Hermanos", "Málaga", "Reformas y Rehabilitación", "www.reformasgarcia.com", "+34 952 890 123", 15, "alta"),
        ("Obras Públicas Castro", "Zaragoza", "Obras de Infraestructura", "www.obrascastro.es", "+34 976 901 234", 26, "media"),
        ("Constructora Jiménez Toledo", "Toledo", "Edificación", "jimenezconstructora.es", "+34 925 012 345", 19, "alta"),
        ("Reformas Inteligentes Alicante", "Alicante", "Reformas Domésticas", "www.reformasinteligentes.es", "+34 965 123 456", 22, "media"),
        ("Constructor Mora Granada", "Granada", "Construcción Residencial", "moraconstructor.com", "+34 958 234 567", 17, "alta"),
        ("Obras Urbanas Murcia", "Murcia", "Urbanización", "www.obrasurbanas.es", "+34 968 345 678", 24, "media"),
        ("Constructora Sánchez Santander", "Santander", "Construcción General", "sanchez-construcciones.es", "+34 942 456 789", 20, "alta"),
    ]

    abogados = [
        ("Bufete Jurídico García López", "Madrid", "Derecho Mercantil", "www.garcialopezabogados.es", "+34 913 456 789", 35, "media"),
        ("Abogados Martínez & Asociados", "Barcelona", "Derecho Penal", "www.martinez-abogados.cat", "+34 932 567 890", 28, "alta"),
        ("Despacho Fernández Valencia", "Valencia", "Derecho Laboral", "fernandezabogados.es", "+34 963 678 901", 31, "media"),
        ("Bufete Sánchez Sevilla", "Sevilla", "Derecho Civil", "www.bufetesanchez.es", "+34 954 789 012", 22, "alta"),
        ("Abogados Ramírez & Cia", "Bilbao", "Derecho Mercantil", "ramirezabogados.es", "+34 944 890 123", 33, "media"),
        ("Despacho Jurídico López Málaga", "Málaga", "Derecho Inmobiliario", "www.lopezabogados.com", "+34 952 901 234", 25, "alta"),
        ("Bufete Colón Zaragoza", "Zaragoza", "Derecho Administrativo", "www.bufetecolon.es", "+34 976 012 345", 29, "media"),
        ("Abogados Ruiz Toledo", "Toledo", "Derecho de Familia", "ruizabogados.es", "+34 925 123 456", 24, "alta"),
        ("Despacho Gómez Alicante", "Alicante", "Derecho Mercantil", "www.gomezabogados.es", "+34 965 234 567", 32, "media"),
        ("Bufete Granada Legal", "Granada", "Derecho Penal", "www.granadalegal.com", "+34 958 345 678", 26, "alta"),
        ("Abogados Morales Murcia", "Murcia", "Derecho Civil", "moralesabogados.es", "+34 968 456 789", 30, "media"),
        ("Despacho Jiménez Santander", "Santander", "Derecho Laboral", "www.jimenezabogados.es", "+34 942 567 890", 27, "alta"),
    ]

    all_clients = constructoras + abogados
    today = str(date.today())
    user_list = [2, 4, 5]  # Toni, Ruben, Ethan
    loaded = 0

    async with get_conn() as conn:
        await conn.execute("DELETE FROM lu_daily_assignments WHERE assigned_date = ?", (today,))
        await conn.commit()

        for i, (name, city, industry, website, phone, score, opp) in enumerate(all_clients):
            hooks = _json.dumps([
                f"Sector {industry} en {city}",
                f"Score digital {score}/100",
                f"Oportunidad {opp}"
            ])
            opening = _json.dumps([
                f"Hola {name}, soy Nicolás de HBD",
                f"Buenos días, le llamo porque hemos analizado {name}",
                f"{name}, ¿tiene 3 minutos?"
            ])

            cursor = await conn.execute(
                """INSERT OR IGNORE INTO lu_companies
                (name, website, city, industry, phone, digital_score, opportunity_level, hooks, opening_lines)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                (name, website, city, industry, phone, score, opp, hooks, opening)
            )
            await conn.commit()

            cursor = await conn.execute("SELECT id FROM lu_companies WHERE name = ?", (name,))
            row = await cursor.fetchone()
            company_id = row["id"]

            contact_names = ["Carlos Ruiz", "María Fernández", "Juan García", "Patricia López", "Roberto Sánchez", "Elena Torres"]
            contact = contact_names[i % len(contact_names)]

            await conn.execute("DELETE FROM lu_contacts WHERE company_id = ?", (company_id,))
            await conn.execute(
                """INSERT INTO lu_contacts (company_id, name, title, email, phone_prefix, lusha_person_id, phone_revealed)
                VALUES (?,?,?,?,?,?,?)""",
                (company_id, contact, "Director", f"{contact.lower().replace(' ', '.')}@{name.lower().replace(' ', '')}.es", str(630 + i % 10), f"mock_{i:03d}", 0)
            )
            await conn.commit()

            user_id = user_list[i % len(user_list)]
            await conn.execute(
                """INSERT OR IGNORE INTO lu_daily_assignments (company_id, user_id, assigned_date, status)
                VALUES (?,?,?,?)""",
                (company_id, user_id, today, "pending")
            )
            await conn.commit()
            loaded += 1

    return {
        "message": f"✅ {loaded} leads cargados",
        "date": today,
        "distribution": {
            "Toni": 8,
            "Ruben": 8,
            "Ethan": 8,
        },
        "sectors": ["12 Constructoras", "12 Abogados"]
    }
