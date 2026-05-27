"""Evaluation data models, constants, and stubs."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

from ai_service.evals.goal_workflow_harness import GoalWorkflowEvalCase
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    KnowledgeResourceDocument,
    ProviderConfig,
)

# ── Default paths ──────────────────────────────────────────────────────────

DEFAULT_CASES_PATH = Path("evals/regression_cases.json")
DEFAULT_POLICY_PATH = Path("evals/policy.json")
DEFAULT_BASELINE_PATH = Path("evals/baseline_report.json")
DEFAULT_OUTPUT_PATH = Path("../../reports/apps/ai-service/evals/latest.json")
DEFAULT_ARCHIVE_DIR = Path("../../reports/apps/ai-service/evals/history")
DEFAULT_LIVE_CASES_PATH = Path("evals/live_cases.json")
DEFAULT_LIVE_POLICY_PATH = Path("evals/live_policy.json")
DEFAULT_LIVE_BASELINE_PATH = Path("evals/live_baseline_report.json")
DEFAULT_LIVE_OUTPUT_PATH = Path("../../reports/apps/ai-service/evals/live-latest.json")
DEFAULT_LIVE_ARCHIVE_DIR = Path("../../reports/apps/ai-service/evals/live-history")
DEFAULT_PROVIDER = ProviderConfig(
    provider="openai",
    model="eval-stub",
    api_key="eval-key",
)


# ── Result models ──────────────────────────────────────────────────────────


class EvalCheck(BaseModel):
    """Single assertion outcome within one evaluation case."""

    name: str
    passed: bool
    detail: str


class EvalResult(BaseModel):
    """Normalized result for one evaluation case."""

    id: str
    type: str
    description: str
    passed: bool
    score: float
    checks: list[EvalCheck]
    metadata: dict[str, Any] = Field(default_factory=dict)


class EvalReport(BaseModel):
    """Machine-readable summary written by the evaluation runner."""

    generated_at: str
    mode: Literal["deterministic", "live"] = "deterministic"
    provider: str | None = None
    model: str | None = None
    base_url: str | None = None
    cases_path: str
    total_cases: int
    passed_cases: int
    failed_cases: int
    pass_rate: float
    by_type: dict[str, int]
    failed_case_ids: list[str]
    gate_passed: bool
    gate_failures: list[str]
    baseline_path: str | None = None
    archive_path: str | None = None
    results: list[EvalResult]


class EvalPolicy(BaseModel):
    """Quality-gate settings for deterministic evaluation runs."""

    minimum_pass_rate: float = Field(default=1.0, ge=0.0, le=1.0)
    required_case_ids: list[str] = Field(default_factory=list)
    max_allowed_score_drop: float = Field(default=0.0, ge=0.0, le=1.0)
    require_no_new_failures: bool = True


# ── Case models ────────────────────────────────────────────────────────────


class ChatSanityEvalCase(BaseModel):
    """Deterministic chat-quality sanity case."""

    id: str
    type: Literal["chat_sanity"]
    description: str
    question: str
    model_response: str
    expected_substrings: list[str] = Field(default_factory=list)
    forbidden_substrings: list[str] = Field(default_factory=list)


class GoalPlanningEvalCase(BaseModel):
    """Structured goal-planning contract case."""

    id: str
    type: Literal["goal_planning"]
    description: str
    idea: str
    category: str | None = None
    timeframe: str | None = None
    include_key_results: bool = True
    model_payload: dict[str, Any]
    expected_goal_category: str | None = None
    expected_goal_terms: list[str] = Field(default_factory=list)
    min_key_results: int = 0
    max_key_results: int = 10


class KnowledgeGroundingEvalCase(BaseModel):
    """Repository-grounding and citation regression case."""

    id: str
    type: Literal["knowledge_grounding"]
    description: str
    question: str
    resource_documents: list[KnowledgeResourceDocument]
    model_response: str
    expected_answer_substrings: list[str] = Field(default_factory=list)
    expected_resource_paths: list[str] = Field(default_factory=list)
    expect_citations: bool = True
    max_citations: int = 3


EvalCase = Annotated[
    ChatSanityEvalCase
    | GoalPlanningEvalCase
    | KnowledgeGroundingEvalCase
    | GoalWorkflowEvalCase,
    Field(discriminator="type"),
]
EvalMode = Literal["deterministic", "live"]


class LiveEvalConfig(BaseModel):
    """Runtime provider config used by live evaluation mode."""

    provider_config: ProviderConfig


# ── Stub ───────────────────────────────────────────────────────────────────


class StubChatService:
    """Fixed-output chat service used by the deterministic eval runner."""

    def __init__(
        self,
        responses: list[str | ChatCompleteResponse] | str | ChatCompleteResponse,
    ) -> None:
        if isinstance(responses, list):
            self._responses = list(responses)
        else:
            self._responses = [responses]
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
            raise RuntimeError("StubChatService ran out of responses.")

        response = self._responses[self._cursor]
        self._cursor += 1
        if isinstance(response, ChatCompleteResponse):
            return response.model_copy(deep=True)
        return ChatCompleteResponse(
            content=response,
            finish_reason="stop",
            usage={
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            },
        )
