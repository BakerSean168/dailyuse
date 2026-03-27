"""Provider registry assembly helpers."""

from __future__ import annotations

import httpx

from ai_service.providers import AnthropicProvider, LLMProvider, OpenAIProvider


def create_provider_registry(
    http_client: httpx.AsyncClient,
) -> dict[str, LLMProvider]:
    """Build the provider registry used by `ChatService`."""

    return {
        "openai": OpenAIProvider(http_client=http_client),
        "anthropic": AnthropicProvider(http_client=http_client),
    }
