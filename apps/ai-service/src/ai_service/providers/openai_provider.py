"""OpenAI-compatible provider adapter."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from ai_service.providers.http_provider import BaseHTTPProvider
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatStreamChunk,
    ProviderConfig,
)

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseHTTPProvider):
    """Adapter for OpenAI-compatible `/chat/completions` endpoints."""

    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Call the provider and return the final message payload."""

        response = await self._http_client.post(
            self._build_url(config),
            json=self._build_payload(messages, config, stream=False),
            headers=self._build_headers(config.api_key),
        )
        data = self.parse_json_response(response, provider_name="openai")

        choice = data["choices"][0]
        return ChatCompleteResponse(
            content=choice["message"]["content"],
            finish_reason=choice["finish_reason"],
            usage=data.get("usage"),
        )

    async def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Yield parsed SSE chunks from the upstream provider."""

        async with self._http_client.stream(
            "POST",
            self._build_url(config),
            json=self._build_payload(messages, config, stream=True),
            headers=self._build_headers(config.api_key),
        ) as response:
            self.raise_for_status(response, provider_name="openai")

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue

                payload = line[6:]
                if payload == "[DONE]":
                    break

                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse OpenAI SSE payload: %s", payload)
                    continue

                choice = data["choices"][0]
                delta = choice.get("delta", {})
                content = delta.get("content", "")
                finish_reason = choice.get("finish_reason")

                if content or finish_reason:
                    yield ChatStreamChunk(
                        content=content,
                        finish_reason=finish_reason,
                    )

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        """Call the provider's embeddings endpoint for dense retrieval vectors."""

        if len(texts) == 0:
            return []

        response = await self._http_client.post(
            self._build_embeddings_url(config),
            json={
                "model": config.embedding_model or self.DEFAULT_EMBEDDING_MODEL,
                "input": texts,
            },
            headers=self._build_headers(config.api_key),
        )
        data = self.parse_json_response(response, provider_name="openai")
        rows = sorted(data.get("data", []), key=lambda item: item.get("index", 0))
        return [list(row.get("embedding", [])) for row in rows]

    def _build_url(self, config: ProviderConfig) -> str:
        """Resolve the effective base URL for this request."""

        base_url = config.base_url or self.DEFAULT_BASE_URL
        return f"{base_url}/chat/completions"

    def _build_embeddings_url(self, config: ProviderConfig) -> str:
        """Resolve the embeddings endpoint for this provider."""

        base_url = config.base_url or self.DEFAULT_BASE_URL
        return f"{base_url}/embeddings"

    def _build_payload(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        stream: bool,
    ) -> dict[str, Any]:
        """Translate our internal chat schema into OpenAI request JSON."""

        payload: dict[str, Any] = {
            "model": config.model,
            "messages": [message.model_dump(mode="json") for message in messages],
            "temperature": config.temperature,
            "stream": stream,
        }

        if config.max_tokens is not None:
            payload["max_tokens"] = config.max_tokens

        return payload

    def _build_headers(self, api_key: str) -> dict[str, str]:
        """Build provider-specific authentication headers."""

        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
