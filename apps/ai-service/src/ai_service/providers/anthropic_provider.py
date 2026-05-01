"""Anthropic provider adapter."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from ai_service.errors import UnsupportedProviderError
from ai_service.providers.http_provider import BaseHTTPProvider
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatStreamChunk,
    ChatToolDefinition,
    ProviderConfig,
)

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseHTTPProvider):
    """Adapter for Anthropic's Messages API."""

    DEFAULT_BASE_URL = "https://api.anthropic.com/v1"
    API_VERSION = "2023-06-01"

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools: list[ChatToolDefinition] | None = None,
        tool_choice: str | None = None,
    ) -> ChatCompleteResponse:
        """Call the non-streaming Messages API."""

        if tools or tool_choice:
            raise UnsupportedProviderError(
                detail=("The selected provider does not implement native tool calling.")
            )

        response = await self._http_client.post(
            self._build_url(config),
            json=self._build_payload(messages, config, stream=False),
            headers=self._build_headers(config.api_key),
        )
        data = self.parse_json_response(response, provider_name="anthropic")

        content_blocks = data.get("content", [])
        content = "".join(
            block.get("text", "")
            for block in content_blocks
            if block.get("type") == "text"
        )

        return ChatCompleteResponse(
            content=content,
            finish_reason=data.get("stop_reason", "unknown"),
            usage=data.get("usage"),
        )

    async def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Yield parsed stream events from Anthropic."""

        async with self._http_client.stream(
            "POST",
            self._build_url(config),
            json=self._build_payload(messages, config, stream=True),
            headers=self._build_headers(config.api_key),
        ) as response:
            self.raise_for_status(response, provider_name="anthropic")

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue

                payload = line[6:]

                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse Anthropic SSE payload: %s", payload)
                    continue

                event_type = data.get("type")
                if event_type == "content_block_delta":
                    delta = data.get("delta", {})
                    if delta.get("type") == "text_delta":
                        yield ChatStreamChunk(
                            content=delta.get("text", ""),
                            finish_reason=None,
                        )
                elif event_type == "message_stop":
                    yield ChatStreamChunk(content="", finish_reason="stop")

    def _build_url(self, config: ProviderConfig) -> str:
        """Resolve the effective base URL for this request."""

        base_url = config.base_url or self.DEFAULT_BASE_URL
        return f"{base_url}/messages"

    def _build_payload(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        stream: bool,
    ) -> dict[str, Any]:
        """Translate our internal schema into Anthropic request JSON."""

        system_message: str | None = None
        conversation_messages: list[dict[str, str]] = []

        for message in messages:
            if message.role == "system":
                system_message = message.content
                continue

            conversation_messages.append(
                {
                    "role": message.role,
                    "content": message.content,
                }
            )

        payload: dict[str, Any] = {
            "model": config.model,
            "messages": conversation_messages,
            "stream": stream,
            "max_tokens": config.max_tokens or 4096,
        }

        if system_message:
            payload["system"] = system_message

        if config.temperature != 0.7:
            payload["temperature"] = config.temperature

        return payload

    def _build_headers(self, api_key: str) -> dict[str, str]:
        """Build provider-specific authentication headers."""

        return {
            "x-api-key": api_key,
            "anthropic-version": self.API_VERSION,
            "Content-Type": "application/json",
        }
