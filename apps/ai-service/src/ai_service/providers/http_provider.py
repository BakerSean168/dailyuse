"""Shared HTTP behavior for provider adapters."""

from __future__ import annotations

from abc import ABC
from typing import Any

import httpx

from ai_service.errors import UpstreamProviderError
from ai_service.providers.base import LLMProvider


class BaseHTTPProvider(LLMProvider, ABC):
    """Base class for providers that talk to upstream HTTP APIs."""

    def __init__(self, http_client: httpx.AsyncClient) -> None:
        self._http_client = http_client

    def parse_json_response(
        self, response: httpx.Response, provider_name: str
    ) -> dict[str, Any]:
        """Raise on error and return decoded JSON on success."""

        self.raise_for_status(response, provider_name=provider_name)
        return response.json()

    def raise_for_status(self, response: httpx.Response, provider_name: str) -> None:
        """Translate `httpx` HTTP errors into project-specific exceptions."""

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise UpstreamProviderError(
                detail=(
                    f"{provider_name} returned HTTP {exc.response.status_code} "
                    f"for {exc.request.method} {exc.request.url}"
                ),
                upstream_status_code=exc.response.status_code,
            ) from exc
