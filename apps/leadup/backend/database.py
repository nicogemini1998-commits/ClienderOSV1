from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "leadup.db"


@asynccontextmanager
async def get_conn():
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA foreign_keys = ON")
        yield conn


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA foreign_keys = ON")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS lu_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'commercial',
                lead_search_enabled INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS lu_companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                website TEXT,
                city TEXT,
                industry TEXT,
                phone TEXT,
                rating REAL,
                reviews_count INT,
                digital_score INT DEFAULT 0,
                opportunity_level TEXT DEFAULT 'media',
                redes_sociales INTEGER DEFAULT 0,
                captacion_leads INTEGER DEFAULT 0,
                email_marketing INTEGER DEFAULT 0,
                video_contenido INTEGER DEFAULT 0,
                seo_info INTEGER DEFAULT 0,
                hooks TEXT DEFAULT '[]',
                opening_lines TEXT DEFAULT '[]',
                opportunity_analysis TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS lu_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INT REFERENCES lu_companies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                title TEXT,
                phone TEXT,
                email TEXT,
                apollo_id TEXT UNIQUE,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS lu_daily_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INT REFERENCES lu_companies(id) ON DELETE CASCADE,
                user_id INT REFERENCES lu_users(id) ON DELETE CASCADE,
                assigned_date TEXT DEFAULT (date('now')),
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(company_id, user_id)
            )
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_assignments_user_date
            ON lu_daily_assignments(user_id, assigned_date)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_assignments_status
            ON lu_daily_assignments(status)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_contacts_company
            ON lu_contacts(company_id)
        """)

        await conn.commit()

    logger.info("Database schema initialized")
