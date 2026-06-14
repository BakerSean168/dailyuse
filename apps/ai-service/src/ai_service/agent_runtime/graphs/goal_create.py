"""Minimal LangGraph spike for the goal.create Agent."""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from typing import Any, Protocol, TypedDict, cast

from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from ai_service.agent_runtime.events import (
    append_agent_event,
    append_node_completed_event,
    append_node_lifecycle_events,
    append_node_started_event,
    append_tool_lifecycle_events,
)
from ai_service.schemas import (
    AgentAction,
    AgentActionPlan,
    AgentArtifact,
    AgentExecutedAction,
    AgentMessage,
    AgentResumePayload,
    GoalPlanningResponse,
    ProviderConfig,
)

Clock = Callable[[], int]
GraphUpdate = dict[str, Any]
DAY_MS = 24 * 60 * 60 * 1000
CLARIFICATION_MIN_WORDS = 4
GOAL_CATEGORIES = {
    "work",
    "health",
    "learning",
    "personal",
    "finance",
    "relationship",
    "other",
}


class GoalPlanningCallback(Protocol):
    """Async goal-planning callback owned by the runtime facade."""

    def __call__(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        provider_config: ProviderConfig,
        request_id: str | None = None,
    ) -> Awaitable[GoalPlanningResponse]: ...


class GoalCreateGraphState(TypedDict, total=False):
    """Serializable state used by the experimental goal.create graph."""

    run_id: str
    thread_id: str
    conversation_id: str | None
    identity_id: str
    created_at: int
    updated_at: int
    status: str
    intent: str | None
    stage: str
    idea: str
    category: str | None
    timeframe: str | None
    messages: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    citations: list[dict[str, Any]]
    retrieved_context: list[dict[str, Any]]
    pending_actions: list[dict[str, Any]]
    approved_actions: list[dict[str, Any]]
    executed_actions: list[dict[str, Any]]
    clarification_answers: list[str]
    draft_warnings: list[str]
    usage: dict[str, Any]
    errors: list[str]
    events: list[dict[str, Any]]
    resume_decision: str | None
    provider_config: dict[str, Any] | None
    related_resources: list[dict[str, Any]]
    analytics_context: dict[str, Any] | None
    context_errors: list[dict[str, str]]
    request_id: str | None
    clarification_interrupt: dict[str, Any]
    approval_interrupt: dict[str, Any]
    execution_interrupt: dict[str, Any]


def _required(state: GoalCreateGraphState, key: str) -> Any:
    return cast(dict[str, Any], state)[key]


def _run_id(state: GoalCreateGraphState) -> str:
    return str(_required(state, "run_id"))


def _thread_id(state: GoalCreateGraphState) -> str:
    return str(_required(state, "thread_id"))


def _idea(state: GoalCreateGraphState) -> str:
    return str(_required(state, "idea"))


def _default_clock_ms() -> int:
    return int(time.time() * 1000)


def _goal_title(idea: str) -> str:
    title = " ".join(idea.strip().split())
    if len(title) > 80:
        return f"{title[:77].rstrip()}..."
    return title or "Untitled goal"


def _goal_category(value: str | None) -> str:
    if value in GOAL_CATEGORIES:
        return value
    return "other"


def _meaningful_words(value: str) -> list[str]:
    return [word for word in value.strip().split() if word]


def _needs_clarification(state: GoalCreateGraphState) -> bool:
    if state.get("clarification_answers"):
        return False
    return len(_meaningful_words(_idea(state))) < CLARIFICATION_MIN_WORDS


def _clarification_questions() -> list[dict[str, str]]:
    return [
        {
            "question": "What concrete outcome should this goal produce?",
            "context": "This keeps the generated goal measurable.",
        },
        {
            "question": "When do you want to review or finish it?",
            "context": "A timeframe keeps the plan realistic.",
        },
    ]


def _augment_idea_with_clarification(
    idea: str,
    answers: list[str],
) -> str:
    cleaned = [answer.strip() for answer in answers if answer.strip()]
    if not cleaned:
        return idea
    return "\n".join(
        [
            idea,
            "",
            "Clarification answers:",
            *(f"- {answer}" for answer in cleaned),
        ],
    )


def _draft_key_results(title: str) -> list[dict[str, Any]]:
    return [
        {
            "title": f"Complete weekly progress for {title}",
            "description": (
                "Record one meaningful progress update toward the approved goal "
                "each week."
            ),
            "valueType": "Incremental",
            "calculationMethod": "Sum",
            "startValue": 0,
            "currentValue": 0,
            "targetValue": 12,
            "unit": "updates",
            "weight": 3,
        },
        {
            "title": f"Finish milestone work for {title}",
            "description": (
                "Complete three concrete milestones that demonstrate the goal is "
                "moving from idea to outcome."
            ),
            "valueType": "Incremental",
            "calculationMethod": "Sum",
            "startValue": 0,
            "currentValue": 0,
            "targetValue": 3,
            "unit": "milestones",
            "weight": 2,
        },
    ]


def _draft_task_templates(title: str) -> list[dict[str, Any]]:
    return [
        {
            "name": f"Weekly focus block for {title}",
            "description": (
                "Reserve a recurring block to make and record progress on the "
                "first key result."
            ),
            "importance": "Moderate",
            "cadence": "weekly",
        },
        {
            "name": f"Milestone review for {title}",
            "description": (
                "Review the next milestone, update progress, and decide the next "
                "concrete action."
            ),
            "importance": "Moderate",
            "cadence": "weekly",
        },
    ]


def _draft_reminders(title: str) -> list[dict[str, Any]]:
    return [
        {
            "title": f"Weekly review for {title}",
            "description": (
                "Review goal progress, update key results, and choose the next "
                "week's focus."
            ),
            "importance": "Moderate",
            "cadence": "weekly",
            "timeOfDay": "09:00",
        }
    ]


def _normalize_usage(usage: dict[str, Any] | None) -> dict[str, Any]:
    if not usage:
        return {}
    return {
        "promptTokens": usage.get("promptTokens", usage.get("prompt_tokens")),
        "completionTokens": usage.get(
            "completionTokens",
            usage.get("completion_tokens"),
        ),
        "totalTokens": usage.get("totalTokens", usage.get("total_tokens")),
    }


def _coerce_numeric(value: Any, fallback: float) -> float:
    return value if isinstance(value, int | float) else fallback


def _planner_key_result_payload(item: Any, *, index: int) -> dict[str, Any]:
    data = (
        item.model_dump(by_alias=True, exclude_none=True)
        if hasattr(item, "model_dump")
        else item
    )
    if not isinstance(data, dict):
        data = {}
    target_value = _coerce_numeric(
        data.get("targetValue", data.get("target_value")),
        1,
    )
    return {
        "title": str(data.get("title") or f"Complete key result {index + 1}"),
        "description": data.get("description"),
        "valueType": "Incremental",
        "calculationMethod": "Sum",
        "startValue": 0,
        "currentValue": 0,
        "targetValue": target_value,
        "unit": str(data.get("unit") or "step"),
        "weight": max(1, min(5, 3 if index == 0 else 2)),
    }


def _goal_data_from_planning(
    planning: GoalPlanningResponse,
    *,
    fallback_title: str,
    fallback_start_date: int,
) -> dict[str, Any]:
    if planning.goal is None:
        raise ValueError("GoalPlanningService returned no goal draft payload.")

    goal_data = planning.goal.model_dump(by_alias=True, exclude_none=True)
    title = str(goal_data.get("title") or fallback_title)
    key_results = [
        _planner_key_result_payload(key_result, index=index)
        for index, key_result in enumerate(planning.key_results or [])
    ]
    return {
        "title": title,
        "description": str(goal_data.get("description") or title),
        "motivation": goal_data.get("motivation"),
        "category": _goal_category(goal_data.get("category")),
        "timeframe": None,
        "suggestedStartDate": goal_data.get("suggestedStartDate")
        or fallback_start_date,
        "suggestedEndDate": goal_data.get("suggestedEndDate")
        or fallback_start_date + (90 * DAY_MS),
        "importance": goal_data.get("importance") or "Moderate",
        "tags": (
            goal_data.get("tags")
            if isinstance(goal_data.get("tags"), list)
            else []
        ),
        "feasibilityAnalysis": goal_data.get("feasibilityAnalysis"),
        "aiInsights": goal_data.get("aiInsights"),
        "assumptions": [
            "Drafted by GoalPlanningService through the goal.create Agent.",
        ],
        "keyResults": key_results,
        "taskTemplates": _draft_task_templates(title),
        "reminders": _draft_reminders(title),
    }


def _list_data_items(data: dict[str, Any], key: str) -> list[Any]:
    value = data.get(key)
    return value if isinstance(value, list) else []


def _preview_text(value: Any, max_length: int = 240) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = " ".join(value.split())
    if len(normalized) <= max_length:
        return normalized
    return f"{normalized[: max_length - 3].rstrip()}..."


def _resource_context_item(resource: dict[str, Any]) -> dict[str, Any]:
    return {
        "resourceId": resource.get("resource_id"),
        "resourcePath": resource.get("resource_path"),
        "title": resource.get("title"),
        "mimeType": resource.get("mime_type"),
        "excerpt": _preview_text(resource.get("content")),
        "metadata": (
            resource.get("metadata")
            if isinstance(resource.get("metadata"), dict)
            else {}
        ),
    }


def _analytics_goal_matches(
    analytics_context: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    if not analytics_context:
        return []
    goal_search_results = analytics_context.get("goal_search_results")
    if isinstance(goal_search_results, list) and goal_search_results:
        return [
            item for item in goal_search_results if isinstance(item, dict)
        ][:6]

    goals = analytics_context.get("goals")
    if isinstance(goals, list):
        return [item for item in goals if isinstance(item, dict)][:6]
    return []


def _analytics_context_summary(
    analytics_context: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if not analytics_context:
        return None
    return {
        "goalCount": len(analytics_context.get("goals") or []),
        "goalSearchResultCount": len(
            analytics_context.get("goal_search_results") or []
        ),
        "hasDashboard": isinstance(analytics_context.get("dashboard"), dict),
        "hasTaskDashboard": isinstance(
            analytics_context.get("task_dashboard"),
            dict,
        ),
        "dashboard": analytics_context.get("dashboard"),
        "taskDashboard": analytics_context.get("task_dashboard"),
        "extra": analytics_context.get("extra")
        if isinstance(analytics_context.get("extra"), dict)
        else {},
    }


def _retrieved_context(state: GoalCreateGraphState) -> list[dict[str, Any]]:
    analytics_context = state.get("analytics_context")
    related_resources = state.get("related_resources", [])
    contexts: list[dict[str, Any]] = [
        {
            "tool": "search_existing_goals",
            "query": _idea(state),
            "matches": _analytics_goal_matches(analytics_context),
        }
    ]

    contexts.append(
        {
            "tool": "search_knowledge",
            "query": _idea(state),
            "matches": [
                _resource_context_item(resource)
                for resource in related_resources
                if isinstance(resource, dict)
            ],
        }
    )

    analytics_summary = _analytics_context_summary(analytics_context)
    if analytics_summary is not None:
        contexts.append(
            {
                "tool": "fetch_goal_stats",
                "query": _idea(state),
                "summary": analytics_summary,
            }
        )

    context_errors = state.get("context_errors", [])
    if context_errors:
        contexts.append(
            {
                "tool": "context_load_errors",
                "errors": context_errors,
            }
        )

    return contexts


def _tool_event_data_from_context(context: dict[str, Any]) -> dict[str, Any]:
    data: dict[str, Any] = {}
    query = context.get("query")
    if isinstance(query, str):
        data["query"] = query
    matches = context.get("matches")
    if isinstance(matches, list):
        data["matchCount"] = len(matches)
    summary = context.get("summary")
    if isinstance(summary, dict):
        data["summary"] = summary
    return data


def _append_retrieval_tool_events(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    contexts: list[dict[str, Any]],
    started_at: int,
    completed_at: int,
) -> list[dict[str, Any]]:
    for context in contexts:
        tool = context.get("tool")
        if tool not in {
            "search_existing_goals",
            "search_knowledge",
            "fetch_goal_stats",
        }:
            continue
        events = append_tool_lifecycle_events(
            events,
            run_id=run_id,
            tool=str(tool),
            created_at=started_at,
            completed_at=completed_at,
            started_data={"query": context.get("query")},
            completed_data={
                "status": "completed",
                **_tool_event_data_from_context(context),
            },
        )
    return events


def _executed_action_tool_event_data(action: AgentExecutedAction) -> dict[str, Any]:
    data = action.model_dump(by_alias=True, exclude_none=True)
    payload: dict[str, Any] = {
        "status": action.status,
        "message": action.message,
    }
    if action.entity_id is not None:
        payload["entityId"] = action.entity_id
    if action.data is not None:
        payload["data"] = action.data
    payload["action"] = data
    return payload


def _action_plan_warnings(goal_data: dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    if not _list_data_items(goal_data, "keyResults"):
        warnings.append(
            "No key results are included in this Agent draft; execution will "
            "create only the goal."
        )
    if not _list_data_items(goal_data, "taskTemplates"):
        warnings.append(
            "No task templates are included in this Agent draft; task setup "
            "can be added after creation."
        )
    if not _list_data_items(goal_data, "reminders"):
        warnings.append(
            "No review reminder is included in this Agent draft; review cadence "
            "can be added after creation."
        )
    return warnings


def _dedupe_warnings(warnings: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for warning in warnings:
        if warning in seen:
            continue
        seen.add(warning)
        deduped.append(warning)
    return deduped


def _numeric_value(value: Any) -> float | None:
    return value if isinstance(value, int | float) else None


def _word_count(value: Any) -> int:
    return len(value.split()) if isinstance(value, str) else 0


def _existing_goal_matches(state: GoalCreateGraphState) -> list[dict[str, Any]]:
    for context in state.get("retrieved_context", []):
        if context.get("tool") != "search_existing_goals":
            continue
        matches = context.get("matches")
        if isinstance(matches, list):
            return [item for item in matches if isinstance(item, dict)]
    return []


def _validate_goal_draft(
    state: GoalCreateGraphState,
    goal_data: dict[str, Any],
) -> list[str]:
    warnings: list[str] = []
    if _word_count(goal_data.get("description")) < 8:
        warnings.append(
            "Goal description is short; confirm the scope and success criteria "
            "before execution."
        )

    start_date = _numeric_value(goal_data.get("suggestedStartDate"))
    end_date = _numeric_value(goal_data.get("suggestedEndDate"))
    if start_date is None or end_date is None or end_date <= start_date:
        warnings.append(
            "Goal timeframe is missing or invalid; review dates before execution."
        )
    elif end_date - start_date < 7 * DAY_MS:
        warnings.append(
            "Goal timeframe is shorter than one week; confirm it is realistic."
        )
    elif end_date - start_date > 365 * DAY_MS:
        warnings.append(
            "Goal timeframe is longer than one year; consider splitting it."
        )

    key_results = _list_data_items(goal_data, "keyResults")
    for index, key_result in enumerate(key_results):
        if not isinstance(key_result, dict):
            warnings.append(f"Key result {index + 1} is not a valid draft object.")
            continue
        target_value = _numeric_value(key_result.get("targetValue"))
        if target_value is None or target_value <= 0 or not key_result.get("unit"):
            warnings.append(
                f"Key result {index + 1} is not measurable; review target and unit."
            )
        weight = _numeric_value(key_result.get("weight"))
        if weight is None or weight < 1 or weight > 5:
            warnings.append(
                f"Key result {index + 1} has an invalid weight; review weighting."
            )

    task_templates = _list_data_items(goal_data, "taskTemplates")
    if key_results and len(task_templates) < len(key_results):
        warnings.append(
            "Task templates do not cover every key result; confirm the support "
            "structure before execution."
        )

    existing_matches = _existing_goal_matches(state)
    if existing_matches:
        titles = [
            str(match.get("title") or match.get("name") or match.get("id"))
            for match in existing_matches[:3]
        ]
        warnings.append(
            "Potential overlap with existing goals: " + ", ".join(titles) + "."
        )

    return _dedupe_warnings(warnings)


def _count_phrase(count: int, singular: str, plural: str) -> str:
    number_words = {0: "no", 1: "one", 2: "two", 3: "three", 4: "four"}
    number = number_words.get(count, str(count))
    return f"{number} {singular if count == 1 else plural}"


def _action_plan_summary(
    *,
    key_result_count: int,
    task_template_count: int,
    reminder_count: int,
) -> str:
    return (
        "Create one goal, "
        f"{_count_phrase(key_result_count, 'key result', 'key results')}, "
        f"{_count_phrase(task_template_count, 'task template', 'task templates')}, "
        "and "
        f"{_count_phrase(reminder_count, 'review reminder', 'review reminders')} "
        "after approval."
    )


def _execution_summary(executed_actions: list[dict[str, Any]]) -> dict[str, Any]:
    executed_count = sum(
        1 for action in executed_actions if action.get("status") == "executed"
    )
    skipped_count = sum(
        1 for action in executed_actions if action.get("status") == "skipped"
    )
    failed_count = sum(
        1 for action in executed_actions if action.get("status") == "failed"
    )
    if failed_count == 0 and skipped_count == 0:
        status = "success"
    elif executed_count > 0:
        status = "partial"
    else:
        status = "failed"

    return {
        "status": status,
        "executedCount": executed_count,
        "skippedCount": skipped_count,
        "failedCount": failed_count,
    }


def _execution_recovery(
    *,
    executed_actions: list[dict[str, Any]],
    approved_actions: list[dict[str, Any]],
) -> dict[str, Any]:
    failed_actions = [
        action for action in executed_actions if action.get("status") == "failed"
    ]
    skipped_actions = [
        action for action in executed_actions if action.get("status") == "skipped"
    ]
    suggestions: list[str] = []

    def has_failed(tool: str) -> bool:
        return any(action.get("tool") == tool for action in failed_actions)

    if has_failed("create_goal"):
        suggestions.append(
            "Fix the goal creation error and retry the same approved plan; "
            "dependent actions were skipped."
        )
    if has_failed("create_key_result"):
        suggestions.append(
            "Confirm the goal exists and the key result drafts are complete "
            "before retrying execution."
        )
    if has_failed("create_task_template"):
        suggestions.append(
            "Review task template drafts and task module configuration before "
            "retrying execution."
        )
    if has_failed("create_reminder"):
        suggestions.append(
            "Review reminder drafts and reminder module configuration before "
            "retrying execution."
        )
    if skipped_actions:
        suggestions.append(
            "Review skipped dependent actions before retrying execution."
        )
    if failed_actions and not suggestions:
        suggestions.append(
            "Review failed action messages and retry execution with the same "
            "approved plan after fixing the underlying issue."
        )

    return {
        "canRetry": bool(failed_actions or skipped_actions),
        "failedActions": failed_actions,
        "skippedActions": skipped_actions,
        "suggestions": _dedupe_warnings(suggestions),
        "retryApprovedActions": approved_actions,
    }


def _execution_timeline_artifact(
    state: GoalCreateGraphState,
    *,
    now: int,
) -> dict[str, Any] | None:
    executed_actions = state.get("executed_actions", [])
    if not executed_actions:
        return None

    artifact = AgentArtifact(
        artifactId=f"{_run_id(state)}:execution-timeline",
        kind="execution_timeline",
        title="Execution timeline",
        data={
            "summary": _execution_summary(executed_actions),
            "timeline": executed_actions,
            "recovery": _execution_recovery(
                executed_actions=executed_actions,
                approved_actions=state.get("approved_actions", []),
            ),
        },
        updatedAt=now,
    )
    return artifact.model_dump(by_alias=True)


def _node_event(
    state: GoalCreateGraphState,
    node: str,
    clock: Clock,
    *,
    started_at: int | None = None,
) -> list[dict[str, Any]]:
    started_at = started_at if started_at is not None else clock()
    return append_node_lifecycle_events(
        state.get("events", []),
        run_id=_run_id(state),
        node=node,
        created_at=started_at,
        completed_at=clock(),
    )


def create_goal_create_initial_state(
    *,
    run_id: str,
    thread_id: str,
    identity_id: str,
    idea: str,
    conversation_id: str | None = None,
    category: str | None = None,
    timeframe: str | None = None,
    provider_config: ProviderConfig | dict[str, Any] | None = None,
    related_resources: list[dict[str, Any]] | None = None,
    analytics_context: dict[str, Any] | None = None,
    context_errors: list[dict[str, str]] | None = None,
    request_id: str | None = None,
    clock: Clock = _default_clock_ms,
) -> GoalCreateGraphState:
    """Build the initial state for one goal.create Agent run."""

    now = clock()
    user_message = AgentMessage(
        role="user",
        content=idea,
        createdAt=now,
    )
    return {
        "run_id": run_id,
        "thread_id": thread_id,
        "conversation_id": conversation_id,
        "identity_id": identity_id,
        "created_at": now,
        "updated_at": now,
        "status": "pending",
        "intent": "goal-create",
        "stage": "intake",
        "idea": idea,
        "category": category,
        "timeframe": timeframe,
        "messages": [user_message.model_dump(by_alias=True, exclude_none=True)],
        "artifacts": [],
        "citations": [],
        "retrieved_context": [],
        "pending_actions": [],
        "approved_actions": [],
        "executed_actions": [],
        "clarification_answers": [],
        "draft_warnings": [],
        "usage": {},
        "errors": [],
        "events": [],
        "resume_decision": None,
        "provider_config": (
            provider_config.model_dump()
            if isinstance(provider_config, ProviderConfig)
            else provider_config
        ),
        "related_resources": related_resources or [],
        "analytics_context": analytics_context,
        "context_errors": context_errors or [],
        "request_id": request_id,
    }


def build_goal_create_graph(
    *,
    clock: Clock = _default_clock_ms,
    goal_planner: GoalPlanningCallback | None = None,
) -> Any:
    """Compile a minimal goal.create graph with an approval interrupt."""

    def intake(state: GoalCreateGraphState) -> GraphUpdate:
        started_at = clock()
        events = append_agent_event(
            state.get("events", []),
            run_id=_run_id(state),
            event_type="run.started",
            created_at=started_at,
            data={"agentType": "goal.create"},
        )
        return {
            "status": "running",
            "stage": "intake",
            "updated_at": clock(),
            "events": append_node_lifecycle_events(
                events,
                run_id=_run_id(state),
                node="intake",
                created_at=started_at,
                completed_at=clock(),
            ),
        }

    def retrieve_context(state: GoalCreateGraphState) -> GraphUpdate:
        started_at = clock()
        contexts = _retrieved_context(state)
        completed_at = clock()
        return {
            "stage": "retrieve_context",
            "updated_at": completed_at,
            "retrieved_context": contexts,
            "events": _append_retrieval_tool_events(
                append_node_lifecycle_events(
                    state.get("events", []),
                    run_id=_run_id(state),
                    node="retrieve_context",
                    created_at=started_at,
                    completed_at=completed_at,
                ),
                run_id=_run_id(state),
                contexts=contexts,
                started_at=started_at,
                completed_at=completed_at,
            ),
        }

    def clarify(state: GoalCreateGraphState) -> GraphUpdate:
        events = _node_event(state, "clarify", clock)
        if not _needs_clarification(state):
            return {
                "stage": "clarify",
                "status": "running",
                "updated_at": clock(),
                "events": events,
            }

        now = clock()
        clarification_payload = {
            "type": "clarification.required",
            "runId": _run_id(state),
            "threadId": _thread_id(state),
            "agentType": "goal.create",
            "rationale": (
                "The goal idea is too brief to produce a reliable goal draft."
            ),
            "questions": _clarification_questions(),
            "request": {
                "idea": state.get("idea"),
                "category": state.get("category"),
                "timeframe": state.get("timeframe"),
            },
        }
        return {
            "stage": "clarify",
            "status": "waiting_clarification",
            "updated_at": clock(),
            "clarification_interrupt": clarification_payload,
            "events": append_agent_event(
                events,
                run_id=_run_id(state),
                event_type="clarification.required",
                created_at=now,
                data=clarification_payload,
            ),
        }

    def clarification_interrupt(state: GoalCreateGraphState) -> GraphUpdate:
        resume_value = interrupt(_required(state, "clarification_interrupt"))
        payload = AgentResumePayload.model_validate(resume_value)
        if payload.user_decision == "cancel":
            return {
                "stage": "result",
                "status": "cancelled",
                "updated_at": clock(),
                "resume_decision": payload.user_decision,
            }

        if payload.user_decision != "clarify":
            raise ValueError(
                "Goal Agent clarification can only resume with a clarify decision."
            )

        answers = payload.clarification_answers or []
        if not answers:
            raise ValueError(
                "Clarification answers are required to continue Goal Agent "
                "clarification."
            )

        now = clock()
        messages = [
            *state.get("messages", []),
            AgentMessage(
                role="user",
                content=_augment_idea_with_clarification("", answers).strip(),
                createdAt=now,
            ).model_dump(by_alias=True, exclude_none=True),
        ]
        return {
            "stage": "clarify",
            "status": "running",
            "updated_at": now,
            "idea": _augment_idea_with_clarification(_idea(state), answers),
            "clarification_answers": [answer.strip() for answer in answers],
            "messages": messages,
            "resume_decision": payload.user_decision,
            "events": _node_event(state, "clarification_interrupt", clock),
        }

    async def draft_goal(state: GoalCreateGraphState) -> GraphUpdate:
        started_at = clock()
        now = started_at
        start_date = now
        title = _goal_title(_idea(state))
        usage: dict[str, Any] = state.get("usage", {})
        provider_config = state.get("provider_config")
        if goal_planner is not None and isinstance(provider_config, dict):
            planning = await goal_planner(
                idea=_idea(state),
                category=state.get("category"),
                timeframe=state.get("timeframe"),
                include_key_results=True,
                provider_config=ProviderConfig.model_validate(provider_config),
                request_id=state.get("request_id"),
            )
            goal_data = _goal_data_from_planning(
                planning,
                fallback_title=title,
                fallback_start_date=start_date,
            )
            usage = _normalize_usage(planning.usage)
        else:
            goal_data = {
                "title": title,
                "description": _idea(state),
                "motivation": (
                    "Clarify and execute the approved goal through the Agent "
                    "workflow."
                ),
                "category": _goal_category(state.get("category")),
                "timeframe": state.get("timeframe"),
                "suggestedStartDate": start_date,
                "suggestedEndDate": start_date + (90 * DAY_MS),
                "importance": "Important",
                "tags": [],
                "feasibilityAnalysis": (
                    "Generated by the experimental goal.create graph spike."
                ),
                "aiInsights": (
                    "The approved action plan must be executed by the TS "
                    "application layer."
                ),
                "assumptions": [
                    "Generated by the experimental goal.create graph spike.",
                ],
                "keyResults": _draft_key_results(title),
                "taskTemplates": _draft_task_templates(title),
                "reminders": _draft_reminders(title),
            }
        artifact = AgentArtifact(
            artifactId=f"{_run_id(state)}:goal-draft",
            kind="goal_draft",
            title=goal_data["title"],
            data=goal_data,
            updatedAt=now,
        )
        events = append_agent_event(
            _node_event(state, "draft_goal", clock, started_at=started_at),
            run_id=_run_id(state),
            event_type="artifact.updated",
            created_at=now,
            data={"artifactId": artifact.artifact_id, "kind": artifact.kind},
        )
        return {
            "stage": "draft_goal",
            "updated_at": now,
            "artifacts": [artifact.model_dump(by_alias=True)],
            "usage": usage,
            "events": events,
        }

    def validate_draft(state: GoalCreateGraphState) -> GraphUpdate:
        goal_artifact = next(
            artifact
            for artifact in state.get("artifacts", [])
            if artifact.get("kind") == "goal_draft"
        )
        return {
            "stage": "validate_draft",
            "updated_at": clock(),
            "draft_warnings": _validate_goal_draft(
                state,
                goal_artifact["data"],
            ),
            "events": _node_event(state, "validate_draft", clock),
        }

    def plan_actions(state: GoalCreateGraphState) -> GraphUpdate:
        now = clock()
        goal_artifact = next(
            artifact
            for artifact in state.get("artifacts", [])
            if artifact.get("kind") == "goal_draft"
        )
        goal_data = goal_artifact["data"]
        key_results = _list_data_items(goal_data, "keyResults")
        task_templates = _list_data_items(goal_data, "taskTemplates")
        reminders = _list_data_items(goal_data, "reminders")
        actions = [
            AgentAction(
                tool="create_goal",
                index=0,
                rationale="Create the approved goal draft after user confirmation.",
                payload=goal_data,
            ),
        ]
        actions.extend(
            AgentAction(
                tool="create_key_result",
                index=index,
                dependsOn=[0],
                rationale="Attach a measurable key result to the approved goal.",
                payload=key_result if isinstance(key_result, dict) else {},
            )
            for index, key_result in enumerate(key_results)
        )
        actions.extend(
            AgentAction(
                tool="create_task_template",
                index=index,
                dependsOn=(
                    [0, index + 1]
                    if index < len(key_results)
                    else [0]
                ),
                rationale=(
                    "Create a recurring task template that supports the matching "
                    "key result."
                ),
                payload=task_template if isinstance(task_template, dict) else {},
            )
            for index, task_template in enumerate(task_templates)
        )
        actions.extend(
            AgentAction(
                tool="create_reminder",
                index=index,
                dependsOn=[0],
                rationale=(
                    "Create a review reminder so the approved goal has a "
                    "follow-up cadence."
                ),
                payload=reminder if isinstance(reminder, dict) else {},
            )
            for index, reminder in enumerate(reminders)
        )
        action_plan = AgentActionPlan(
            summary=_action_plan_summary(
                key_result_count=len(key_results),
                task_template_count=len(task_templates),
                reminder_count=len(reminders),
            ),
            actions=actions,
            warnings=_dedupe_warnings(
                [
                    *_action_plan_warnings(goal_data),
                    *state.get("draft_warnings", []),
                ]
            ),
        )
        artifact = AgentArtifact(
            artifactId=f"{_run_id(state)}:action-plan",
            kind="action_plan",
            title="Approval plan",
            data=action_plan.model_dump(by_alias=True),
            updatedAt=now,
        )
        events = append_agent_event(
            _node_event(state, "plan_actions", clock),
            run_id=_run_id(state),
            event_type="artifact.updated",
            created_at=now,
            data={"artifactId": artifact.artifact_id, "kind": artifact.kind},
        )
        return {
            "stage": "plan_actions",
            "updated_at": now,
            "artifacts": [
                *state.get("artifacts", []),
                artifact.model_dump(by_alias=True),
            ],
            "pending_actions": [
                action.model_dump(by_alias=True) for action in actions
            ],
            "events": events,
        }

    def prepare_approval(state: GoalCreateGraphState) -> GraphUpdate:
        now = clock()
        approval_payload = {
            "runId": _run_id(state),
            "threadId": _thread_id(state),
            "agentType": "goal.create",
            "pendingActions": state.get("pending_actions", []),
            "artifacts": state.get("artifacts", []),
        }
        return {
            "stage": "approval",
            "status": "waiting_approval",
            "updated_at": now,
            "approval_interrupt": approval_payload,
            "events": append_agent_event(
                _node_event(state, "prepare_approval", clock),
                run_id=_run_id(state),
                event_type="approval.required",
                created_at=now,
                data=approval_payload,
            ),
        }

    def approval_interrupt(state: GoalCreateGraphState) -> GraphUpdate:
        resume_value = interrupt(_required(state, "approval_interrupt"))
        payload = AgentResumePayload.model_validate(resume_value)
        if payload.user_decision == "cancel":
            return {
                "stage": "result",
                "status": "cancelled",
                "updated_at": clock(),
                "approved_actions": [],
                "resume_decision": payload.user_decision,
            }

        if payload.user_decision == "regenerate":
            return {
                "stage": "draft_goal",
                "status": "running",
                "updated_at": clock(),
                "resume_decision": payload.user_decision,
            }

        if payload.user_decision not in {"confirm", "edit"}:
            raise ValueError(
                "Goal Agent approval can only resume with confirm, edit, cancel, "
                "or regenerate decisions."
            )

        artifacts = state.get("artifacts", [])
        if payload.edited_artifacts is not None:
            artifacts = [
                artifact.model_dump(by_alias=True)
                for artifact in payload.edited_artifacts
            ]

        approved_actions = payload.approved_actions
        if approved_actions is None:
            approved_actions = [
                AgentAction.model_validate(action)
                for action in state.get("pending_actions", [])
            ]

        return {
            "stage": "execute",
            "status": "running",
            "updated_at": clock(),
            "artifacts": artifacts,
            "approved_actions": [
                action.model_dump(by_alias=True) for action in approved_actions
            ],
            "resume_decision": payload.user_decision,
        }

    def prepare_execution(state: GoalCreateGraphState) -> GraphUpdate:
        now = clock()
        execution_payload = {
            "type": "execution.required",
            "runId": _run_id(state),
            "threadId": _thread_id(state),
            "agentType": "goal.create",
            "request": {
                "idea": state.get("idea"),
                "category": state.get("category"),
                "timeframe": state.get("timeframe"),
            },
            "approvedActions": state.get("approved_actions", []),
            "artifacts": state.get("artifacts", []),
        }
        return {
            "stage": "execute",
            "status": "waiting_execution",
            "updated_at": now,
            "execution_interrupt": execution_payload,
            "events": append_agent_event(
                _node_event(state, "prepare_execution", clock),
                run_id=_run_id(state),
                event_type="execution.required",
                created_at=now,
                data=execution_payload,
            ),
        }

    def execution_interrupt(state: GoalCreateGraphState) -> GraphUpdate:
        resume_value = interrupt(_required(state, "execution_interrupt"))
        payload = AgentResumePayload.model_validate(resume_value)
        executed = payload.executed_actions
        if executed is None:
            raise ValueError("Executed actions are required to finish Agent execution.")

        now = clock()
        events = append_node_started_event(
            state.get("events", []),
            run_id=_run_id(state),
            node="execution_interrupt",
            created_at=now,
        )
        for executed_action in executed:
            events = append_tool_lifecycle_events(
                events,
                run_id=_run_id(state),
                tool=executed_action.tool,
                created_at=now,
                completed_at=now,
                started_data={"source": "external_executor"},
                completed_data={
                    "source": "external_executor",
                    **_executed_action_tool_event_data(executed_action),
                },
            )
            events = append_agent_event(
                events,
                run_id=_run_id(state),
                event_type="action.executed",
                created_at=now,
                data=executed_action.model_dump(by_alias=True),
            )
        return {
            "stage": "execute",
            "status": "running",
            "updated_at": now,
            "executed_actions": [
                action.model_dump(by_alias=True) for action in executed
            ],
            "events": append_node_completed_event(
                events,
                run_id=_run_id(state),
                node="execution_interrupt",
                created_at=now,
                started_at=now,
            ),
        }

    def result(state: GoalCreateGraphState) -> GraphUpdate:
        now = clock()
        status = "cancelled" if state.get("status") == "cancelled" else "completed"
        events = _node_event(state, "result", clock)
        artifacts = state.get("artifacts", [])
        timeline_artifact = _execution_timeline_artifact(state, now=now)
        if timeline_artifact is not None:
            artifacts = [
                artifact
                for artifact in artifacts
                if artifact.get("kind") != "execution_timeline"
            ]
            artifacts.append(timeline_artifact)
            events = append_agent_event(
                events,
                run_id=_run_id(state),
                event_type="artifact.updated",
                created_at=now,
                data={
                    "artifactId": timeline_artifact["artifactId"],
                    "kind": timeline_artifact["kind"],
                },
            )
        return {
            "stage": "result",
            "status": status,
            "updated_at": now,
            "artifacts": artifacts,
            "events": append_agent_event(
                events,
                run_id=_run_id(state),
                event_type="run.completed",
                created_at=now,
                data={"status": status},
            ),
        }

    def route_after_approval(state: GoalCreateGraphState) -> str:
        if state.get("resume_decision") == "regenerate":
            return "draft_goal"
        if state.get("status") == "cancelled":
            return "result"
        return "prepare_execution"

    def route_after_clarify(state: GoalCreateGraphState) -> str:
        if state.get("status") == "waiting_clarification":
            return "clarification_interrupt"
        return "draft_goal"

    def route_after_clarification_resume(state: GoalCreateGraphState) -> str:
        if state.get("status") == "cancelled":
            return "result"
        return "draft_goal"

    graph = StateGraph(GoalCreateGraphState)
    graph.add_node("intake", intake)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("clarify", clarify)
    graph.add_node("clarification_interrupt", clarification_interrupt)
    graph.add_node("draft_goal", draft_goal)
    graph.add_node("validate_draft", validate_draft)
    graph.add_node("plan_actions", plan_actions)
    graph.add_node("prepare_approval", prepare_approval)
    graph.add_node("approval_interrupt", approval_interrupt)
    graph.add_node("prepare_execution", prepare_execution)
    graph.add_node("execution_interrupt", execution_interrupt)
    graph.add_node("result", result)

    graph.add_edge(START, "intake")
    graph.add_edge("intake", "retrieve_context")
    graph.add_edge("retrieve_context", "clarify")
    graph.add_conditional_edges(
        "clarify",
        route_after_clarify,
        {
            "clarification_interrupt": "clarification_interrupt",
            "draft_goal": "draft_goal",
        },
    )
    graph.add_conditional_edges(
        "clarification_interrupt",
        route_after_clarification_resume,
        {
            "draft_goal": "draft_goal",
            "result": "result",
        },
    )
    graph.add_edge("draft_goal", "validate_draft")
    graph.add_edge("validate_draft", "plan_actions")
    graph.add_edge("plan_actions", "prepare_approval")
    graph.add_edge("prepare_approval", "approval_interrupt")
    graph.add_conditional_edges(
        "approval_interrupt",
        route_after_approval,
        {
            "draft_goal": "draft_goal",
            "prepare_execution": "prepare_execution",
            "result": "result",
        },
    )
    graph.add_edge("prepare_execution", "execution_interrupt")
    graph.add_edge("execution_interrupt", "result")
    graph.add_edge("result", END)
    return graph
