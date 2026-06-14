"""Schemas for structured goal planning."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from ai_service.schemas.analytics import AnalyticsQueryContext
from ai_service.schemas.chat import ProviderConfig
from ai_service.schemas.knowledge import KnowledgeCitation, KnowledgeResourceDocument

GoalCategory = Literal[
    "work",
    "health",
    "learning",
    "personal",
    "finance",
    "relationship",
    "other",
]
ImportanceLevel = Literal["Vital", "Important", "Moderate", "Minor", "Trivial"]


class GoalPlanningRequest(BaseModel):
    """Request for generating a structured goal plan."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(..., min_length=10)
    category: str | None = None
    timeframe: str | None = None
    include_key_results: bool = True
    provider_config: ProviderConfig
    request_id: str | None = None
    enable_clarification: bool = Field(
        default=True,
        description="Whether to check for clarification need before planning",
    )
    clarification_answers: list[str] | None = Field(
        default=None, description="Answers to previous clarification questions"
    )


class ClarificationQuestion(BaseModel):
    """Single clarification question for goal planning."""

    model_config = ConfigDict(extra="ignore")

    question: str = Field(..., min_length=5, description="The clarification question")
    context: str | None = Field(
        default=None,
        description="Optional context explaining why this question matters",
    )


class GoalClarificationLLMResponse(BaseModel):
    """LLM response indicating whether goal planning needs clarification."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    needs_clarification: bool = Field(
        ...,
        alias="needsClarification",
        description="Whether the input is too vague for direct planning",
    )
    questions: list[ClarificationQuestion] = Field(
        default_factory=list,
        description="2-4 clarification questions if clarification is needed",
    )
    rationale: str | None = Field(
        default=None, description="Why clarification is needed"
    )

    @model_validator(mode="after")
    def validate_question_bounds(self) -> GoalClarificationLLMResponse:
        if not self.needs_clarification:
            return self

        question_count = len(self.questions)
        if question_count < 2 or question_count > 4:
            raise ValueError("Clarification responses must include 2-4 questions.")

        return self


class GoalAutomationRequest(BaseModel):
    """Request for generating a goal automation tool plan."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(..., min_length=10)
    category: str | None = None
    timeframe: str | None = None
    include_key_results: bool = True
    include_task_templates: bool = True
    related_resources: list[KnowledgeResourceDocument] = Field(default_factory=list)
    analytics_context: AnalyticsQueryContext | None = None
    provider_config: ProviderConfig
    request_id: str | None = None


class GoalAutomationSearchNotesResult(BaseModel):
    """Structured result returned by the search_notes read-only tool."""

    model_config = ConfigDict(extra="forbid")

    query: str = Field(..., min_length=1)
    citations: list[KnowledgeCitation] = Field(default_factory=list)


class GoalAutomationFetchStatsResult(BaseModel):
    """Structured result returned by the fetch_stats read-only tool."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    highlights: list[str] = Field(default_factory=list)


class GoalPlanDraftInput(BaseModel):
    """LLM-shaped goal draft before runtime-specific timestamp mapping."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    motivation: str | None = None
    category: GoalCategory = "other"
    importance: ImportanceLevel = "Moderate"
    tags: list[str] = Field(default_factory=list)
    feasibility_analysis: str | None = Field(
        default=None,
        alias="feasibilityAnalysis",
    )
    ai_insights: str | None = Field(
        default=None,
        alias="aiInsights",
    )
    suggested_duration_days: int = Field(
        default=30,
        gt=0,
        alias="suggestedDurationDays",
    )


class KeyResultDraft(BaseModel):
    """Single key result preview."""

    model_config = ConfigDict(extra="ignore")

    title: str = Field(..., min_length=1)
    description: str | None = None
    target_value: int = Field(default=1, gt=0, alias="targetValue")
    unit: str = Field(default="step", min_length=1)


class TaskTemplateDraft(BaseModel):
    """Single task-template preview."""

    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., min_length=1)
    description: str | None = None
    importance: ImportanceLevel = "Important"
    cadence: Literal["daily", "weekly", "once"] = "weekly"


class ReminderDraft(BaseModel):
    """Single reminder preview."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    title: str = Field(..., min_length=1)
    description: str | None = None
    importance: ImportanceLevel = "Important"
    cadence: Literal["daily", "weekly", "once"] = "weekly"
    time_of_day: str = Field(
        default="09:00",
        alias="timeOfDay",
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
    )


class GoalPlanningLLMResponse(BaseModel):
    """Structured JSON shape we expect from the LLM."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    goal: GoalPlanDraftInput
    key_results: list[KeyResultDraft] | None = Field(
        default=None,
        alias="keyResults",
    )


class GoalAutomationToolCall(BaseModel):
    """Tool call emitted by the automation planner."""

    model_config = ConfigDict(extra="ignore")

    tool: Literal[
        "create_goal",
        "create_key_result",
        "create_task_template",
        "create_reminder",
        "search_notes",
        "fetch_stats",
    ]
    index: int | None = None
    rationale: str | None = None


class GoalAutomationLLMResponse(BaseModel):
    """Structured JSON shape for automation planning."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    summary: str = Field(..., min_length=1)
    goal: GoalPlanDraftInput
    key_results: list[KeyResultDraft] | None = Field(
        default=None,
        alias="keyResults",
    )
    task_templates: list[TaskTemplateDraft] | None = Field(
        default=None,
        alias="taskTemplates",
    )
    reminders: list[ReminderDraft] | None = Field(
        default=None,
        alias="reminders",
    )
    tool_calls: list[GoalAutomationToolCall] = Field(alias="toolCalls")


class PlannedGoal(BaseModel):
    """Final API response goal shape."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str
    description: str
    motivation: str | None = None
    category: GoalCategory
    importance: ImportanceLevel
    tags: list[str]
    feasibility_analysis: str | None = Field(
        default=None,
        alias="feasibilityAnalysis",
    )
    ai_insights: str | None = Field(
        default=None,
        alias="aiInsights",
    )
    suggested_start_date: int = Field(alias="suggestedStartDate")
    suggested_end_date: int = Field(alias="suggestedEndDate")


class GoalPlanningResponse(BaseModel):
    """Final response returned to the internal caller.

    Can be in one of two states:
    - Clarification needed: state='clarification', clarification contains questions
    - Draft ready: state='draft', goal and key_results contain the plan
    """

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    state: Literal["clarification", "draft"] = Field(
        default="draft", description="Current response state"
    )
    goal: PlannedGoal | None = Field(
        default=None, description="Planned goal (only when state='draft')"
    )
    key_results: list[KeyResultDraft] | None = Field(
        default=None,
        alias="keyResults",
        description="Key results (only when state='draft')",
    )
    clarification: GoalClarificationLLMResponse | None = Field(
        default=None,
        description="Clarification questions (only when state='clarification')",
    )
    usage: dict[str, Any] | None = None


class GoalAutomationResponse(BaseModel):
    """Final response returned for goal automation planning."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    summary: str
    goal: PlannedGoal
    key_results: list[KeyResultDraft] | None = Field(
        default=None,
        alias="keyResults",
    )
    task_templates: list[TaskTemplateDraft] | None = Field(
        default=None,
        alias="taskTemplates",
    )
    reminders: list[ReminderDraft] | None = Field(
        default=None,
        alias="reminders",
    )
    tool_calls: list[GoalAutomationToolCall] = Field(alias="toolCalls")
    usage: dict[str, Any] | None = None
