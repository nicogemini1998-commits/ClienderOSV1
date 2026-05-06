from __future__ import annotations
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore")

    # JWT
    jwt_secret: str = "leadup_secret_jwt_2024_cambia_esto"
    jwt_expiry_hours: int = 8
    jwt_algorithm: str = "HS256"

    # APIs
    apollo_api_key: str = ""
    anthropic_api_key: str = ""
    apify_api_key: str = ""
    lusha_api_key: str = ""

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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
