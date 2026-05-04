from __future__ import annotations
"""
APScheduler: asigna 20 leads diarios a cada usuario activo a las 8:00 AM.
"""

import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import get_settings
from database import get_conn
from services.google_maps_leads import fetch_and_store_leads

logger = logging.getLogger(__name__)
settings = get_settings()

_scheduler: AsyncIOScheduler | None = None


async def assign_leads_for_user(user_id: int, assign_date: date, count: int = 20) -> int:
    """Assign `count` leads to a single user for the given date."""
    async with get_conn() as conn:
        assigned = await fetch_and_store_leads(conn, user_id, target_count=count, assign_date=assign_date)
    return assigned


async def _daily_assignment_job() -> None:
    """Job that runs daily: assigns leads to all active users."""
    logger.info("Starting daily lead assignment job")

    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, name FROM lu_users WHERE lead_search_enabled = 1"
        )
        users = await cursor.fetchall()

    today = date.today()
    for user in users:
        try:
            count = await assign_leads_for_user(
                user["id"],
                today,
                count=settings.leads_per_user_per_day,
            )
            logger.info(f"Assigned {count} leads to {user['name']} (id={user['id']})")
        except Exception as exc:
            logger.error(f"Failed to assign leads to user {user['id']}: {exc}")

    logger.info("Daily lead assignment job completed")


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="Europe/Madrid")
        _scheduler.add_job(
            _daily_assignment_job,
            trigger=CronTrigger(
                hour=settings.scheduler_hour,
                minute=settings.scheduler_minute,
                timezone="Europe/Madrid",
            ),
            id="daily_leads",
            name="Daily Lead Assignment",
            replace_existing=True,
            misfire_grace_time=3600,
        )
    return _scheduler


async def trigger_manual_assignment() -> dict:
    """Trigger immediate lead assignment for all active users."""
    async with get_conn() as conn:
        cursor = await conn.execute(
            "SELECT id, name FROM lu_users WHERE lead_search_enabled = 1"
        )
        users = await cursor.fetchall()

    results = {}
    today = date.today()
    for user in users:
        try:
            count = await assign_leads_for_user(
                user["id"], today, count=settings.leads_per_user_per_day
            )
            results[user["name"]] = count
        except Exception as exc:
            logger.error(f"Manual assignment error for user {user['id']}: {exc}")
            results[user["name"]] = 0

    return results
