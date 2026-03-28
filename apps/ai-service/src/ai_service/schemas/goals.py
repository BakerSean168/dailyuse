"""Schemas for structured goal planning."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from ai_service.schemas.chat import ProviderConfig

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


class GoalAutomationRequest(BaseModel):
    """Request for generating a goal automation tool plan."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(..., min_length=10)
    category: str | None = None
    timeframe: str | None = None
    include_key_results: bool = True
    include_task_templates: bool = True
    provider_config: ProviderConfig
    request_id: str | None = None


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
    """Final response returned to the internal caller."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    goal: PlannedGoal
    key_results: list[KeyResultDraft] | None = Field(
        default=None,
        alias="keyResults",
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
    tool_calls: list[GoalAutomationToolCall] = Field(alias="toolCalls")
    usage: dict[str, Any] | None = None
