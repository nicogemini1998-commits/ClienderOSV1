from __future__ import annotations
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore", env_file=".env", env_file_encoding="utf-8")

    # JWT — requerido, sin default inseguro
    jwt_secret: str
    jwt_expiry_hours: int = 8
    jwt_algorithm: str = "HS256"

    # APIs
    anthropic_api_key: str = ""
    apify_api_key: str = ""
    lusha_api_key: str = ""
    cios_base_url: str = "http://host.docker.internal:3000"

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/leadup"

    # Server
    port: int = 8002
    frontend_url: str = "http://localhost:5174"
    environment: str = "development"

    # Scheduler
    leads_per_user_per_day: int = 20
    scheduler_hour: int = 8
    scheduler_minute: int = 0

    # Google Maps scraper
    gmaps_enabled: bool = True
    gmaps_results_per_search: int = 20
    gmaps_rate_limit_ms: int = 2500

    # Email (SMTP) para notificaciones
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@cliender.com"
    low_leads_threshold: int = 2


@lru_cache()
def get_settings() -> Settings:
    return Settings()
