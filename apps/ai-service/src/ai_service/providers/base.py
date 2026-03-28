"""Shared abstractions for provider adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

from ai_service.errors import UnsupportedProviderError
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatStreamChunk,
    ProviderConfig,
)


class LLMProvider(ABC):
    """Common interface implemented by every upstream provider adapter."""

    @abstractmethod
    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Return a full completion in one response."""

    @abstractmethod
    def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Yield completion chunks progressively."""

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        """Return vector embeddings for the provided texts."""

        del texts, config
        raise UnsupportedProviderError(
            detail="The selected provider does not implement embeddings."
        )
