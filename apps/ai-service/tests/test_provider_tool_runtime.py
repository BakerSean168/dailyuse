"""Tests for the reusable provider tool-loop runtime."""

from unittest.mock import AsyncMock

import pytest

from ai_service.errors import StructuredOutputError
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    ChatToolCall,
    ChatToolCallFunction,
)
from ai_service.services.chat_service import ChatService
from ai_service.services.provider_tool_runtime import (
    build_tool_loop_messages,
    complete_with_tool_loop,
)


def parse_submission_only_completion(completion):
    """Accept only the final submission tool call."""

    if completion.tool_calls:
        for tool_call in completion.tool_calls:
            if tool_call.function.name == "submit_goal_automation_plan":
                return {"state": "submitted"}

    raise StructuredOutputError(detail="expected final submission tool call")


class TestProviderToolRuntime:
    """Tests for the extracted provider-native tool loop."""

    def test_build_tool_loop_messages_creates_structured_turns(self):
        """Provider tool calls and local results should become assistant/tool messages."""

        messages = build_tool_loop_messages(
            [
                ChatToolCall(
                    id="call_1",
                    function=ChatToolCallFunction(
                        name="search_notes",
                        arguments='{"query":"approval"}',
                    ),
                )
            ],
            [
                {
                    "toolCallId": "call_1",
                    "tool": "search_notes",
                    "result": {"query": "approval", "citations": []},
                }
            ],
        )

        assert messages[0].role == "assistant"
        assert messages[0].tool_calls is not None
        assert messages[0].tool_calls[0].function.name == "search_notes"
        assert messages[1].role == "tool"
        assert messages[1].tool_call_id == "call_1"
        assert messages[1].content == '{"query": "approval", "citations": []}'

    @pytest.mark.asyncio
    async def test_complete_with_tool_loop_supports_single_pass_completions(self):
        """When no tools are exposed, the runtime should return a direct completion."""

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value = ChatCompleteResponse(
            content="",
            finish_reason="tool_calls",
            toolCalls=[
                ChatToolCall(
                    id="call_submit_1",
                    function=ChatToolCallFunction(
                        name="submit_goal_automation_plan",
                        arguments='{"summary":"ok"}',
                    ),
                )
            ],
            usage={"prompt_tokens": 10, "completion_tokens": 4, "total_tokens": 14},
        )

        completion, payload = await complete_with_tool_loop(
            chat_service=chat_service,
            messages=[ChatMessage(role="user", content="Plan this goal.")],
            provider_config={
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
            tools=[],
            parse_completion=parse_submission_only_completion,
            execute_read_only_tools=AsyncMock(),
            unavailable_tool_detail="unavailable",
            final_submission_missing_detail="missing submission",
        )

        assert payload == {"state": "submitted"}
        assert completion.usage == {"prompt_tokens": 10, "completion_tokens": 4, "total_tokens": 14}

    @pytest.mark.asyncio
    async def test_complete_with_tool_loop_runs_read_only_rounds(self):
        """A read-only tool round should be replayed as assistant/tool messages."""

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.side_effect = [
            ChatCompleteResponse(
                content="",
                finish_reason="tool_calls",
                toolCalls=[
                    ChatToolCall(
                        id="call_search_1",
                        function=ChatToolCallFunction(
                            name="search_notes",
                            arguments='{"query":"approval"}',
                        ),
                    )
                ],
                usage={"prompt_tokens": 10, "completion_tokens": 4, "total_tokens": 14},
            ),
            ChatCompleteResponse(
                content="",
                finish_reason="tool_calls",
                toolCalls=[
                    ChatToolCall(
                        id="call_submit_1",
                        function=ChatToolCallFunction(
                            name="submit_goal_automation_plan",
                            arguments='{"summary":"ok"}',
                        ),
                    )
                ],
                usage={"prompt_tokens": 6, "completion_tokens": 8, "total_tokens": 14},
            ),
        ]
        execute_read_only_tools = AsyncMock(
            return_value=[
                {
                    "toolCallId": "call_search_1",
                    "tool": "search_notes",
                    "result": {"query": "approval", "citations": []},
                }
            ]
        )

        completion, payload = await complete_with_tool_loop(
            chat_service=chat_service,
            messages=[ChatMessage(role="user", content="Plan this goal.")],
            provider_config={
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
            tools=[object()],
            parse_completion=parse_submission_only_completion,
            execute_read_only_tools=execute_read_only_tools,
            unavailable_tool_detail="unavailable",
            final_submission_missing_detail="missing submission",
        )

        assert payload == {"state": "submitted"}
        assert completion.usage == {
            "prompt_tokens": 16,
            "completion_tokens": 12,
            "total_tokens": 28,
        }
        follow_up_messages = chat_service.complete.await_args_list[1].kwargs["messages"]
        assert follow_up_messages[-2].role == "assistant"
        assert follow_up_messages[-1].role == "tool"
        execute_read_only_tools.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_complete_with_tool_loop_rejects_empty_tool_results(self):
        """An empty read-only result set should surface the configured runtime error."""

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value = ChatCompleteResponse(
            content="",
            finish_reason="tool_calls",
            toolCalls=[
                ChatToolCall(
                    id="call_search_1",
                    function=ChatToolCallFunction(
                        name="search_notes",
                        arguments='{"query":"approval"}',
                    ),
                )
            ],
            usage={"prompt_tokens": 10, "completion_tokens": 4, "total_tokens": 14},
        )

        with pytest.raises(StructuredOutputError, match="unavailable"):
            await complete_with_tool_loop(
                chat_service=chat_service,
                messages=[ChatMessage(role="user", content="Plan this goal.")],
                provider_config={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "api_key": "secret",
                },
                tools=[object()],
                parse_completion=parse_submission_only_completion,
                execute_read_only_tools=AsyncMock(return_value=[]),
                unavailable_tool_detail="unavailable",
                final_submission_missing_detail="missing submission",
            )
