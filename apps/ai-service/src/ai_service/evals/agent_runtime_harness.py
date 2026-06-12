"""Deterministic eval harness for experimental Agent runtime graphs."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
)
from ai_service.schemas import (
    AgentCitation,
    AgentRunResult,
    GoalPlanningResponse,
    ProviderConfig,
)

DEFAULT_AGENT_RUNTIME_PROVIDER = ProviderConfig(
    provider="openai",
    model="agent-runtime-eval-stub",
    api_key="eval-key",
)


class AgentRuntimeGoalCreateRequest(BaseModel):
    """Input used to start one goal.create Agent runtime eval."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(..., min_length=10)
    identity_id: str = "identity-1"
    conversation_id: str | None = None
    category: str | None = None
    timeframe: str | None = None
    request_id: str | None = None


class AgentRuntimeGoalCreateExpectedOutcome(BaseModel):
    """Expected goal.create runtime output shape."""

    model_config = ConfigDict(extra="forbid")

    run_status: Literal[
        "pending",
        "running",
        "waiting_clarification",
        "waiting_approval",
        "waiting_execution",
        "completed",
        "failed",
        "cancelled",
    ] = "waiting_approval"
    stage: str = "approval"
    min_key_results: int = Field(default=1, ge=0)
    expected_goal_terms: list[str] = Field(default_factory=list)
    expected_action_tools: list[str] = Field(default_factory=list)
    require_approval_interrupt: bool = True
    usage_total_tokens: int | None = Field(default=None, ge=0)


class AgentRuntimeGoalCreateEvalCase(BaseModel):
    """Goal draft quality case for the goal.create Agent runtime."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: Literal["agent_runtime_goal_create"]
    description: str
    initial_request: AgentRuntimeGoalCreateRequest
    planner_response: GoalPlanningResponse | None = None
    provider_config: ProviderConfig | None = None
    expected: AgentRuntimeGoalCreateExpectedOutcome


class AgentRuntimeKnowledgeQaExpectedOutcome(BaseModel):
    """Expected knowledge.qa runtime output shape."""

    model_config = ConfigDict(extra="forbid")

    evidence_status: Literal["grounded", "insufficient"]
    expected_answer_substrings: list[str] = Field(default_factory=list)
    expected_resource_paths: list[str] = Field(default_factory=list)
    expect_citations: bool = True
    usage_total_tokens: int | None = Field(default=None, ge=0)
    min_matched_resource_count: int | None = Field(default=None, ge=0)


class AgentRuntimeKnowledgeQaEvalCase(BaseModel):
    """Knowledge grounding case for the knowledge.qa Agent runtime."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: Literal["agent_runtime_knowledge_qa"]
    description: str
    question: str = Field(..., min_length=1)
    identity_id: str = "identity-1"
    conversation_id: str | None = None
    answer: str | None = None
    citations: list[AgentCitation] = Field(default_factory=list)
    provider_id: str | None = None
    token_usage: dict[str, Any] | None = None
    processing_time_ms: int | None = Field(default=None, ge=0)
    matched_resource_count: int | None = Field(default=None, ge=0)
    expected: AgentRuntimeKnowledgeQaExpectedOutcome


class AgentRuntimeKnowledgeGenerateRequest(BaseModel):
    """Input used to start one knowledge.generate Agent runtime eval."""

    model_config = ConfigDict(extra="forbid")

    topic: str = Field(..., min_length=1)
    identity_id: str = "identity-1"
    conversation_id: str | None = None
    title: str | None = None
    source: str | None = None
    target_subpath: str | None = None
    provider_id: str | None = None
    model: str | None = None


class AgentRuntimeKnowledgeGenerateExpectedOutcome(BaseModel):
    """Expected knowledge.generate runtime output shape."""

    model_config = ConfigDict(extra="forbid")

    run_status: Literal[
        "pending",
        "running",
        "waiting_clarification",
        "waiting_approval",
        "waiting_execution",
        "completed",
        "failed",
        "cancelled",
    ] = "waiting_approval"
    stage: str = "approval"
    expected_title: str | None = None
    expected_topic_substrings: list[str] = Field(default_factory=list)
    expected_markdown_substrings: list[str] = Field(default_factory=list)
    expected_action_tools: list[str] = Field(default_factory=list)
    expected_target_subpath: str | None = None
    expected_index_status: str | None = None
    require_approval_interrupt: bool = True


class AgentRuntimeKnowledgeGenerateEvalCase(BaseModel):
    """Knowledge note draft case for the knowledge.generate Agent runtime."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: Literal["agent_runtime_knowledge_generate"]
    description: str
    initial_request: AgentRuntimeKnowledgeGenerateRequest
    expected: AgentRuntimeKnowledgeGenerateExpectedOutcome


class StaticGoalPlanningService:
    """Goal planner stub that returns a checked-in planning response."""

    def __init__(self, response: GoalPlanningResponse) -> None:
        self._response = response
        self.calls: list[dict[str, Any]] = []

    async def plan(self, **kwargs: Any) -> GoalPlanningResponse:
        self.calls.append(kwargs)
        return self._response.model_copy(deep=True)


def _incrementing_clock(start: int = 1000, step: int = 5):
    current = start

    def clock() -> int:
        nonlocal current
        value = current
        current += step
        return value

    return clock


async def run_agent_runtime_goal_create_case(
    case: AgentRuntimeGoalCreateEvalCase,
) -> AgentRunResult:
    """Run one deterministic goal.create Agent runtime case."""

    planner_service = (
        StaticGoalPlanningService(case.planner_response)
        if case.planner_response is not None
        else None
    )
    runtime = GoalCreateAgentRuntime(
        clock=_incrementing_clock(),
        goal_planning_service=planner_service,
    )
    provider_config = (
        case.provider_config
        if case.provider_config is not None
        else (
            DEFAULT_AGENT_RUNTIME_PROVIDER
            if case.planner_response is not None
            else None
        )
    )
    initial = case.initial_request
    result = await runtime.astart_goal_create(
        run_id=f"{case.id}:run",
        thread_id=f"{case.id}:thread",
        identity_id=initial.identity_id,
        conversation_id=initial.conversation_id,
        idea=initial.idea,
        category=initial.category,
        timeframe=initial.timeframe,
        provider_config=provider_config,
        request_id=initial.request_id,
    )
    return result.to_response()


async def run_agent_runtime_knowledge_qa_case(
    case: AgentRuntimeKnowledgeQaEvalCase,
) -> AgentRunResult:
    """Run one deterministic knowledge.qa Agent runtime case."""

    runtime = KnowledgeQaAgentRuntime(clock=_incrementing_clock())
    result = runtime.start_knowledge_qa(
        run_id=f"{case.id}:run",
        thread_id=f"{case.id}:thread",
        identity_id=case.identity_id,
        conversation_id=case.conversation_id,
        question=case.question,
        answer=case.answer,
        citations=[citation.model_dump(by_alias=True) for citation in case.citations],
        provider_id=case.provider_id,
        token_usage=case.token_usage,
        processing_time_ms=case.processing_time_ms,
        matched_resource_count=case.matched_resource_count,
    )
    return result.to_response()


def run_agent_runtime_knowledge_generate_case(
    case: AgentRuntimeKnowledgeGenerateEvalCase,
) -> AgentRunResult:
    """Run one deterministic knowledge.generate Agent runtime case."""

    runtime = KnowledgeGenerateAgentRuntime(clock=_incrementing_clock())
    initial = case.initial_request
    result = runtime.start_knowledge_generate(
        run_id=f"{case.id}:run",
        thread_id=f"{case.id}:thread",
        identity_id=initial.identity_id,
        conversation_id=initial.conversation_id,
        topic=initial.topic,
        title=initial.title,
        source=initial.source,
        target_subpath=initial.target_subpath,
        provider_id=initial.provider_id,
        model=initial.model,
    )
    return result.to_response()
