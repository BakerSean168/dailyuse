"""Application settings using pydantic-settings."""

import os
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_workspace_root() -> Path:
    """Locate the monorepo root so ai-service shares the root env files."""

    current_file = Path(__file__).resolve()
    for candidate in current_file.parents:
        if (candidate / "pnpm-workspace.yaml").exists():
            return candidate

    raise RuntimeError("Could not locate workspace root for ai-service settings.")


def _workspace_env_files() -> tuple[str, ...]:
    """Return the workspace-root env file stack in override order."""

    workspace_root = _find_workspace_root()
    node_env = os.getenv("NODE_ENV", "development")
    env_files = (
        workspace_root / ".env",
        workspace_root / f".env.{node_env}",
        workspace_root / ".env.local",
        workspace_root / f".env.{node_env}.local",
    )
    return tuple(str(path) for path in env_files)


class Settings(BaseSettings):
    """Application configuration settings."""

    model_config = SettingsConfigDict(
        env_file=_workspace_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Metadata used in logs, health checks, and outbound headers.
    service_name: str = "ai-service"
    app_version: str = "1.0.0"

    # Shared secret used by trusted internal callers.
    service_secret: str = "development-secret"

    # Debug controls developer-friendly features such as docs exposure.
    debug: bool = False
    log_level: str = "INFO"

    # Outbound provider timeout controls.
    request_timeout_seconds: float = 60.0
    connect_timeout_seconds: float = 10.0

    # Signed requests are rejected if their timestamp is too old or too far in
    # the future relative to the receiver's clock.
    internal_request_max_skew_seconds: int = 300

    # Browser allowlist for local development.
    allowed_origins: str = "http://localhost:3000,http://localhost:4200"

    # Helpful in local development; should stay disabled in production.
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

    @model_validator(mode="after")
    def validate_security_defaults(self) -> "Settings":
        """Fail fast if a production-like environment uses the placeholder secret."""

        if not self.debug and self.service_secret == "development-secret":
            raise ValueError(
                "SERVICE_SECRET must be set explicitly when DEBUG is false."
            )
        return self

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins into a list."""
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings object per process."""

    return Settings()
