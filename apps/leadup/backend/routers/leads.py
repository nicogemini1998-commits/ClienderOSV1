from __future__ import annotations
import json
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import get_current_user
from database import get_conn

router = APIRouter(prefix="/api/leads", tags=["leads"])


class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[str] = None


VALID_STATUSES = {"pending", "no_answer", "closed", "rejected"}


@router.get("/today")
async def get_today_leads(
    current_user: dict = Depends(get_current_user),
):
    """Get today's 20 assigned leads for the current user."""
    today = date.today()

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
                ct.email AS contact_email
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
                "phone": row["contact_phone"],
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
