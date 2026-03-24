"""Chat service for handling LLM completions."""

import json
import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from functools import lru_cache
from typing import Any

import httpx

from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatStreamChunk,
    ProviderConfig,
)

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Generate a non-streaming completion."""
        pass

    @abstractmethod
    def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Generate a streaming completion."""
        ...


class OpenAIProvider(LLMProvider):
    """OpenAI API provider implementation using httpx."""

    DEFAULT_BASE_URL = "https://api.openai.com/v1"

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Generate a non-streaming completion using OpenAI API."""
        base_url = config.base_url or self.DEFAULT_BASE_URL
        url = f"{base_url}/chat/completions"

        payload = self._build_payload(messages, config, stream=False)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._build_headers(config.api_key),
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

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
        """Generate a streaming completion using OpenAI API."""
        base_url = config.base_url or self.DEFAULT_BASE_URL
        url = f"{base_url}/chat/completions"

        payload = self._build_payload(messages, config, stream=True)

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                url,
                json=payload,
                headers=self._build_headers(config.api_key),
                timeout=60.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:]  # Remove "data: " prefix
                    if data_str == "[DONE]":
                        break

                    try:
                        data = json.loads(data_str)
                        choice = data["choices"][0]
                        delta = choice.get("delta", {})
                        content = delta.get("content", "")
                        finish_reason = choice.get("finish_reason")

                        if content or finish_reason:
                            yield ChatStreamChunk(
                                content=content,
                                finish_reason=finish_reason,
                            )
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse SSE data: {data_str}")
                        continue

    def _build_payload(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        stream: bool,
    ) -> dict[str, Any]:
        """Build the request payload for OpenAI API."""
        payload: dict[str, Any] = {
            "model": config.model,
            "messages": [msg.model_dump() for msg in messages],
            "temperature": config.temperature,
            "stream": stream,
        }

        if config.max_tokens is not None:
            payload["max_tokens"] = config.max_tokens

        return payload

    def _build_headers(self, api_key: str) -> dict[str, str]:
        """Build request headers."""
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }


class AnthropicProvider(LLMProvider):
    """Anthropic API provider implementation using httpx."""

    DEFAULT_BASE_URL = "https://api.anthropic.com/v1"
    API_VERSION = "2023-06-01"

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Generate a non-streaming completion using Anthropic API."""
        base_url = config.base_url or self.DEFAULT_BASE_URL
        url = f"{base_url}/messages"

        payload = self._build_payload(messages, config, stream=False)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._build_headers(config.api_key),
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

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
        """Generate a streaming completion using Anthropic API."""
        base_url = config.base_url or self.DEFAULT_BASE_URL
        url = f"{base_url}/messages"

        payload = self._build_payload(messages, config, stream=True)

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                url,
                json=payload,
                headers=self._build_headers(config.api_key),
                timeout=60.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:]  # Remove "data: " prefix

                    try:
                        data = json.loads(data_str)
                        event_type = data.get("type")

                        if event_type == "content_block_delta":
                            delta = data.get("delta", {})
                            if delta.get("type") == "text_delta":
                                yield ChatStreamChunk(
                                    content=delta.get("text", ""),
                                    finish_reason=None,
                                )
                        elif event_type == "message_stop":
                            yield ChatStreamChunk(
                                content="",
                                finish_reason="stop",
                            )
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse SSE data: {data_str}")
                        continue

    def _build_payload(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        stream: bool,
    ) -> dict[str, Any]:
        """Build the request payload for Anthropic API."""
        # Separate system message from other messages
        system_message = None
        conversation_messages = []

        for msg in messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                conversation_messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })

        payload: dict[str, Any] = {
            "model": config.model,
            "messages": conversation_messages,
            "stream": stream,
            "max_tokens": config.max_tokens or 4096,  # Anthropic requires max_tokens
        }

        if system_message:
            payload["system"] = system_message

        # Anthropic uses top_p instead of temperature directly
        # but we can still pass temperature
        if config.temperature != 0.7:  # Only set if not default
            payload["temperature"] = config.temperature

        return payload

    def _build_headers(self, api_key: str) -> dict[str, str]:
        """Build request headers."""
        return {
            "x-api-key": api_key,
            "anthropic-version": self.API_VERSION,
            "Content-Type": "application/json",
        }


class ChatService:
    """Service for handling chat completions with multiple providers."""

    def __init__(self) -> None:
        """Initialize chat service with provider registry."""
        self._providers: dict[str, LLMProvider] = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
        }

    def get_provider(self, provider_name: str) -> LLMProvider:
        """Get a provider by name."""
        provider = self._providers.get(provider_name.lower())
        if not provider:
            raise ValueError(
                f"Unknown provider: {provider_name}. "
                f"Available providers: {list(self._providers.keys())}"
            )
        return provider

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> ChatCompleteResponse:
        """Generate a non-streaming completion."""
        provider = self.get_provider(config.provider)
        return await provider.complete(messages, config)

    async def stream(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Generate a streaming completion."""
        provider = self.get_provider(config.provider)
        async for chunk in provider.stream(messages, config):
            yield chunk


@lru_cache
def get_chat_service() -> ChatService:
    """Get cached chat service instance."""
    return ChatService()
