"""Application service that orchestrates chat completions.

The chat service intentionally stays small. It should answer questions like:
- which provider should handle this request?
- which internal schema is used between the API and provider layers?

It should not know about HTTP routes or FastAPI request objects.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import httpx

from ai_service.errors import UnsupportedProviderError
from ai_service.providers import LLMProvider
from ai_service.providers.factory import create_provider_registry
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatStreamChunk,
    ChatToolDefinition,
    ProviderConfig,
)


class ChatService:
    """Thin orchestration layer over the provider registry."""

    def __init__(self, providers: dict[str, LLMProvider]) -> None:
        self._providers = providers

    def get_provider(self, provider_name: str) -> LLMProvider:
        """Resolve the provider adapter for the requested provider name."""

        provider = self._providers.get(provider_name.lower())
        if provider is None:
            available_providers = ", ".join(sorted(self._providers))
            raise UnsupportedProviderError(
                detail=(
                    f"Unknown provider '{provider_name}'. "
                    f"Available providers: {available_providers}"
                )
            )
        return provider

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools: list[ChatToolDefinition] | None = None,
        tool_choice: str | None = None,
    ) -> ChatCompleteResponse:
        """Delegate non-streaming completion work to the selected provider."""

        provider = self.get_provider(config.provider)
        return await provider.complete(
            messages,
            config,
            tools=tools,
            tool_choice=tool_choice,
        )

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        """Delegate embedding work to the selected provider."""

        provider = self.get_provider(config.provider)
        return await provider.embed(texts, config)

    async def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Delegate streaming work to the selected provider."""

        provider = self.get_provider(config.provider)
        async for chunk in provider.stream(messages, config):
            yield chunk


def create_chat_service(http_client: httpx.AsyncClient) -> ChatService:
    """Create the shared chat service used by the app."""

    providers = create_provider_registry(http_client=http_client)
    return ChatService(providers=providers)
