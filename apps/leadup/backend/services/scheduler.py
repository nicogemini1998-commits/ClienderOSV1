from __future__ import annotations
"""
Scheduler deshabilitado — sin asignación automática de leads.
Los leads se cargan manualmente via /api/admin/seed-leads.
"""

import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="Europe/Madrid")
        # Sin jobs — scheduler vacío, no borra ni reasigna leads
    return _scheduler


async def assign_leads_for_user(user_id: int, assign_date: date, count: int = 20) -> int:
    """Stub deshabilitado — los leads se cargan manualmente."""
    logger.info("assign_leads_for_user deshabilitado (scheduler off)")
    return 0


async def trigger_manual_assignment() -> dict:
    """Stub deshabilitado — los leads se cargan manualmente."""
    logger.info("trigger_manual_assignment deshabilitado (scheduler off)")
    return {}
