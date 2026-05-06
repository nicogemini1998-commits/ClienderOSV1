from __future__ import annotations
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings
from database import init_db
from services.scheduler import get_scheduler
from routers import auth, leads, admin, notes, contacts, reminders, companies
from init_db import initialize_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("LeadUp API starting up...")
    await init_db()
    await initialize_db()  # Initialize users and test leads
    scheduler = get_scheduler()
    scheduler.start()
    logger.info(f"Scheduler started — daily job at {settings.scheduler_hour:02d}:{settings.scheduler_minute:02d} Madrid time")
    yield
    # Shutdown
    logger.info("LeadUp API shutting down...")
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="LeadUp API",
    description="CRM de prospección B2B para Cliender",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow frontend dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        settings.frontend_url.replace("localhost", "127.0.0.1"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (register before static files to avoid conflicts)
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(admin.router)
app.include_router(notes.router)
app.include_router(contacts.router)
app.include_router(reminders.router)
app.include_router(companies.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )


# Serve static frontend files (SPA) - Mount AFTER routers so /api/* routes work
from pathlib import Path
if Path('static').exists():
    app.mount('/', StaticFiles(directory='static', html=True), name='static')


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info",
    )
