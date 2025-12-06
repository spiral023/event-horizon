from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "event-horizon-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./data.db"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24 * 14
    cors_origins: str = "http://localhost:5173,http://localhost:8080"
    openrouter_api_key: Optional[str] = None
    llm_model: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origin_list(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return list(self.cors_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
