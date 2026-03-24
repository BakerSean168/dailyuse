"""Application settings using pydantic-settings."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Service authentication
    service_secret: str = "development-secret"

    # Application settings
    debug: bool = False
    log_level: str = "INFO"

    # CORS settings
    allowed_origins: str = "http://localhost:3000,http://localhost:4200"

    # Development settings
    dev_bypass_auth: bool = False

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, v: str) -> str:
        """Normalize log level to Python logging format."""
        level_map = {
            "debug": "DEBUG",
            "info": "INFO",
            "warn": "WARNING",
            "warning": "WARNING",
            "error": "ERROR",
            "critical": "CRITICAL",
        }
        return level_map.get(v.lower(), v.upper()) if isinstance(v, str) else v

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
