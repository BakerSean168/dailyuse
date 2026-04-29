"""Reusable provider-native tool loop runtime."""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any, TypedDict, TypeVar

from ai_service.errors import StructuredOutputError
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatToolCall,
    ChatToolCallFunction,
    ChatToolDefinition,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService

TPayload = TypeVar("TPayload")


class ToolLoopResult(TypedDict):
    """Normalized local result for a read-only provider tool call."""

    toolCallId: str
    tool: str
    result: dict[str, Any]


async def complete_with_tool_loop(
    *,
    chat_service: ChatService,
    messages: list[ChatMessage],
    provider_config: ProviderConfig,
    tools: list[ChatToolDefinition] | None,
    parse_completion: Callable[[Any], TPayload],
    execute_read_only_tools: Callable[[list[Any]], Awaitable[list[ToolLoopResult]]],
    unavailable_tool_detail: str,
    final_submission_missing_detail: str,
    max_rounds: int = 3,
) -> tuple[ChatCompleteResponse, TPayload]:
    """Run a provider-native tool loop until a final structured payload is returned."""

    if not tools:
        completion = await chat_service.complete(
            messages=messages,
            config=provider_config,
        )
        return completion, parse_completion(completion)

    total_usage: dict[str, Any] | None = None
    working_messages = list(messages)
    tool_choice = "auto" if len(tools) > 1 else "required"

    for _ in range(max_rounds):
        completion = await chat_service.complete(
            messages=working_messages,
            config=provider_config,
            tools=tools,
            tool_choice=tool_choice,
        )
        total_usage = merge_usage_dicts(total_usage, completion.usage)

        try:
            payload = parse_completion(completion)
            completion.usage = total_usage
            return completion, payload
        except StructuredOutputError:
            tool_calls = extract_completion_tool_calls(completion)
            if not tool_calls:
                raise

        tool_results = await execute_read_only_tools(tool_calls)
        if not tool_results:
            raise StructuredOutputError(detail=unavailable_tool_detail)

        working_messages.extend(build_tool_loop_messages(tool_calls, tool_results))
        tool_choice = "required"

    raise StructuredOutputError(detail=final_submission_missing_detail)


def extract_completion_tool_calls(completion: Any) -> list[Any]:
    """Normalize provider tool calls into a plain list."""

    tool_calls = getattr(completion, "tool_calls", None)
    return tool_calls if isinstance(tool_calls, list) else []


def build_tool_loop_messages(
    tool_calls: list[Any],
    results: list[ToolLoopResult],
) -> list[ChatMessage]:
    """Convert provider tool calls and local results into structured chat turns."""

    normalized_tool_calls: list[ChatToolCall] = []
    for index, tool_call in enumerate(tool_calls):
        normalized_tool_calls.append(
            ChatToolCall(
                id=tool_call.id or f"tool_call_{index}",
                type=getattr(tool_call, "type", "function") or "function",
                function=ChatToolCallFunction(
                    name=tool_call.function.name,
                    arguments=tool_call.function.arguments,
                ),
            )
        )

    messages = [
        ChatMessage(
            role="assistant",
            content="",
            tool_calls=normalized_tool_calls,
        )
    ]

    for result in results:
        messages.append(
            ChatMessage(
                role="tool",
                content=json.dumps(result["result"], ensure_ascii=False),
                tool_call_id=result["toolCallId"],
            )
        )

    return messages


def merge_usage_dicts(
    left: dict[str, Any] | None,
    right: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Accumulate usage across multiple provider calls in a tool loop."""

    if not left and not right:
        return None

    merged = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    }
    for payload in (left, right):
        if not payload:
            continue
        merged["prompt_tokens"] += int(payload.get("prompt_tokens", 0) or 0)
        merged["completion_tokens"] += int(payload.get("completion_tokens", 0) or 0)
        merged["total_tokens"] += int(payload.get("total_tokens", 0) or 0)
    return merged
