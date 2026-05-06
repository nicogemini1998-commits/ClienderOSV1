from __future__ import annotations
"""
Companies router — enrich endpoint (sales intelligence via Claude Haiku).
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import get_conn
from services.claude_enrichment import enrich_company

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companies", tags=["companies"])


class EnrichRequest(BaseModel):
    industry: Optional[str] = None
    notes: Optional[str] = None


@router.post("/{company_id}/enrich")
async def enrich_company_endpoint(
    company_id: int,
    body: EnrichRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate hooks, opening lines, and CTAs for a company using Claude Haiku.
    Cached for 30 days — subsequent calls return the stored result instantly.
    """
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, name, industry FROM lu_companies WHERE id = ?",
            (company_id,),
        )
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    industry = body.industry or row["industry"]
    company_name = row["name"]

    logger.info(
        "enrich_company company_id=%s user_id=%s name=%r industry=%r",
        company_id,
        current_user["id"],
        company_name,
        industry,
    )

    try:
        result = await enrich_company(
            company_id=company_id,
            company_name=company_name,
            industry=industry,
            notes=body.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("enrich_company company_id=%s error=%s", company_id, exc, exc_info=True)
        raise HTTPException(status_code=503, detail="Error al enriquecer empresa. Intenta de nuevo.")

    return {
        "success": True,
        "data": {
            "enrichment": result["enrichment"],
            "cached": result["cached"],
            "enriched_at": result["enriched_at"],
        },
    }
