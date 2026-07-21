"""Schemas for the experimental Agent runtime contract."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

AgentIntent = Literal["chat", "goal-create", "knowledge-qa", "knowledge-generate"]
AgentType = Literal["goal.create", "knowledge.qa", "knowledge.generate"]
AgentLocale = Literal["zh-CN", "en-US"]
AgentRunStatus = Literal[
    "pending",
    "running",
    "waiting_clarification",
    "waiting_approval",
    "waiting_execution",
    "completed",
    "failed",
    "cancelled",
]
AgentMessageRole = Literal["system", "user", "assistant", "tool"]
AgentArtifactKind = Literal[
    "goal_draft",
    "knowledge_answer",
    "knowledge_note_draft",
    "action_plan",
    "execution_timeline",
]
AgentToolName = Literal[
    "search_existing_goals",
    "search_knowledge",
    "fetch_goal_stats",
    "fetch_resource",
    "find_related_notes",
    "create_goal",
    "create_key_result",
    "create_task_template",
    "create_reminder",
    # First-phase knowledge writes are create-only (no existing-note edit/reindex).
    "create_knowledge_note",
]
AgentActionStatus = Literal["executed", "skipped", "failed"]
AgentEventType = Literal[
    "run.started",
    "node.started",
    "node.completed",
    "message.delta",
    "artifact.updated",
    "citation.selected",
    "tool.started",
    "tool.completed",
    "clarification.required",
    "approval.required",
    "execution.required",
    "action.executed",
    "run.completed",
    "run.failed",
]
AgentUserDecision = Literal["clarify", "confirm", "cancel", "edit", "regenerate"]


class AgentRun(BaseModel):
    """Metadata for one Agent execution instance."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    run_id: str = Field(..., min_length=1, alias="runId")
    thread_id: str = Field(..., min_length=1, alias="threadId")
    conversation_id: str | None = Field(
        default=None,
        min_length=1,
        alias="conversationId",
    )
    identity_id: str = Field(..., min_length=1, alias="identityId")
    agent_type: AgentType = Field(alias="agentType")
    status: AgentRunStatus
    created_at: int = Field(..., ge=0, alias="createdAt")
    updated_at: int = Field(..., ge=0, alias="updatedAt")


class AgentMessage(BaseModel):
    """Message included in an Agent state snapshot."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str | None = Field(default=None, min_length=1)
    role: AgentMessageRole
    content: str
    created_at: int | None = Field(default=None, ge=0, alias="createdAt")


class AgentArtifact(BaseModel):
    """Structured artifact projected from an Agent run."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    artifact_id: str = Field(..., min_length=1, alias="artifactId")
    kind: AgentArtifactKind
    title: str | None = Field(default=None, min_length=1)
    data: dict[str, Any]
    updated_at: int = Field(..., ge=0, alias="updatedAt")


class AgentCitation(BaseModel):
    """Knowledge citation projected into an Agent artifact."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    resource_id: str = Field(..., min_length=1, alias="resourceId")
    resource_path: str = Field(..., min_length=1, alias="resourcePath")
    title: str | None = None
    chunk_index: int = Field(..., ge=0, alias="chunkIndex")
    excerpt: str = Field(..., min_length=1)
    score: float = Field(..., ge=0)


class AgentAction(BaseModel):
    """Planned read-only or side-effect action."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    tool: AgentToolName
    payload: dict[str, Any] = Field(default_factory=dict)
    rationale: str | None = Field(default=None, min_length=1)
    index: int = Field(..., ge=0)
    depends_on: list[int] = Field(default_factory=list, alias="dependsOn")


class AgentActionPlan(BaseModel):
    """User-reviewable action plan produced before side effects execute."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    summary: str = Field(..., min_length=1)
    actions: list[AgentAction] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class AgentExecutedAction(BaseModel):
    """Result for one action after controlled execution."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    tool: AgentToolName
    status: AgentActionStatus
    entity_id: str | None = Field(default=None, alias="entityId")
    message: str
    data: dict[str, Any] | None = None


class AgentUsage(BaseModel):
    """Token usage observed during an Agent run."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    prompt_tokens: int | None = Field(default=None, ge=0, alias="promptTokens")
    completion_tokens: int | None = Field(default=None, ge=0, alias="completionTokens")
    total_tokens: int | None = Field(default=None, ge=0, alias="totalTokens")


class AgentState(BaseModel):
    """Serializable state snapshot shared across runtime and application layers."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    messages: list[AgentMessage] = Field(default_factory=list)
    intent: AgentIntent | None = None
    stage: str = Field(..., min_length=1)
    artifacts: list[AgentArtifact] = Field(default_factory=list)
    citations: list[AgentCitation] = Field(default_factory=list)
    retrieved_context: list[dict[str, Any]] = Field(
        default_factory=list,
        alias="retrievedContext",
    )
    pending_actions: list[AgentAction] = Field(
        default_factory=list,
        alias="pendingActions",
    )
    approved_actions: list[AgentAction] = Field(
        default_factory=list,
        alias="approvedActions",
    )
    executed_actions: list[AgentExecutedAction] = Field(
        default_factory=list,
        alias="executedActions",
    )
    usage: AgentUsage = Field(default_factory=AgentUsage)
    errors: list[str] = Field(default_factory=list)


class AgentEvent(BaseModel):
    """Frontend-projected event emitted by the Agent runtime."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    event_id: str = Field(..., min_length=1, alias="eventId")
    run_id: str = Field(..., min_length=1, alias="runId")
    sequence: int = Field(..., ge=0)
    type: AgentEventType
    created_at: int = Field(..., ge=0, alias="createdAt")
    data: dict[str, Any] = Field(default_factory=dict)


class AgentResumePayload(BaseModel):
    """Payload used to resume an interrupted Agent run."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    user_decision: AgentUserDecision = Field(alias="userDecision")
    clarification_answers: list[str] | None = Field(
        default=None,
        alias="clarificationAnswers",
        min_length=1,
        max_length=3,
    )
    approved_actions: list[AgentAction] | None = Field(
        default=None,
        alias="approvedActions",
    )
    executed_actions: list[AgentExecutedAction] | None = Field(
        default=None,
        alias="executedActions",
    )
    edited_artifacts: list[AgentArtifact] | None = Field(
        default=None,
        alias="editedArtifacts",
    )
    approved_plan: AgentActionPlan | None = Field(default=None, alias="approvedPlan")


class AgentStartRunRequest(BaseModel):
    """Request used to start an experimental Agent run."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    run_id: str = Field(..., min_length=1, alias="runId")
    thread_id: str = Field(..., min_length=1, alias="threadId")
    conversation_id: str | None = Field(
        default=None,
        min_length=1,
        alias="conversationId",
    )
    identity_id: str = Field(..., min_length=1, alias="identityId")
    agent_type: AgentType = Field(alias="agentType")
    locale: AgentLocale
    input: dict[str, Any] = Field(default_factory=dict)


class AgentRunResult(BaseModel):
    """Projected response returned by experimental Agent run endpoints."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    run: AgentRun
    state: AgentState
    events: list[AgentEvent] = Field(default_factory=list)
    interrupts: list[dict[str, Any]] = Field(default_factory=list)
