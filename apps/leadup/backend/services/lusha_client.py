from __future__ import annotations
"""
Lusha contact reveal — phone/email por crédito.
Cache permanente en DB: una vez revelado, nunca se vuelve a cobrar.
"""

import logging
import uuid
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

LUSHA_REVEAL_URL = "https://api.lusha.com/v2/person"
_TIMEOUT = 15.0
_MAX_RETRIES = 3


def _headers() -> dict[str, str]:
    return {
        "api_key": get_settings().lusha_api_key,
        "Content-Type": "application/json",
    }


async def reveal_contact(
    contact_id: int,
    linkedin_url: str | None,
    full_name: str | None,
    company_name: str | None,
) -> dict[str, Any]:
    """
    Reveal phone/email for a contact via Lusha API v2.

    Returns:
        {
            "phone": str | None,
            "email": str | None,
            "cached": bool,
            "revealed_at": str | None,
        }

    Raises:
        ValueError if LUSHA_API_KEY is not configured.
        httpx.HTTPStatusError for non-retryable HTTP errors.
        RuntimeError if all retries exhausted on timeout.
    """
    from database import get_conn  # local import avoids circular dep at module level

    request_id = str(uuid.uuid4())[:8]
    log = logger.getChild(f"req:{request_id}")

    settings = get_settings()
    if not settings.lusha_api_key:
        raise ValueError("LUSHA_API_KEY no configurada")

    # ── 1. Cache check ────────────────────────────────────────────────────────
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT revealed_phone, revealed_email, revealed_at FROM lu_contacts WHERE id = ?",
            (contact_id,),
        )
        row = await cursor.fetchone()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Contacto no encontrado")

    if row["revealed_phone"] or row["revealed_email"]:
        log.info("contact_id=%s cache_hit=true", contact_id)
        return {
            "phone": row["revealed_phone"],
            "email": row["revealed_email"],
            "cached": True,
            "revealed_at": row["revealed_at"],
        }

    # ── 2. Build Lusha payload ────────────────────────────────────────────────
    payload: dict[str, Any] = {}
    if linkedin_url:
        payload["linkedinUrl"] = linkedin_url
    elif full_name:
        payload["fullName"] = full_name
        if company_name:
            payload["companyName"] = company_name

    if not payload:
        raise ValueError("Se necesita linkedin_url o full_name para revelar contacto")

    log.info("contact_id=%s lusha_reveal=start payload_keys=%s", contact_id, list(payload.keys()))

    # ── 3. Call Lusha with retry on timeout ──────────────────────────────────
    last_exc: Exception | None = None
    data: dict[str, Any] = {}

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.post(LUSHA_REVEAL_URL, json=payload, headers=_headers())

            if resp.status_code == 404:
                log.warning("contact_id=%s lusha=404 contact_not_found", contact_id)
                return {"phone": None, "email": None, "cached": False, "revealed_at": None}

            if resp.status_code == 402:
                log.error("contact_id=%s lusha=402 no_credits", contact_id)
                from fastapi import HTTPException
                raise HTTPException(status_code=402, detail="Sin créditos Lusha disponibles")

            resp.raise_for_status()
            data = resp.json()
            log.info("contact_id=%s lusha=ok attempt=%s", contact_id, attempt)
            break

        except httpx.TimeoutException as exc:
            last_exc = exc
            log.warning("contact_id=%s lusha=timeout attempt=%s/%s", contact_id, attempt, _MAX_RETRIES)
            if attempt == _MAX_RETRIES:
                raise RuntimeError(
                    f"Lusha timeout tras {_MAX_RETRIES} intentos para contact_id={contact_id}"
                ) from exc

    # ── 4. Parse response ────────────────────────────────────────────────────
    phone: str | None = None
    email: str | None = None

    phones = data.get("phones") or []
    if phones:
        phone = phones[0].get("normalizedPhone") or phones[0].get("phone")

    emails = data.get("emails") or []
    if emails:
        email = emails[0].get("email")

    # ── 5. Persist to DB (cache permanently) ─────────────────────────────────
    async with get_conn() as conn:
        await conn.execute(
            """
            UPDATE lu_contacts
            SET revealed_phone = ?,
                revealed_email = ?,
                revealed_at    = datetime('now')
            WHERE id = ?
            """,
            (phone, email, contact_id),
        )
        await conn.commit()

        cursor = await conn.execute(
            "SELECT revealed_phone, revealed_email, revealed_at FROM lu_contacts WHERE id = ?",
            (contact_id,),
        )
        saved = await cursor.fetchone()

    log.info("contact_id=%s phone_found=%s email_found=%s saved=true", contact_id, bool(phone), bool(email))

    return {
        "phone": saved["revealed_phone"],
        "email": saved["revealed_email"],
        "cached": False,
        "revealed_at": saved["revealed_at"],
    }
