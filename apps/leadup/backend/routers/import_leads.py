from __future__ import annotations
import json as _json
import logging
from datetime import date as _date

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from auth import require_admin
from database import get_conn
from services.enrichment import enrich_company
from services.excel_reader import parse_csv, parse_excel
from services.import_validator import validate_import

logger = logging.getLogger(__name__)
router = APIRouter()


class ImportLeadsAssignmentRequest(BaseModel):
    leads: list[dict]
    assignments: list[dict]


# ── Background enrichment ────────────────────────────────────────────────────

async def _enrich_imported(company_ids: list[int]) -> None:
    """Generates hooks, opening_lines and opportunity_analysis for imported companies.
    Preserves existing digital_score and opportunity_level."""
    for cid in company_ids:
        try:
            async with get_conn() as conn:
                cursor = await conn.execute(
                    "SELECT id, name, city, industry, website, phone FROM lu_companies WHERE id = ?",
                    (cid,),
                )
                row = await cursor.fetchone()
                if not row:
                    continue
                company = dict(row)

            enrichment = await enrich_company(company)

            async with get_conn() as conn:
                await conn.execute(
                    """UPDATE lu_companies
                       SET hooks               = ?,
                           opening_lines       = ?,
                           opportunity_analysis= ?
                       WHERE id = ?""",
                    (
                        _json.dumps(enrichment.get("hooks", [])),
                        _json.dumps(enrichment.get("opening_lines", [])),
                        enrichment.get("opportunity_analysis", ""),
                        cid,
                    ),
                )
                await conn.commit()
            logger.info(f"Enriched content for company id={cid}")
        except Exception as exc:
            logger.warning(f"Enrich failed for company_id={cid}: {exc}")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_excel(file: UploadFile = File(...), _=Depends(require_admin)):
    try:
        content = await file.read()
        is_csv = file.filename.lower().endswith(".csv")
        result = parse_csv(content) if is_csv else parse_excel(content)

        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        # Extraer nicho canónico del nombre del fichero "Leads <Nicho>.csv".
        import re as _re
        import os as _os
        stem = _os.path.splitext(_os.path.basename(file.filename or ""))[0]
        m = _re.match(r"(?:leads?[\s_\-]+)?(.+)", stem.strip(), flags=_re.IGNORECASE)
        canonical_nicho = (m.group(1).strip() if m else stem.strip()) or ""

        # Inyectar nicho canónico en TODAS las filas. Sobrescribe industry y sub_industry
        # para evitar duplicados como "X - X" o variantes de capitalización distintas.
        if canonical_nicho:
            for r in result["rows"]:
                r["industry"] = canonical_nicho
                r["sub_industry"] = canonical_nicho

        # Refrescar columns_found para que la UI vea industry mapeada.
        cf = dict(result["columns_found"])
        if canonical_nicho and "industry" not in cf.values():
            cf["(Nicho del filename)"] = "industry"

        return {
            "success": True,
            "total": result["total"],
            "headers": result["headers"],
            "columns_found": cf,
            "sample_rows": result["rows"][:3],
            "all_rows": result["rows"],
            "detected_nicho": canonical_nicho,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate")
async def validate_leads(data: dict, _=Depends(require_admin)):
    try:
        columns_found = data.get("columns_found", {})
        rows = data.get("all_rows", [])
        validation = await validate_import(columns_found, rows)
        return {"success": True, "validation": validation}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/assign")
async def assign_leads(
    request: ImportLeadsAssignmentRequest,
    background_tasks: BackgroundTasks,
    _=Depends(require_admin),
):
    try:
        leads = request.leads
        assignments = request.assignments

        inserted_companies: dict[str, int] = {}
        inserted_contacts: dict[str, int] = {}

        async with get_conn() as conn:
            for lead in leads:
                company_name = lead.get("company_name")
                if not company_name:
                    continue

                website = lead.get("website", "")
                city = lead.get("city", "")
                industry = lead.get("industry", "")
                sub_industry = lead.get("sub_industry", "")
                company_phone = lead.get("company_phone", "")
                industry_combined = industry or sub_industry or ""

                await conn.execute(
                    """INSERT INTO lu_companies (name, website, city, industry, phone, source)
                       VALUES (?, ?, ?, ?, ?, 'excel_import')
                       ON CONFLICT DO NOTHING""",
                    (company_name, website, city, industry_combined, company_phone),
                )
                await conn.commit()

                row = await (await conn.execute(
                    "SELECT id FROM lu_companies WHERE name = ? LIMIT 1", (company_name,)
                )).fetchone()
                if not row:
                    continue

                company_id = row[0]
                inserted_companies[company_name] = company_id

                contact_name = lead.get("contact_name")
                if contact_name:
                    contact_title = lead.get("contact_title", "")
                    contact_email = lead.get("contact_email", "")
                    contact_phone = (
                        lead.get("contact_phone")
                        or lead.get("contact_mobile")
                        or company_phone
                        or None
                    )
                    contact_phone2 = lead.get("contact_phone2") or None

                    await conn.execute(
                        """INSERT INTO lu_contacts
                           (company_id, name, title, email, phone, phone2, phone_revealed)
                           VALUES (?, ?, ?, ?, ?, ?, ?)
                           ON CONFLICT DO NOTHING""",
                        (company_id, contact_name, contact_title, contact_email,
                         contact_phone, contact_phone2, True),
                    )
                    await conn.commit()

                    contact_row = await (await conn.execute(
                        "SELECT id FROM lu_contacts WHERE company_id = ? AND name = ? LIMIT 1",
                        (company_id, contact_name),
                    )).fetchone()
                    if contact_row:
                        inserted_contacts[contact_name] = contact_row[0]

            # Anti-duplicación: lead asignado UNA SOLA VEZ.
            already_assigned_global: set[int] = set()
            if inserted_companies:
                placeholders = ",".join(["?"] * len(inserted_companies))
                existing_cur = await conn.execute(
                    f"SELECT DISTINCT company_id FROM lu_daily_assignments WHERE company_id IN ({placeholders})",
                    tuple(inserted_companies.values()),
                )
                already_assigned_global = {r[0] for r in await existing_cur.fetchall()}

            assigned_in_this_batch: set[int] = set()
            total_assigned = 0
            today = str(_date.today())

            for assignment in assignments:
                user_id = assignment.get("user_id")
                nichos = assignment.get("nichos", [])
                quantity = assignment.get("quantity", 0)

                if not user_id or not nichos or quantity <= 0:
                    continue

                nichos_lower = [n.lower() for n in nichos if n]
                assigned_count = 0

                for company_name, company_id in inserted_companies.items():
                    if assigned_count >= quantity:
                        break
                    if company_id in already_assigned_global or company_id in assigned_in_this_batch:
                        continue

                    lead_obj = next((l for l in leads if l.get("company_name") == company_name), None)
                    if not lead_obj:
                        continue

                    company_industry = (lead_obj.get("industry") or "").lower()
                    company_sub = (lead_obj.get("sub_industry") or "").lower()

                    if any(n in company_industry or n in company_sub for n in nichos_lower):
                        await conn.execute(
                            """INSERT INTO lu_daily_assignments
                               (company_id, user_id, assigned_date, status)
                               VALUES (?, ?, ?, 'pending')
                               ON CONFLICT DO NOTHING""",
                            (company_id, user_id, today),
                        )
                        await conn.commit()
                        assigned_in_this_batch.add(company_id)
                        assigned_count += 1
                        total_assigned += 1

        # Enrich hooks/opening_lines in background — preserves computed scores
        company_ids = list(inserted_companies.values())
        if company_ids:
            background_tasks.add_task(_enrich_imported, company_ids)
            logger.info(f"Queued enrichment for {len(company_ids)} companies")

        return {
            "success": True,
            "companies_imported": len(inserted_companies),
            "contacts_imported": len(inserted_contacts),
            "assignments_created": total_assigned,
            "skipped_already_assigned": len(already_assigned_global),
            "enrichment": f"Enriquecimiento de {len(company_ids)} empresas iniciado en segundo plano",
        }
    except Exception as e:
        logger.exception("assign_leads failed")
        raise HTTPException(status_code=400, detail=str(e))
