"""Chat-related schemas."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    """A single chat message."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)


class ProviderConfig(BaseModel):
    """Configuration for the LLM provider."""

    model_config = ConfigDict(extra="forbid")

    provider: str = Field(..., min_length=1)
    model: str
    embedding_model: str | None = None
    api_key: str
    base_url: str | None = None
    temperature: float = 0.7
    max_tokens: int | None = None


class ChatCompleteRequest(BaseModel):
    """Request for non-streaming chat completion."""

    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage]
    provider_config: ProviderConfig
    request_id: str | None = None


class ChatCompleteResponse(BaseModel):
    """Response for non-streaming chat completion."""

    model_config = ConfigDict(extra="forbid")

    content: str
    finish_reason: str
    usage: dict[str, Any] | None = None


class ChatStreamRequest(BaseModel):
    """Request for streaming chat completion."""

    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage]
    provider_config: ProviderConfig
    request_id: str | None = None


class ChatStreamChunk(BaseModel):
    """A single chunk in a streaming response."""

    model_config = ConfigDict(extra="forbid")

    content: str
    finish_reason: str | None = None
