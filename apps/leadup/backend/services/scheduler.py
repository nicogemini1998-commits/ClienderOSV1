from __future__ import annotations
"""
Scheduler deshabilitado — sin asignación automática de leads.
Los leads se cargan manualmente via /api/admin/seed-leads.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="Europe/Madrid")
        # No jobs registered — scheduler runs empty, sin borrar ni reasignar leads
    return _scheduler
