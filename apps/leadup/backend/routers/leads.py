from __future__ import annotations
import json
import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import get_current_user
from database import get_conn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["leads"])


class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[str] = None


VALID_STATUSES = {"pending", "no_answer", "closed", "rejected", "call_later"}


@router.get("/today")
async def get_today_leads(
    current_user: dict = Depends(get_current_user),
):
    """Get today's 20 assigned leads for the current user."""
    today = date.today()
    logger.info(f"Fetching leads for user_id={current_user['id']}, date={today}")

    async with get_conn() as conn:
        cursor = await conn.execute(
            """
            SELECT
                da.id AS assignment_id,
                da.status,
                da.notes,
                da.assigned_date,
                da.follow_up_date,
                c.id AS company_id,
                c.name AS company_name,
                c.website,
                c.city,
                c.industry,
                c.phone AS company_phone,
                c.digital_score,
                c.opportunity_level,
                c.redes_sociales,
                c.captacion_leads,
                c.email_marketing,
                c.video_contenido,
                c.seo_info,
                c.hooks,
                c.opening_lines,
                c.opportunity_analysis,
                c.created_at,
                ct.id AS contact_id,
                ct.name AS contact_name,
                ct.title AS contact_title,
                ct.phone AS contact_phone,
                ct.email AS contact_email,
                ct.lusha_person_id,
                ct.phone_revealed,
                ct.phone_prefix
            FROM lu_daily_assignments da
            JOIN lu_companies c ON da.company_id = c.id
            LEFT JOIN lu_contacts ct ON ct.company_id = c.id
            WHERE da.user_id = ? AND da.assigned_date = ?
            ORDER BY
                CASE da.status
                    WHEN 'pending' THEN 0
                    WHEN 'no_answer' THEN 1
                    WHEN 'closed' THEN 2
                    WHEN 'rejected' THEN 3
                END,
                c.digital_score DESC
            LIMIT 20
            """,
            (current_user["id"], str(today)),
        )
        rows = await cursor.fetchall()

    logger.info(f"Query returned {len(rows)} rows")

    leads = []
    for row in rows:
        hooks = row["hooks"]
        opening_lines = row["opening_lines"]
        if isinstance(hooks, str):
            try:
                hooks = json.loads(hooks)
            except (json.JSONDecodeError, TypeError):
                hooks = []
        if isinstance(opening_lines, str):
            try:
                opening_lines = json.loads(opening_lines)
            except (json.JSONDecodeError, TypeError):
                opening_lines = []

        leads.append({
            "assignment_id": row["assignment_id"],
            "status": row["status"],
            "notes": row["notes"],
            "assigned_date": str(row["assigned_date"]),
            "follow_up_date": row["follow_up_date"],
            "company": {
                "id": row["company_id"],
                "name": row["company_name"],
                "website": row["website"],
                "city": row["city"],
                "industry": row["industry"],
                "phone": row["company_phone"],
                "digital_score": row["digital_score"],
                "opportunity_level": row["opportunity_level"],
                "redes_sociales": bool(row["redes_sociales"]),
                "captacion_leads": bool(row["captacion_leads"]),
                "email_marketing": bool(row["email_marketing"]),
                "video_contenido": bool(row["video_contenido"]),
                "seo_info": bool(row["seo_info"]),
                "hooks": hooks if isinstance(hooks, list) else [],
                "opening_lines": opening_lines if isinstance(opening_lines, list) else [],
                "opportunity_analysis": row["opportunity_analysis"],
                "created_at": str(row["created_at"]),
            },
            "contact": {
                "id": row["contact_id"],
                "name": row["contact_name"],
                "title": row["contact_title"],
                "phone": row["contact_phone"] if row["phone_revealed"] else None,
                "phone_prefix": row["phone_prefix"],
                "phone_revealed": bool(row["phone_revealed"]),
                "lusha_person_id": row["lusha_person_id"],
                "email": row["contact_email"],
            } if row["contact_id"] else None,
        })

    return {"leads": leads, "total": len(leads), "date": str(today)}


@router.patch("/{assignment_id}/status")
async def update_lead_status(
    assignment_id: int,
    body: StatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the status (and optionally notes) of a lead assignment."""
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estado inválido. Valores permitidos: {', '.join(VALID_STATUSES)}",
        )

    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, user_id FROM lu_daily_assignments WHERE id = ?",
            (assignment_id,),
        )
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        # Admins can update any; commercials only their own
        if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este lead")

        await conn.execute(
            """
            UPDATE lu_daily_assignments
            SET status = ?, notes = COALESCE(?, notes)
            WHERE id = ?
            """,
            (body.status, body.notes, assignment_id),
        )
        await conn.commit()

        cursor = await conn.execute(
            "SELECT id, status, notes FROM lu_daily_assignments WHERE id = ?",
            (assignment_id,),
        )
        updated = await cursor.fetchone()

    return {"assignment_id": updated["id"], "status": updated["status"], "notes": updated["notes"]}


@router.post("/{assignment_id}/reveal-phone")
async def reveal_phone(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Reveal full mobile number for a lead contact. Costs one Lusha credit."""
    from services.lusha_leads import reveal_phone as lusha_reveal

    async with get_conn() as conn:
        cursor = await conn.execute(
            """
            SELECT da.user_id, ct.id AS contact_id, ct.lusha_person_id,
                   ct.phone_revealed, ct.phone_prefix
            FROM lu_daily_assignments da
            JOIN lu_companies c ON da.company_id = c.id
            LEFT JOIN lu_contacts ct ON ct.company_id = c.id
            WHERE da.id = ?
            """,
            (assignment_id,),
        )
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    if row["phone_revealed"]:
        # Already revealed — just return current phone
        async with get_conn() as conn:
            cursor = await conn.execute(
                "SELECT phone FROM lu_contacts WHERE id = ?", (row["contact_id"],)
            )
            ct = await cursor.fetchone()
        return {"phone": ct["phone"], "already_revealed": True}

    if not row["lusha_person_id"]:
        raise HTTPException(status_code=422, detail="Este contacto no tiene ID de Lusha para revelar")

    try:
        phone = await lusha_reveal(row["lusha_person_id"])
    except RuntimeError as e:
        raise HTTPException(status_code=402, detail=str(e))

    if not phone:
        raise HTTPException(status_code=404, detail="Lusha no devolvió número para este contacto")

    async with get_conn() as conn:
        await conn.execute(
            "UPDATE lu_contacts SET phone = ?, phone_revealed = 1 WHERE id = ?",
            (phone, row["contact_id"]),
        )
        await conn.commit()

    return {"phone": phone, "already_revealed": False}


@router.post("/{assignment_id}/generate-report")
async def generate_report(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Generate (or return cached) a full sales intelligence report for a lead."""
    from services.report_generator import generate_sales_report

    async with get_conn() as conn:
        cursor = await conn.execute(
            """
            SELECT da.user_id, da.company_id,
                   c.name, c.city, c.website, c.industry,
                   c.digital_score, c.opportunity_level,
                   c.redes_sociales, c.captacion_leads, c.email_marketing,
                   c.video_contenido, c.seo_info,
                   c.hooks, c.opening_lines, c.opportunity_analysis,
                   c.sales_report, c.report_generated_at,
                   ct.id AS contact_id, ct.name AS contact_name,
                   ct.title AS contact_title, ct.email AS contact_email,
                   ct.phone AS contact_phone, ct.phone_revealed,
                   ct.phone_prefix, ct.lusha_person_id
            FROM lu_daily_assignments da
            JOIN lu_companies c ON da.company_id = c.id
            LEFT JOIN lu_contacts ct ON ct.company_id = c.id
            WHERE da.id = ?
            """,
            (assignment_id,),
        )
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Sin permiso")

    # Return cached report if exists
    if row["sales_report"]:
        return {
            "report": row["sales_report"],
            "generated_at": row["report_generated_at"],
            "cached": True,
        }

    company = {
        "id": row["company_id"],
        "name": row["name"],
        "city": row["city"],
        "website": row["website"],
        "industry": row["industry"],
        "digital_score": row["digital_score"],
        "opportunity_level": row["opportunity_level"],
        "redes_sociales": bool(row["redes_sociales"]),
        "captacion_leads": bool(row["captacion_leads"]),
        "email_marketing": bool(row["email_marketing"]),
        "video_contenido": bool(row["video_contenido"]),
        "seo_info": bool(row["seo_info"]),
        "opportunity_analysis": row["opportunity_analysis"],
    }
    contact = {
        "id": row["contact_id"],
        "name": row["contact_name"],
        "title": row["contact_title"],
        "email": row["contact_email"],
        "phone": row["contact_phone"],
        "phone_revealed": bool(row["phone_revealed"]),
        "phone_prefix": row["phone_prefix"],
        "lusha_person_id": row["lusha_person_id"],
    } if row["contact_id"] else None

    try:
        report = await generate_sales_report(company, contact)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando informe: {str(e)}")

    # Cache the report in DB
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE lu_companies SET sales_report = ?, report_generated_at = ? WHERE id = ?",
            (report, now, row["company_id"]),
        )
        await conn.commit()

    return {"report": report, "generated_at": now, "cached": False}


@router.delete("/{assignment_id}/report-cache")
async def clear_report_cache(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Clear cached report so next request regenerates it."""
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT company_id, user_id FROM lu_daily_assignments WHERE id = ?",
            (assignment_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")
        if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Sin permiso")
        await conn.execute(
            "UPDATE lu_companies SET sales_report = NULL, report_generated_at = NULL WHERE id = ?",
            (row["company_id"],),
        )
        await conn.commit()
    return {"cleared": True}


@router.patch("/{assignment_id}/followup")
async def update_follow_up(
    assignment_id: int,
    body: FollowUpUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Set or clear a follow-up reminder date for a lead assignment."""
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, user_id FROM lu_daily_assignments WHERE id = ?",
            (assignment_id,),
        )
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este lead")

        await conn.execute(
            "UPDATE lu_daily_assignments SET follow_up_date = ? WHERE id = ?",
            (body.follow_up_date, assignment_id),
        )
        await conn.commit()

    return {"assignment_id": assignment_id, "follow_up_date": body.follow_up_date}
