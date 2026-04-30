"""Reusable provider-native tool loop runtime."""

from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any, TypedDict, TypeVar

from ai_service.errors import StructuredOutputError
from ai_service.logging_utils import compact_log, summarize_completion, summarize_tool_calls
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
logger = logging.getLogger(__name__)


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
    request_id: str | None = None,
) -> tuple[ChatCompleteResponse, TPayload]:
    """Run a provider-native tool loop until a final structured payload is returned."""

    if not tools:
        logger.info(
            "provider tool loop skipped because no native tools were exposed | %s",
            compact_log(
                request_id=request_id,
                tool_count=0,
                message_count=len(messages),
            ),
        )
        completion = await chat_service.complete(
            messages=messages,
            config=provider_config,
        )
        logger.info(
            "provider completion received without tool loop | %s",
            compact_log(
                request_id=request_id,
                completion=summarize_completion(completion),
            ),
        )
        return completion, parse_completion(completion)

    total_usage: dict[str, Any] | None = None
    working_messages = list(messages)
    tool_choice = "auto" if len(tools) > 1 else "required"

    for round_index in range(max_rounds):
        logger.info(
            "provider tool loop round started | %s",
            compact_log(
                request_id=request_id,
                round=round_index + 1,
                max_rounds=max_rounds,
                tool_count=len(tools),
                message_count=len(working_messages),
                tool_choice=tool_choice,
            ),
        )
        completion = await chat_service.complete(
            messages=working_messages,
            config=provider_config,
            tools=tools,
            tool_choice=tool_choice,
        )
        total_usage = merge_usage_dicts(total_usage, completion.usage)
        logger.info(
            "provider tool loop completion received | %s",
            compact_log(
                request_id=request_id,
                round=round_index + 1,
                completion=summarize_completion(completion),
                merged_usage=total_usage,
            ),
        )

        try:
            payload = parse_completion(completion)
            completion.usage = total_usage
            logger.info(
                "provider tool loop yielded final payload | %s",
                compact_log(
                    request_id=request_id,
                    round=round_index + 1,
                    total_usage=total_usage,
                ),
            )
            return completion, payload
        except StructuredOutputError:
            tool_calls = extract_completion_tool_calls(completion)
            if not tool_calls:
                logger.exception(
                    "provider tool loop parse failed without tool calls | %s",
                    compact_log(
                        request_id=request_id,
                        round=round_index + 1,
                    ),
                )
                raise
            logger.info(
                "provider tool loop requested read-only tools | %s",
                compact_log(
                    request_id=request_id,
                    round=round_index + 1,
                    tool_calls=summarize_tool_calls(tool_calls),
                ),
            )

        tool_results = await execute_read_only_tools(tool_calls)
        if not tool_results:
            logger.error(
                "provider tool loop produced no executable read-only tool results | %s",
                compact_log(
                    request_id=request_id,
                    round=round_index + 1,
                    tool_calls=summarize_tool_calls(tool_calls),
                ),
            )
            raise StructuredOutputError(detail=unavailable_tool_detail)

        logger.info(
            "provider tool loop read-only tools executed | %s",
            compact_log(
                request_id=request_id,
                round=round_index + 1,
                result_count=len(tool_results),
                result_tools=[result["tool"] for result in tool_results],
            ),
        )
        working_messages.extend(build_tool_loop_messages(tool_calls, tool_results))
        tool_choice = "required"

    logger.error(
        "provider tool loop exhausted max rounds without final submission | %s",
        compact_log(
            request_id=request_id,
            max_rounds=max_rounds,
        ),
    )
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
