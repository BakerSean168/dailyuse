"""Tests for goal automation planning endpoints and service parsing."""

import json
from unittest.mock import AsyncMock, Mock, patch

from ai_service.errors import StructuredOutputError
from ai_service.schemas import GoalAutomationResponse
from ai_service.services.goal_planning_tools import (
    build_goal_automation_submission_tool,
)


def test_submission_tool_uses_openai_compatible_schema_subset():
    tool = build_goal_automation_submission_tool()
    schema = tool.function.parameters
    serialized = json.dumps(schema)

    assert schema["required"] == ["summary", "goal", "toolCalls"]
    assert schema["properties"]["goal"]["required"] == [
        "title",
        "description",
    ]
    assert all(
        forbidden not in serialized
        for forbidden in ("$defs", "$ref", "anyOf", '"default"')
    )


class TestGoalAutomationRoute:
    """Tests for the goal automation HTTP endpoint."""

    def test_plan_goal_actions_success(self, client):
        """A valid automation request returns tool calls for TS-side execution."""

        with patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.plan_automation",
            new_callable=AsyncMock,
        ) as mock_plan:
            mock_plan.return_value = GoalAutomationResponse.model_validate(
                {
                    "summary": "Create the goal first, then add supporting structure.",
                    "goal": {
                        "title": "Ship AI automation",
                        "description": "Expose a reviewable automation flow.",
                        "motivation": "Reduce repetitive setup.",
                        "category": "work",
                        "importance": "Important",
                        "tags": ["ai", "automation"],
                        "feasibilityAnalysis": "A focused implementation is enough.",
                        "aiInsights": "Keep side effects on the TS boundary.",
                        "suggestedStartDate": 1,
                        "suggestedEndDate": 2,
                    },
                    "keyResults": [
                        {
                            "title": "Add automation approval",
                            "description": "Require user confirmation.",
                            "targetValue": 1,
                            "unit": "milestone",
                        }
                    ],
                    "taskTemplates": [
                        {
                            "name": "Review AI plan",
                            "description": "Confirm actions before execution.",
                            "importance": "Important",
                            "cadence": "once",
                        }
                    ],
                    "toolCalls": [
                        {
                            "tool": "create_goal",
                            "rationale": "Create the main goal first.",
                        }
                    ],
                    "usage": {
                        "prompt_tokens": 14,
                        "completion_tokens": 9,
                        "total_tokens": 23,
                    },
                }
            )

            response = client.post(
                "/internal/workflows/goal-automation",
                json={
                    "idea": "Use explicit tool calls to automate goal setup.",
                    "include_key_results": True,
                    "include_task_templates": True,
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["summary"].startswith("Create the goal first")
            assert data["toolCalls"][0]["tool"] == "create_goal"


class TestGoalAutomationService:
    """Tests for goal automation payload parsing."""

    async def test_search_notes_tool_call_runs_read_only_tool_loop(self):
        """search_notes should run locally before the model submits the final plan."""

        from ai_service.schemas import (
            ChatCompleteResponse,
            ChatToolCall,
            ChatToolCallFunction,
            KnowledgeCitation,
            KnowledgeNoteDocument,
        )
        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService
        from ai_service.services.knowledge_query_service import KnowledgeQueryService

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
                            arguments=(
                                '{"query":"approval workflow",'
                                ' "maxCitations": 2}'
                            ),
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
                            arguments=json.dumps(
                                {
                                    "summary": (
                                        "Create the goal with explicit "
                                        "approval steps."
                                    ),
                                    "goal": {
                                        "title": "Ship AI automation",
                                        "description": (
                                            "Expose a reviewable "
                                            "automation flow."
                                        ),
                                        "motivation": "Reduce repetitive setup.",
                                        "category": "work",
                                        "importance": "Important",
                                        "tags": ["ai", "automation"],
                                        "feasibilityAnalysis": (
                                            "A focused implementation "
                                            "is enough."
                                        ),
                                        "aiInsights": (
                                            "Use repository evidence "
                                            "before proposing actions."
                                        ),
                                        "suggestedDurationDays": 14,
                                    },
                                    "keyResults": [],
                                    "taskTemplates": [],
                                    "toolCalls": [
                                        {
                                            "tool": "create_goal",
                                            "rationale": (
                                                "Create the main goal first."
                                            ),
                                        }
                                    ],
                                }
                            ),
                        ),
                    )
                ],
                usage={"prompt_tokens": 6, "completion_tokens": 8, "total_tokens": 14},
            ),
        ]
        indexing_service = Mock()
        indexing_service.index_note.side_effect = lambda resource: Mock(
            identity_id=resource.identity_id,
            repository_id=resource.repository_id,
            resource_id=resource.resource_id,
            resource_path=resource.resource_path,
            title=resource.title,
            mime_type=resource.mime_type,
            content_hash="hash",
            summary="summary",
            keywords=["approval"],
            embedding=[],
            chunks=[],
            metadata=resource.metadata,
        )
        knowledge_query_service = AsyncMock(spec=KnowledgeQueryService)
        knowledge_query_service.select_citations.return_value = [
            KnowledgeCitation(
                resource_id="resource-1",
                resource_path="notes/approval.md",
                title="Approval Notes",
                chunk_index=0,
                excerpt="Always confirm side effects before creating a goal.",
                score=4.2,
            )
        ]
        service = GoalPlanningService(
            chat_service,
            indexing_service,
            knowledge_query_service,
        )

        result = await service.plan_automation(
            idea="Use notes to improve the approval workflow plan.",
            category=None,
            timeframe=None,
            include_key_results=True,
            include_task_templates=True,
            related_resources=[
                KnowledgeNoteDocument(
                    identity_id="identity-1",
                    repository_id="repo-1",
                    resource_id="resource-1",
                    resource_path="notes/approval.md",
                    title="Approval Notes",
                    mime_type="text/markdown",
                    content="Always confirm side effects before creating a goal.",
                )
            ],
            provider_config={
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        )

        assert result.summary.startswith("Create the goal")
        assert result.tool_calls[0].tool == "create_goal"
        assert chat_service.complete.await_count == 2
        assert chat_service.complete.await_args_list[0].kwargs["tool_choice"] == "auto"
        assert (
            chat_service.complete.await_args_list[1].kwargs["tool_choice"] == "required"
        )
        follow_up_messages = chat_service.complete.await_args_list[1].kwargs["messages"]
        assert follow_up_messages[-2].role == "assistant"
        assert follow_up_messages[-2].tool_calls is not None
        assert follow_up_messages[-2].tool_calls[0].function.name == "search_notes"
        assert follow_up_messages[-1].role == "tool"
        assert follow_up_messages[-1].tool_call_id == "call_search_1"
        knowledge_query_service.select_citations.assert_awaited_once()

    async def test_fetch_stats_tool_call_runs_read_only_tool_loop(self):
        """fetch_stats should run from analytics before final plan submission."""

        from ai_service.schemas import (
            AnalyticsQueryContext,
            AnalyticsQueryResponse,
            ChatCompleteResponse,
            ChatToolCall,
            ChatToolCallFunction,
        )
        from ai_service.services.analytics_query_service import AnalyticsQueryService
        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.side_effect = [
            ChatCompleteResponse(
                content="",
                finish_reason="tool_calls",
                toolCalls=[
                    ChatToolCall(
                        id="call_stats_1",
                        function=ChatToolCallFunction(
                            name="fetch_stats",
                            arguments='{"question":"What is the current workload?"}',
                        ),
                    )
                ],
                usage={"prompt_tokens": 9, "completion_tokens": 4, "total_tokens": 13},
            ),
            ChatCompleteResponse(
                content="",
                finish_reason="tool_calls",
                toolCalls=[
                    ChatToolCall(
                        id="call_submit_2",
                        function=ChatToolCallFunction(
                            name="submit_goal_automation_plan",
                            arguments=json.dumps(
                                {
                                    "summary": (
                                        "Create the goal with realistic "
                                        "workload expectations."
                                    ),
                                    "goal": {
                                        "title": (
                                            "Stabilize AI workflow delivery"
                                        ),
                                        "description": (
                                            "Ship the remaining workflow "
                                            "milestones with a realistic "
                                            "load."
                                        ),
                                        "motivation": "Reduce planning drift.",
                                        "category": "work",
                                        "importance": "Important",
                                        "tags": ["ai", "workflow"],
                                        "feasibilityAnalysis": (
                                            "Current workload supports a "
                                            "focused iteration."
                                        ),
                                        "aiInsights": (
                                            "Use current task pressure "
                                            "to avoid overcommitting."
                                        ),
                                        "suggestedDurationDays": 10,
                                    },
                                    "keyResults": [],
                                    "taskTemplates": [],
                                    "toolCalls": [
                                        {
                                            "tool": "create_goal",
                                            "rationale": (
                                                "Create the main goal first."
                                            ),
                                        }
                                    ],
                                }
                            ),
                        ),
                    )
                ],
                usage={"prompt_tokens": 7, "completion_tokens": 7, "total_tokens": 14},
            ),
        ]
        analytics_query_service = AsyncMock(spec=AnalyticsQueryService)
        analytics_query_service.query.return_value = AnalyticsQueryResponse(
            answer=(
                "There are 3 active goals and 7 open tasks, "
                "so keep the scope tight."
            ),
            highlights=["activeGoals: 3", "task.totalTasks: 7"],
            usage={"prompt_tokens": 5, "completion_tokens": 3, "total_tokens": 8},
        )
        service = GoalPlanningService(
            chat_service,
            analytics_query_service=analytics_query_service,
        )

        result = await service.plan_automation(
            idea="Use current workload data to right-size the plan.",
            category=None,
            timeframe=None,
            include_key_results=True,
            include_task_templates=True,
            analytics_context=AnalyticsQueryContext(
                dashboard={"stats": {"activeGoals": 3}},
                task_dashboard={"summary": {"totalTasks": 7}},
                goals=[],
                goal_search_results=[],
                extra={},
            ),
            provider_config={
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        )

        assert result.summary.startswith("Create the goal")
        assert result.tool_calls[0].tool == "create_goal"
        assert chat_service.complete.await_count == 2
        assert chat_service.complete.await_args_list[0].kwargs["tool_choice"] == "auto"
        follow_up_messages = chat_service.complete.await_args_list[1].kwargs["messages"]
        assert follow_up_messages[-2].role == "assistant"
        assert follow_up_messages[-2].tool_calls is not None
        assert follow_up_messages[-2].tool_calls[0].function.name == "fetch_stats"
        assert follow_up_messages[-1].role == "tool"
        assert follow_up_messages[-1].tool_call_id == "call_stats_1"
        analytics_query_service.query.assert_awaited_once()

    async def test_native_tool_call_payload_builds_automation_response(self):
        """OpenAI-style tool calls should be parsed into the legacy response shape."""

        from ai_service.schemas import (
            ChatCompleteResponse,
            ChatToolCall,
            ChatToolCallFunction,
        )
        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value = ChatCompleteResponse(
            content="",
            finish_reason="tool_calls",
            toolCalls=[
                ChatToolCall(
                    id="call_1",
                    function=ChatToolCallFunction(
                        name="submit_goal_automation_plan",
                        arguments=json.dumps(
                            {
                                "summary": (
                                    "Create the goal and supporting "
                                    "structure."
                                ),
                                "goal": {
                                    "title": "Ship AI automation",
                                    "description": (
                                        "Expose a reviewable "
                                        "automation flow."
                                    ),
                                    "motivation": "Reduce repetitive setup.",
                                    "category": "work",
                                    "importance": "Important",
                                    "tags": ["ai", "automation"],
                                    "feasibilityAnalysis": (
                                        "A focused implementation "
                                        "is enough."
                                    ),
                                    "aiInsights": (
                                        "Keep side effects on the "
                                        "TS boundary."
                                    ),
                                    "suggestedDurationDays": 14,
                                },
                                "keyResults": [
                                    {
                                        "title": "Add automation approval",
                                        "description": (
                                            "Require user confirmation."
                                        ),
                                        "targetValue": 1,
                                        "unit": "milestone",
                                    }
                                ],
                                "taskTemplates": [
                                    {
                                        "name": "Review AI plan",
                                        "description": (
                                            "Confirm actions before "
                                            "execution."
                                        ),
                                        "importance": "Important",
                                        "cadence": "once",
                                    }
                                ],
                                "toolCalls": [
                                    {
                                        "tool": "create_goal",
                                        "rationale": (
                                            "Create the main goal first."
                                        ),
                                    }
                                ],
                            }
                        ),
                    ),
                )
            ],
            usage={"prompt_tokens": 14, "completion_tokens": 9, "total_tokens": 23},
        )
        service = GoalPlanningService(chat_service)

        result = await service.plan_automation(
            idea="Use explicit tool calls to automate goal setup.",
            category=None,
            timeframe=None,
            include_key_results=True,
            include_task_templates=True,
            provider_config={
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        )

        assert result.summary.startswith("Create the goal")
        assert result.tool_calls[0].tool == "create_goal"
        chat_service.complete.assert_awaited_once()
        assert chat_service.complete.await_args.kwargs["tool_choice"] == "required"
        assert (
            chat_service.complete.await_args.kwargs["tools"][0].function.name
            == "submit_goal_automation_plan"
        )

    async def test_invalid_json_raises_structured_output_error(self):
        """Malformed JSON from the provider should fail cleanly."""

        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value.content = "not json"
        chat_service.complete.return_value.usage = None
        service = GoalPlanningService(chat_service)

        try:
            await service.plan_automation(
                idea="Automate goal setup with audited tool execution.",
                category=None,
                timeframe=None,
                include_key_results=True,
                include_task_templates=True,
                provider_config={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "api_key": "secret",
                },
            )
        except StructuredOutputError as exc:
            assert (
                exc.detail
                == "Provider returned invalid JSON for goal automation planning."
            )
        else:
            raise AssertionError("StructuredOutputError was not raised")
