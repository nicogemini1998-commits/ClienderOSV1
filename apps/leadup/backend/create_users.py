"""
Script de inicialización: inserta los usuarios iniciales en la base de datos.
Ejecutar una sola vez: python create_users.py
"""

import asyncio
import aiosqlite
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import DB_PATH, init_db
from auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INITIAL_USERS = [
    {"name": "Nicolas", "email": "nicolas@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Toni", "email": "toni@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Dan", "email": "dan@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Ruben", "email": "ruben@cliender.com", "password": "Cliender123", "role": "commercial"},
    {"name": "Ethan", "email": "ethan@cliender.com", "password": "Cliender123", "role": "commercial"},
]


async def main() -> None:
    await init_db()

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row

        for user in INITIAL_USERS:
            cursor = await conn.execute(
                "SELECT id FROM lu_users WHERE email = ?", (user["email"],)
            )
            existing = await cursor.fetchone()
            if existing:
                logger.info(f"Usuario ya existe: {user['email']}")
                continue

            password_hash = hash_password(user["password"])
            await conn.execute(
                """
                INSERT INTO lu_users (name, email, password_hash, role)
                VALUES (?, ?, ?, ?)
                """,
                (user["name"], user["email"], password_hash, user["role"]),
            )
            await conn.commit()
            logger.info(f"Usuario creado: {user['email']} ({user['role']})")

    logger.info("Inicialización de usuarios completada.")


if __name__ == "__main__":
    asyncio.run(main())
