from __future__ import annotations
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_conn

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@router.patch("/{contact_id}")
async def update_contact(
    contact_id: int,
    body: ContactUpdate,
    current_user: dict = Depends(get_current_user),
):
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id FROM lu_contacts WHERE id = ?",
            (contact_id,),
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Contacto no encontrado")

        updates = {k: v for k, v in body.model_dump().items() if v is not None}

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            await conn.execute(
                f"UPDATE lu_contacts SET {set_clause} WHERE id = ?",
                [*updates.values(), contact_id],
            )
            await conn.commit()

        cursor = await conn.execute(
            "SELECT id, name, title, phone, email FROM lu_contacts WHERE id = ?",
            (contact_id,),
        )
        row = await cursor.fetchone()

    return {
        "id": row["id"],
        "name": row["name"],
        "title": row["title"],
        "phone": row["phone"],
        "email": row["email"],
    }
