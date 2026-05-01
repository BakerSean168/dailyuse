"""Deterministic and live workflow harness for AI goal workflow evals."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Literal, Protocol, cast

from pydantic import BaseModel, ConfigDict, Field

from ai_service.errors import StructuredOutputError
from ai_service.orchestrator.handlers.goal_automation_handler import (
    GoalAutomationWorkflowHandler,
)
from ai_service.orchestrator.handlers.goal_handler import GoalWorkflowHandler
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import (
    AnalyticsQueryContext,
    AnalyticsQueryResponse,
    ChatCompleteResponse,
    ChatMessage,
    GoalAutomationToolCall,
    GoalPlanningResponse,
    KnowledgeResourceDocument,
    ProviderConfig,
)
from ai_service.services.goal_planning_service import GoalPlanningService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)


class GoalWorkflowEvalRequest(BaseModel):
    """Workflow request shared by deterministic and live eval cases."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(..., min_length=10)
    category: str | None = None
    timeframe: str | None = None
    include_key_results: bool = True
    include_task_templates: bool = True


class GoalWorkflowFakeActionOverride(BaseModel):
    """Optional per-action fake execution override."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    tool: str = Field(..., min_length=1)
    index: int | None = None
    status: Literal["executed", "failed", "skipped"] = "executed"
    message: str | None = None
    entity_id: str | None = Field(default=None, alias="entityId")


class GoalWorkflowExpectedOutcome(BaseModel):
    """Expected workflow shape for one eval case."""

    model_config = ConfigDict(extra="forbid")

    stage_sequence: list[Literal["clarification", "draft", "confirm", "result"]] = (
        Field(default_factory=list)
    )
    action_tools: list[str] = Field(default_factory=list)
    execution_status: Literal["success", "partial", "failed"] | None = None
    can_retry: bool | None = None
    goal_terms: list[str] = Field(default_factory=list)
    required_tool_calls: list[str] = Field(default_factory=list)
    required_recovery_terms: list[str] = Field(default_factory=list)
    failure_stage: Literal["clarification", "draft", "prepare", "execute"] | None = None


class GoalWorkflowEvalCase(BaseModel):
    """Structured case for end-to-end goal-workflow evaluation."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: Literal["goal_workflow"]
    description: str
    initial_request: GoalWorkflowEvalRequest
    clarification_answers: list[str] | None = None
    provider_script: list[ChatCompleteResponse] = Field(default_factory=list)
    related_resources: list[KnowledgeResourceDocument] = Field(default_factory=list)
    analytics_context: AnalyticsQueryContext | None = None
    fake_execution: list[GoalWorkflowFakeActionOverride] = Field(default_factory=list)
    expected: GoalWorkflowExpectedOutcome


class GoalWorkflowTrace(BaseModel):
    """Normalized workflow trace for reports and assertions."""

    model_config = ConfigDict(extra="forbid")

    stages: list[str] = Field(default_factory=list)
    tool_calls_seen: list[str] = Field(default_factory=list)
    action_tools: list[str] = Field(default_factory=list)
    executed_actions: list[dict[str, Any]] = Field(default_factory=list)
    execution_summary: dict[str, Any] | None = None
    recovery: dict[str, Any] | None = None
    failure_stage: str | None = None
    failure_detail: str | None = None
    goal_title: str | None = None
    goal_text: str = ""
    clarification_question_count: int = 0
    completion_count: int = 0


class SupportsComplete(Protocol):
    """Minimal chat-service protocol needed by the harness."""

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools=None,
        tool_choice=None,
    ) -> ChatCompleteResponse: ...


class ScriptedChatService:
    """Replay a fixed sequence of provider completions."""

    def __init__(self, responses: Sequence[ChatCompleteResponse]) -> None:
        self._responses = [response.model_copy(deep=True) for response in responses]
        self._cursor = 0

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools=None,
        tool_choice=None,
    ) -> ChatCompleteResponse:
        del messages, config, tools, tool_choice
        if self._cursor >= len(self._responses):
            raise RuntimeError("ScriptedChatService ran out of responses.")

        response = self._responses[self._cursor]
        self._cursor += 1
        return response.model_copy(deep=True)


class RecordingChatService:
    """Wrap a chat service and record requests plus returned tool calls."""

    def __init__(self, delegate: SupportsComplete) -> None:
        self._delegate = delegate
        self.requests: list[dict[str, Any]] = []
        self.completions: list[ChatCompleteResponse] = []

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools=None,
        tool_choice=None,
    ) -> ChatCompleteResponse:
        self.requests.append(
            {
                "messages": [message.model_copy(deep=True) for message in messages],
                "tool_choice": tool_choice,
                "tool_names": [
                    tool.function.name
                    for tool in tools or []
                    if getattr(tool, "function", None)
                ],
            }
        )
        completion = await self._delegate.complete(
            messages,
            config,
            tools=tools,
            tool_choice=tool_choice,
        )
        self.completions.append(completion.model_copy(deep=True))
        return completion

    @property
    def tool_calls_seen(self) -> list[str]:
        names: list[str] = []
        for completion in self.completions:
            for tool_call in completion.tool_calls or []:
                names.append(tool_call.function.name)
        return names


class StaticAnalyticsQueryService:
    """Return deterministic analytics answers without extra provider calls."""

    async def query(
        self,
        *,
        question: str,
        context: AnalyticsQueryContext,
        provider_config: ProviderConfig,
    ) -> AnalyticsQueryResponse:
        del provider_config
        highlights: list[str] = []

        if context.dashboard:
            stats = context.dashboard.get("stats")
            if isinstance(stats, dict):
                for key in ("activeGoals", "activeTasks", "completedToday"):
                    value = stats.get(key)
                    if value is not None:
                        highlights.append(f"{key}: {value}")

        if context.task_dashboard:
            summary = context.task_dashboard.get("summary")
            if isinstance(summary, dict):
                for key in ("totalTasks", "overdue", "highPriority"):
                    value = summary.get(key)
                    if value is not None:
                        highlights.append(f"task.{key}: {value}")

        eval_answer = (
            context.extra.get("evalAnswer") if isinstance(context.extra, dict) else None
        )
        answer = (
            eval_answer
            if isinstance(eval_answer, str) and eval_answer
            else _build_analytics_answer(question, highlights)
        )
        return AnalyticsQueryResponse(
            answer=answer,
            highlights=highlights[:6],
            usage=None,
        )


def _build_analytics_answer(
    question: str, highlights: list[str]
) -> str:
    metrics = (
        "; ".join(highlights) if highlights
        else "no prominent metrics provided."
    )
    return f"Analytics context for '{question}' suggests: {metrics}"


class FakeGoalWorkflowExecutor:
    """Fake execute stage used by workflow evals."""

    def __init__(self, overrides: Sequence[GoalWorkflowFakeActionOverride]) -> None:
        self._overrides = list(overrides)
        self._goal_counter = 0
        self._kr_counter = 0
        self._task_counter = 0

    def execute(
        self, actions: Sequence[GoalAutomationToolCall]
    ) -> list[dict[str, Any]]:
        return [self._execute_action(action) for action in actions]

    def _execute_action(self, action: GoalAutomationToolCall) -> dict[str, Any]:
        override = self._find_override(action)
        status = override.status if override else "executed"
        entity_id = (
            override.entity_id
            if override and override.entity_id is not None
            else self._default_entity_id(action.tool, status)
        )
        message = (
            override.message
            if override and override.message is not None
            else self._default_message(action.tool, status)
        )
        payload: dict[str, Any] = {
            "tool": action.tool,
            "status": status,
            "message": message,
        }
        if entity_id is not None:
            payload["entityId"] = entity_id
        return payload

    def _find_override(
        self,
        action: GoalAutomationToolCall,
    ) -> GoalWorkflowFakeActionOverride | None:
        for override in self._overrides:
            if override.tool != action.tool:
                continue
            if override.index is None or override.index == action.index:
                return override
        return None

    def _default_entity_id(
        self,
        tool: str,
        status: str,
    ) -> str | None:
        if status != "executed":
            return None

        if tool == "create_goal":
            self._goal_counter += 1
            return f"fake-goal-{self._goal_counter}"
        if tool == "create_key_result":
            self._kr_counter += 1
            return f"fake-key-result-{self._kr_counter}"
        if tool == "create_task_template":
            self._task_counter += 1
            return f"fake-task-template-{self._task_counter}"
        return None

    def _default_message(self, tool: str, status: str) -> str:
        if status == "skipped":
            return f"Skipped {tool} during fake execution."
        if status == "failed":
            return f"Fake execution marked {tool} as failed."
        return {
            "create_goal": "Created goal in fake execution.",
            "create_key_result": "Created key result in fake execution.",
            "create_task_template": "Created task template in fake execution.",
            "search_notes": "Read-only note search already resolved during planning.",
            "fetch_stats": (
                "Read-only analytics fetch already resolved during planning."
            ),
        }.get(tool, f"Executed {tool} in fake execution.")


async def run_goal_workflow_case(
    case: GoalWorkflowEvalCase,
    *,
    provider_config: ProviderConfig,
    mode: Literal["deterministic", "live"],
    chat_service: SupportsComplete | None = None,
) -> GoalWorkflowTrace:
    """Run one goal-workflow case against the real planning services."""

    if mode == "deterministic":
        delegate: SupportsComplete = ScriptedChatService(case.provider_script)
    else:
        if chat_service is None:
            raise ValueError(
                "Live goal workflow evals require a chat service instance."
            )
        delegate = chat_service

    recording_chat = RecordingChatService(delegate)
    indexing_service = KnowledgeIndexingService()
    knowledge_query_service = KnowledgeQueryService(
        cast(Any, recording_chat), indexing_service
    )
    analytics_query_service = StaticAnalyticsQueryService()
    goal_planning_service = GoalPlanningService(
        cast(Any, recording_chat),
        indexing_service,
        knowledge_query_service,
        cast(Any, analytics_query_service),
    )
    goal_handler = GoalWorkflowHandler(goal_planning_service)
    goal_automation_handler = GoalAutomationWorkflowHandler(goal_planning_service)
    trace = GoalWorkflowTrace()
    draft_response: GoalPlanningResponse | None = None
    current_stage = "clarification"

    try:
        current_stage = "clarification"
        draft_response = await goal_handler.handle(
            WorkflowContext(
                request_id=f"{case.id}-goal",
                workflow_type="goal",
                input_data={
                    **case.initial_request.model_dump(exclude_none=True),
                    "provider_config": provider_config,
                    "enable_clarification": True,
                },
            )
        )

        if draft_response.state == "clarification":
            trace.stages.append("clarification")
            trace.clarification_question_count = len(
                draft_response.clarification.questions
                if draft_response.clarification
                else []
            )
            if not case.clarification_answers:
                trace.failure_stage = "clarification"
                trace.failure_detail = (
                    "Clarification was required but no "
                    "clarification_answers were supplied."
                )
                return finalize_trace(trace, recording_chat)

            current_stage = "draft"
            draft_response = await goal_handler.handle(
                WorkflowContext(
                    request_id=f"{case.id}-goal-clarified",
                    workflow_type="goal",
                    input_data={
                        **case.initial_request.model_dump(exclude_none=True),
                        "provider_config": provider_config,
                        "enable_clarification": True,
                        "clarification_answers": case.clarification_answers,
                    },
                )
            )

        if draft_response.state != "draft" or draft_response.goal is None:
            trace.failure_stage = "draft"
            trace.failure_detail = "Goal workflow did not return a draft response."
            return finalize_trace(trace, recording_chat)

        trace.stages.append("draft")
        trace.goal_title = draft_response.goal.title
        trace.goal_text = build_goal_text(draft_response)

        current_stage = "prepare"
        automation_response = await goal_automation_handler.handle(
            WorkflowContext(
                request_id=f"{case.id}-automation",
                workflow_type="goal-automation",
                input_data={
                    "idea": build_automation_idea_from_draft(draft_response),
                    "category": case.initial_request.category
                    or draft_response.goal.category,
                    "timeframe": case.initial_request.timeframe,
                    "include_key_results": case.initial_request.include_key_results,
                    "include_task_templates": (
                        case.initial_request.include_task_templates
                    ),
                    "related_resources": list(case.related_resources),
                    "analytics_context": case.analytics_context,
                    "provider_config": provider_config,
                },
            )
        )
        trace.stages.append("confirm")
        trace.action_tools = [action.tool for action in automation_response.tool_calls]

        current_stage = "execute"
        executed_actions = FakeGoalWorkflowExecutor(case.fake_execution).execute(
            automation_response.tool_calls
        )
        trace.executed_actions = executed_actions
        trace.execution_summary = build_execution_summary(executed_actions)
        trace.recovery = build_execution_recovery(executed_actions)
        trace.stages.append("result")
        return finalize_trace(trace, recording_chat)
    except StructuredOutputError as exc:
        trace.failure_stage = current_stage
        trace.failure_detail = exc.detail
        return finalize_trace(trace, recording_chat)
    except Exception as exc:
        trace.failure_stage = current_stage
        trace.failure_detail = str(exc)
        return finalize_trace(trace, recording_chat)


def finalize_trace(
    trace: GoalWorkflowTrace,
    recording_chat: RecordingChatService,
) -> GoalWorkflowTrace:
    """Attach chat-level metadata before returning a trace."""

    return trace.model_copy(
        update={
            "tool_calls_seen": recording_chat.tool_calls_seen,
            "completion_count": len(recording_chat.completions),
        }
    )


def build_goal_text(response: GoalPlanningResponse) -> str:
    """Flatten the draft goal and key results into one search blob."""

    if response.goal is None:
        return ""

    parts = [
        response.goal.title,
        response.goal.description,
        response.goal.motivation,
        response.goal.feasibility_analysis,
        response.goal.ai_insights,
        " ".join(response.goal.tags),
    ]
    for key_result in response.key_results or []:
        parts.extend([key_result.title, key_result.description, key_result.unit])
    return " ".join(part for part in parts if part).strip()


def build_automation_idea_from_draft(response: GoalPlanningResponse) -> str:
    """Mirror the TS-side draft-to-automation idea shaping."""

    if response.goal is None:
        return ""

    lines = [
        f"Goal title: {response.goal.title}",
        f"Goal description: {response.goal.description}",
        f"Category: {response.goal.category}" if response.goal.category else None,
        f"Importance: {response.goal.importance}",
        f"Motivation: {response.goal.motivation}" if response.goal.motivation else None,
        (
            f"Feasibility analysis: {response.goal.feasibility_analysis}"
            if response.goal.feasibility_analysis
            else None
        ),
        f"Tags: {', '.join(response.goal.tags)}" if response.goal.tags else None,
    ]
    if response.key_results:
        lines.append("Key results:")
        for index, item in enumerate(response.key_results, start=1):
            unit = f" {item.unit}" if item.unit else ""
            lines.append(f"{index}. {item.title} | target={item.target_value}{unit}")
    return "\n".join(line for line in lines if line)


def build_execution_summary(
    executed_actions: Sequence[dict[str, Any]],
) -> dict[str, Any]:
    """Summarize fake execution results with TS-compatible status names."""

    executed_count = sum(
        1 for action in executed_actions if action.get("status") == "executed"
    )
    skipped_count = sum(
        1 for action in executed_actions if action.get("status") == "skipped"
    )
    failed_count = sum(
        1 for action in executed_actions if action.get("status") == "failed"
    )

    if failed_count == 0:
        status = "success"
    elif executed_count > 0 or skipped_count > 0:
        status = "partial"
    else:
        status = "failed"

    return {
        "status": status,
        "executedCount": executed_count,
        "skippedCount": skipped_count,
        "failedCount": failed_count,
    }


def build_execution_recovery(
    executed_actions: Sequence[dict[str, Any]],
) -> dict[str, Any]:
    """Build fake recovery guidance using the same semantics as the TS workflow."""

    failed_actions = [
        action for action in executed_actions if action.get("status") == "failed"
    ]
    skipped_actions = [
        action for action in executed_actions if action.get("status") == "skipped"
    ]
    suggestions: list[str] = []

    if any(action.get("tool") == "create_goal" for action in failed_actions):
        suggestions.append(
            "Fix the goal creation error and rerun execute with the same approved plan."
        )
    if any(action.get("tool") == "create_key_result" for action in failed_actions):
        suggestions.append(
            "Confirm the goal exists and the key result drafts "
            "are complete before retrying execution."
        )
    if any(action.get("tool") == "create_task_template" for action in failed_actions):
        suggestions.append(
            "Review task template drafts and task module "
            "configuration before retrying execution."
        )
    if any(action.get("tool") == "search_notes" for action in failed_actions):
        suggestions.append(
            "Refresh repository resources or narrow the "
            "note query before retrying execution."
        )
    if any(action.get("tool") == "fetch_stats" for action in failed_actions):
        suggestions.append(
            "Check analytics availability and rerun execute "
            "after the dashboard context is healthy."
        )
    if skipped_actions:
        suggestions.append("Review skipped actions before rerunning execution.")
    if failed_actions and not suggestions:
        suggestions.append(
            "Review the failed action messages and rerun execute "
            "with the approved plan after fixing the underlying issue."
        )

    return {
        "canRetry": bool(failed_actions),
        "failedActions": failed_actions,
        "suggestions": suggestions,
    }
