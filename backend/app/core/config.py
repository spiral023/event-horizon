import logging
import os
import secrets
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    project_name: str = "event-horizon-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./data.db"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24 * 14
    cors_origins: str = "http://localhost:5173,http://localhost:8080"
    openrouter_api_key: Optional[str] = None
    llm_model: Optional[str] = None

    # Environment detection
    environment: str = "development"  # development, staging, production

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Validate and secure the secret key based on environment."""
        # Check if we're in production
        environment = info.data.get('environment', 'development')

        # CRITICAL: In production, insecure secret key is not allowed
        if environment == 'production' and v == 'change-me':
            raise ValueError(
                "SECURITY ERROR: Default secret_key 'change-me' is not allowed in production! "
                "Set SECRET_KEY environment variable to a secure random value."
            )

        # Warn if using default key in non-production
        if v == 'change-me':
            logger.warning(
                "⚠️  WARNING: Using default SECRET_KEY='change-me'. "
                "This is only acceptable in local development. "
                "Set SECRET_KEY environment variable for production!"
            )

        # Validate key strength (minimum 32 characters recommended)
        if len(v) < 32 and environment == 'production':
            raise ValueError(
                f"SECURITY ERROR: SECRET_KEY too short ({len(v)} chars). "
                "Use at least 32 characters for production. "
                f"Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )

        return v

    @property
    def cors_origin_list(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return list(self.cors_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
