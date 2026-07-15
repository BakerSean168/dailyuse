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
    ChatToolCall,
    ChatToolCallFunction,
    ChatToolDefinition,
    ProviderConfig,
)

logger = logging.getLogger(__name__)

# Gemini OpenAI-compatible often returns empty content + finish_reason=length
# when max_tokens is tiny; keep a small practical floor.
OPENAI_COMPATIBLE_MIN_MAX_TOKENS = 64


def normalize_openai_compatible_model_id(model: str | None) -> str:
    """Strip Google AI Studio catalog prefixes like `models/`."""

    return (model or "").strip().removeprefix("models/")


def normalize_openai_compatible_max_tokens(
    max_tokens: int | float | None,
) -> int | None:
    """Clamp tiny max_tokens values that commonly empty Gemini responses."""

    if max_tokens is None:
        return None
    try:
        value = int(max_tokens)
    except (TypeError, ValueError):
        return OPENAI_COMPATIBLE_MIN_MAX_TOKENS
    return max(value, OPENAI_COMPATIBLE_MIN_MAX_TOKENS)


def extract_openai_compatible_message_content(content: Any) -> str:
    """Normalize string or multipartite OpenAI-compatible message content."""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
                continue
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)

    return ""


class OpenAIProvider(BaseHTTPProvider):
    """Adapter for OpenAI-compatible `/chat/completions` endpoints."""

    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools: list[ChatToolDefinition] | None = None,
        tool_choice: str | None = None,
    ) -> ChatCompleteResponse:
        """Call the provider and return the final message payload."""

        response = await self._http_client.post(
            self._build_url(config),
            json=self._build_payload(
                messages,
                config,
                stream=False,
                tools=tools,
                tool_choice=tool_choice,
            ),
            headers=self._build_headers(config.api_key),
        )
        data = self.parse_json_response(response, provider_name="openai")

        choice = data["choices"][0]
        message = choice["message"]
        content = extract_openai_compatible_message_content(message.get("content"))
        finish_reason = choice.get("finish_reason") or "unknown"
        raw_tool_calls = message.get("tool_calls") or None

        if not content.strip() and not raw_tool_calls:
            logger.warning(
                "Provider returned empty content (finish_reason=%s, model=%s)",
                finish_reason,
                normalize_openai_compatible_model_id(config.model),
            )

        return ChatCompleteResponse(
            content=content,
            finish_reason=finish_reason,
            usage=data.get("usage"),
            toolCalls=(
                [
                    ChatToolCall(
                        id=item.get("id"),
                        type=item.get("type", "function"),
                        function=ChatToolCallFunction(
                            name=item["function"]["name"],
                            arguments=item["function"].get("arguments", ""),
                        ),
                    )
                    for item in raw_tool_calls
                ]
                if raw_tool_calls
                else None
            ),
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
                content = extract_openai_compatible_message_content(
                    delta.get("content", "")
                )
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
                "model": normalize_openai_compatible_model_id(
                    config.embedding_model or self.DEFAULT_EMBEDDING_MODEL
                ),
                "input": texts,
            },
            headers=self._build_headers(config.api_key),
        )
        data = self.parse_json_response(response, provider_name="openai")
        rows = sorted(data.get("data", []), key=lambda item: item.get("index", 0))
        return [list(row.get("embedding", [])) for row in rows]

    def _build_url(self, config: ProviderConfig) -> str:
        """Resolve the effective base URL for this request."""

        base_url = (config.base_url or self.DEFAULT_BASE_URL).rstrip("/")
        return f"{base_url}/chat/completions"

    def _build_embeddings_url(self, config: ProviderConfig) -> str:
        """Resolve the embeddings endpoint for this provider."""

        base_url = (config.base_url or self.DEFAULT_BASE_URL).rstrip("/")
        return f"{base_url}/embeddings"

    def _build_payload(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        stream: bool,
        *,
        tools: list[ChatToolDefinition] | None = None,
        tool_choice: str | None = None,
    ) -> dict[str, Any]:
        """Translate our internal chat schema into OpenAI request JSON."""

        model = normalize_openai_compatible_model_id(config.model)
        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                message.model_dump(mode="json", exclude_none=True)
                for message in messages
            ],
            "temperature": config.temperature,
            "stream": stream,
        }

        normalized_max_tokens = normalize_openai_compatible_max_tokens(
            config.max_tokens
        )
        if normalized_max_tokens is not None:
            payload["max_tokens"] = normalized_max_tokens

        if tools:
            payload["tools"] = [tool.model_dump(mode="json") for tool in tools]

        if tool_choice:
            payload["tool_choice"] = tool_choice

        return payload

    def _build_headers(self, api_key: str) -> dict[str, str]:
        """Build provider-specific authentication headers."""

        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
