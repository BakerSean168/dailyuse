"""Shared HTTP client creation."""

from __future__ import annotations

import httpx

from ai_service.config import Settings


def create_shared_async_client(settings: Settings) -> httpx.AsyncClient:
    """Create the shared outbound HTTP client."""

    return httpx.AsyncClient(
        timeout=httpx.Timeout(
            settings.request_timeout_seconds,
            connect=settings.connect_timeout_seconds,
        ),
        headers={
            "User-Agent": f"{settings.service_name}/{settings.app_version}",
        },
    )
