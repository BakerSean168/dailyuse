"""Chat-related schemas."""

from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    """A single chat message."""

    role: Literal["system", "user", "assistant"]
    content: str


class ProviderConfig(BaseModel):
    """Configuration for the LLM provider."""

    provider: str  # "openai", "anthropic", etc.
    model: str
    api_key: str
    base_url: str | None = None
    temperature: float = 0.7
    max_tokens: int | None = None


class ChatCompleteRequest(BaseModel):
    """Request for non-streaming chat completion."""

    messages: list[ChatMessage]
    provider_config: ProviderConfig
    request_id: str | None = None


class ChatCompleteResponse(BaseModel):
    """Response for non-streaming chat completion."""

    content: str
    finish_reason: str
    usage: dict | None = None


class ChatStreamRequest(BaseModel):
    """Request for streaming chat completion."""

    messages: list[ChatMessage]
    provider_config: ProviderConfig
    request_id: str | None = None


class ChatStreamChunk(BaseModel):
    """A single chunk in a streaming response."""

    content: str
    finish_reason: str | None = None
