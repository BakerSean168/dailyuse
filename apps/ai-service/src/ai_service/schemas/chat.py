"""Chat-related schemas."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ChatMessage(BaseModel):
    """A single chat message."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant", "tool"]
    content: str = ""
    tool_call_id: str | None = None
    tool_calls: list["ChatToolCall"] | None = None

    @model_validator(mode="after")
    def validate_message_shape(self) -> "ChatMessage":
        if self.role in {"system", "user"}:
            if not self.content.strip():
                raise ValueError("System and user messages must include content.")
            if self.tool_call_id or self.tool_calls:
                raise ValueError(
                    "System and user messages cannot include tool metadata."
                )
            return self

        if self.role == "assistant":
            if self.tool_call_id:
                raise ValueError("Assistant messages cannot include tool_call_id.")
            if self.tool_calls:
                return self
            if not self.content.strip():
                raise ValueError(
                    "Assistant messages must include content "
                    "when no tool calls are present."
                )
            return self

        if not self.content.strip():
            raise ValueError("Tool messages must include content.")
        if not self.tool_call_id:
            raise ValueError("Tool messages must include tool_call_id.")
        if self.tool_calls:
            raise ValueError("Tool messages cannot include nested tool calls.")
        return self


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


class ChatToolFunction(BaseModel):
    """Function metadata exposed to tool-capable providers."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1)
    description: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class ChatToolDefinition(BaseModel):
    """Single tool definition passed to the upstream provider."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["function"] = "function"
    function: ChatToolFunction


class ChatToolCallFunction(BaseModel):
    """Function call payload returned by a provider."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1)
    arguments: str = Field(default="")


class ChatToolCall(BaseModel):
    """Tool call emitted by a tool-capable provider."""

    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    type: Literal["function"] = "function"
    function: ChatToolCallFunction


class ChatCompleteRequest(BaseModel):
    """Request for non-streaming chat completion."""

    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage]
    provider_config: ProviderConfig
    request_id: str | None = None


class ChatCompleteResponse(BaseModel):
    """Response for non-streaming chat completion."""

    model_config = ConfigDict(extra="forbid")

    content: str = ""
    finish_reason: str
    usage: dict[str, Any] | None = None
    tool_calls: list[ChatToolCall] | None = Field(default=None, alias="toolCalls")


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
