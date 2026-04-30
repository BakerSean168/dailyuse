"""Evaluation runner for ai-service regression and live-provider checks.

This harness supports two modes:
- deterministic mode for CI-safe regression checks with fixed outputs
- live mode for smaller provider-backed quality checks before release
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Any, Literal, cast

import httpx
from pydantic import BaseModel, Field, TypeAdapter

from ai_service.evals.goal_workflow_harness import (
    GoalWorkflowEvalCase,
    GoalWorkflowTrace,
    run_goal_workflow_case,
)
from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    IndexedKnowledgeResource,
    KnowledgeQueryResponse,
    KnowledgeResourceDocument,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService, create_chat_service
from ai_service.services.goal_planning_service import GoalPlanningService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)

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


def load_eval_cases(path: Path) -> list[EvalCase]:
    """Load and validate evaluation cases from JSON."""

    raw = json.loads(path.read_text(encoding="utf-8"))
    return TypeAdapter(list[EvalCase]).validate_python(raw)


def filter_eval_cases(
    cases: list[EvalCase],
    *,
    case_id: str | None,
) -> list[EvalCase]:
    """Optionally narrow the case set to one explicit case id."""

    if case_id is None:
        return cases

    filtered = [case for case in cases if case.id == case_id]
    if not filtered:
        raise ValueError(f"No evaluation case found for id: {case_id}")
    return filtered


def load_policy(path: Path) -> EvalPolicy:
    """Load quality-gate policy from JSON."""

    raw = json.loads(path.read_text(encoding="utf-8"))
    return EvalPolicy.model_validate(raw)


def load_report(path: Path) -> EvalReport:
    """Load a previously generated evaluation report."""

    raw = json.loads(path.read_text(encoding="utf-8"))
    return EvalReport.model_validate(raw)


async def evaluate_cases(cases: list[EvalCase]) -> list[EvalResult]:
    """Run all evaluation cases and return normalized results."""

    return await evaluate_cases_with_mode(cases, mode="deterministic")


async def evaluate_cases_with_mode(
    cases: list[EvalCase],
    *,
    mode: EvalMode,
    live_eval_config: LiveEvalConfig | None = None,
    chat_service: ChatService | StubChatService | None = None,
) -> list[EvalResult]:
    """Run evaluation cases in deterministic or live-provider mode."""

    results: list[EvalResult] = []
    for case in cases:
        if case.type == "chat_sanity":
            if mode == "live":
                results.append(
                    await evaluate_live_chat_sanity(
                        case,
                        chat_service=ensure_live_chat_service(chat_service),
                        provider_config=ensure_live_provider_config(live_eval_config),
                    )
                )
            else:
                results.append(await evaluate_chat_sanity(case))
            continue
        if case.type == "goal_planning":
            if mode == "live":
                results.append(
                    await evaluate_live_goal_planning(
                        case,
                        chat_service=ensure_live_chat_service(chat_service),
                        provider_config=ensure_live_provider_config(live_eval_config),
                    )
                )
            else:
                results.append(await evaluate_goal_planning(case))
            continue
        if case.type == "goal_workflow":
            if mode == "live":
                results.append(
                    await evaluate_live_goal_workflow(
                        case,
                        chat_service=ensure_live_chat_service(chat_service),
                        provider_config=ensure_live_provider_config(live_eval_config),
                    )
                )
            else:
                results.append(await evaluate_goal_workflow(case))
            continue
        if mode == "live":
            results.append(
                await evaluate_live_knowledge_grounding(
                    case,
                    chat_service=ensure_live_chat_service(chat_service),
                    provider_config=ensure_live_provider_config(live_eval_config),
                )
            )
            continue
        results.append(await evaluate_knowledge_grounding(case))
    return results


async def evaluate_chat_sanity(case: ChatSanityEvalCase) -> EvalResult:
    """Score a fixed chat answer against simple sanity expectations."""

    chat_service = StubChatService(case.model_response)
    completion = await chat_service.complete(
        messages=[ChatMessage(role="user", content=case.question)],
        config=DEFAULT_PROVIDER,
    )
    answer = completion.content.strip()

    return build_chat_eval_result(
        case=case,
        answer=answer,
    )


async def evaluate_live_chat_sanity(
    case: ChatSanityEvalCase,
    *,
    chat_service: ChatService | StubChatService,
    provider_config: ProviderConfig,
) -> EvalResult:
    """Run chat sanity checks against a real provider."""

    completion = await chat_service.complete(
        messages=[ChatMessage(role="user", content=case.question)],
        config=provider_config,
    )
    return build_chat_eval_result(case=case, answer=completion.content.strip())


async def evaluate_goal_planning(case: GoalPlanningEvalCase) -> EvalResult:
    """Run the real goal-planning service against a fixed model payload."""

    stub_response = json.dumps(case.model_payload, ensure_ascii=False)
    service = GoalPlanningService(cast(ChatService, StubChatService(stub_response)))
    response = await service.plan(
        idea=case.idea,
        category=case.category,
        timeframe=case.timeframe,
        include_key_results=case.include_key_results,
        provider_config=DEFAULT_PROVIDER,
    )

    return build_goal_planning_eval_result(case=case, response=response)


async def evaluate_live_goal_planning(
    case: GoalPlanningEvalCase,
    *,
    chat_service: ChatService | StubChatService,
    provider_config: ProviderConfig,
) -> EvalResult:
    """Run goal-planning contract checks against a real provider."""

    service = GoalPlanningService(cast(ChatService, chat_service))
    response = await service.plan(
        idea=case.idea,
        category=case.category,
        timeframe=case.timeframe,
        include_key_results=case.include_key_results,
        provider_config=provider_config,
    )

    return build_goal_planning_eval_result(case=case, response=response)


async def evaluate_goal_workflow(case: GoalWorkflowEvalCase) -> EvalResult:
    """Run the full goal workflow against scripted provider responses."""

    trace = await run_goal_workflow_case(
        case,
        provider_config=DEFAULT_PROVIDER,
        mode="deterministic",
    )
    return build_goal_workflow_eval_result(case=case, trace=trace)


async def evaluate_live_goal_workflow(
    case: GoalWorkflowEvalCase,
    *,
    chat_service: ChatService | StubChatService,
    provider_config: ProviderConfig,
) -> EvalResult:
    """Run the full goal workflow against a real provider."""

    trace = await run_goal_workflow_case(
        case,
        provider_config=provider_config,
        mode="live",
        chat_service=chat_service,
    )
    return build_goal_workflow_eval_result(case=case, trace=trace)


def build_goal_planning_eval_result(
    *,
    case: GoalPlanningEvalCase,
    response: Any,
) -> EvalResult:
    """Convert a goal-planning response into standardized checks."""

    key_results = response.key_results or []
    goal_blob = " ".join(
        filter(
            None,
            [
                response.goal.title,
                response.goal.description,
                response.goal.motivation,
                response.goal.feasibility_analysis,
                response.goal.ai_insights,
            ],
        )
    ).lower()

    checks = [
        check_non_empty("goal_title_present", response.goal.title),
        EvalCheck(
            name="goal_dates_increasing",
            passed=response.goal.suggested_end_date
            > response.goal.suggested_start_date,
            detail=(
                "Suggested end date must be after start date."
                if response.goal.suggested_end_date
                <= response.goal.suggested_start_date
                else "Goal dates are ordered correctly."
            ),
        ),
        EvalCheck(
            name="goal_category_matches",
            passed=(
                case.expected_goal_category is None
                or response.goal.category == case.expected_goal_category
            ),
            detail=(
                "Expected category "
                f"{case.expected_goal_category}, got "
                f"{response.goal.category}."
                if case.expected_goal_category is not None
                and response.goal.category != case.expected_goal_category
                else "Goal category matches expectations."
            ),
        ),
        EvalCheck(
            name="key_result_count_in_range",
            passed=case.min_key_results <= len(key_results) <= case.max_key_results,
            detail=(
                f"Expected {case.min_key_results}-{case.max_key_results} key results, "
                f"got {len(key_results)}."
                if not case.min_key_results <= len(key_results) <= case.max_key_results
                else f"Key result count {len(key_results)} is within range."
            ),
        ),
    ]
    checks.extend(
        [
            EvalCheck(
                name=f"goal_mentions:{term}",
                passed=term.lower() in goal_blob,
                detail=(
                    f'Goal output should mention "{term}".'
                    if term.lower() not in goal_blob
                    else f'Goal output mentions "{term}".'
                ),
            )
            for term in case.expected_goal_terms
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "goal_title": response.goal.title,
            "key_result_count": len(key_results),
            "goal_category": response.goal.category,
        },
    )


def build_goal_workflow_eval_result(
    *,
    case: GoalWorkflowEvalCase,
    trace: GoalWorkflowTrace,
) -> EvalResult:
    """Convert one workflow trace into standardized checks."""

    checks = [
        EvalCheck(
            name="stage_sequence_matches",
            passed=trace.stages == case.expected.stage_sequence,
            detail=(
                f"Expected stages {case.expected.stage_sequence}, got {trace.stages}."
                if trace.stages != case.expected.stage_sequence
                else "Workflow stages match expectations."
            ),
        ),
        EvalCheck(
            name="action_tools_match",
            passed=trace.action_tools == case.expected.action_tools,
            detail=(
                f"Expected action tools {case.expected.action_tools}, got {trace.action_tools}."
                if trace.action_tools != case.expected.action_tools
                else "Workflow action tools match expectations."
            ),
        ),
    ]

    if case.expected.failure_stage is None:
        checks.append(
            EvalCheck(
                name="workflow_completes_without_failure_stage",
                passed=trace.failure_stage is None,
                detail=(
                    "Workflow completed without internal failures."
                    if trace.failure_stage is None
                    else (
                        f"Workflow failed during {trace.failure_stage}: "
                        f"{trace.failure_detail or 'unknown failure'}"
                    )
                ),
            )
        )
    else:
        checks.append(
            EvalCheck(
                name="failure_stage_matches",
                passed=trace.failure_stage == case.expected.failure_stage,
                detail=(
                    f"Expected failure stage {case.expected.failure_stage}, got {trace.failure_stage}."
                    if trace.failure_stage != case.expected.failure_stage
                    else "Workflow failed at the expected stage."
                ),
            )
        )

    if case.expected.execution_status is not None:
        actual_status = (
            trace.execution_summary.get("status")
            if trace.execution_summary is not None
            else None
        )
        checks.append(
            EvalCheck(
                name="execution_status_matches",
                passed=actual_status == case.expected.execution_status,
                detail=(
                    f"Expected execution status {case.expected.execution_status}, got {actual_status}."
                    if actual_status != case.expected.execution_status
                    else "Execution status matches expectations."
                ),
            )
        )

    if case.expected.can_retry is not None:
        actual_can_retry = (
            bool(trace.recovery.get("canRetry"))
            if trace.recovery is not None
            else None
        )
        checks.append(
            EvalCheck(
                name="recovery_can_retry_matches",
                passed=actual_can_retry == case.expected.can_retry,
                detail=(
                    f"Expected canRetry={case.expected.can_retry}, got {actual_can_retry}."
                    if actual_can_retry != case.expected.can_retry
                    else "Recovery canRetry matches expectations."
                ),
            )
        )

    goal_blob = trace.goal_text.lower()
    checks.extend(
        [
            EvalCheck(
                name=f"goal_mentions:{term}",
                passed=term.lower() in goal_blob,
                detail=(
                    f'Goal output should mention "{term}".'
                    if term.lower() not in goal_blob
                    else f'Goal output mentions "{term}".'
                ),
            )
            for term in case.expected.goal_terms
        ]
    )

    seen_tool_calls = set(trace.tool_calls_seen)
    checks.extend(
        [
            EvalCheck(
                name=f"tool_call_seen:{tool_name}",
                passed=tool_name in seen_tool_calls,
                detail=(
                    f'Expected provider tool call "{tool_name}" was not observed.'
                    if tool_name not in seen_tool_calls
                    else f'Observed provider tool call "{tool_name}".'
                ),
            )
            for tool_name in case.expected.required_tool_calls
        ]
    )

    recovery_blob = " ".join(
        [
            *(trace.recovery.get("suggestions", []) if trace.recovery else []),
            *(action.get("message", "") for action in trace.executed_actions),
        ]
    ).lower()
    checks.extend(
        [
            EvalCheck(
                name=f"recovery_mentions:{term}",
                passed=term.lower() in recovery_blob,
                detail=(
                    f'Recovery output should mention "{term}".'
                    if term.lower() not in recovery_blob
                    else f'Recovery output mentions "{term}".'
                ),
            )
            for term in case.expected.required_recovery_terms
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "stages": trace.stages,
            "tool_calls_seen": trace.tool_calls_seen,
            "goal_title": trace.goal_title,
            "action_tools": trace.action_tools,
            "executed_actions": trace.executed_actions,
            "execution_status": (
                trace.execution_summary.get("status")
                if trace.execution_summary is not None
                else None
            ),
            "failure_stage": trace.failure_stage,
            "failure_detail": trace.failure_detail,
            "recovery": trace.recovery,
            "completion_count": trace.completion_count,
        },
    )


async def evaluate_knowledge_grounding(case: KnowledgeGroundingEvalCase) -> EvalResult:
    """Run the real retrieval service against indexed repository resources."""

    indexing_service = KnowledgeIndexingService()
    indexed_resources = [
        indexing_service.index_resource(resource)
        for resource in case.resource_documents
    ]
    service = KnowledgeQueryService(
        cast(ChatService, StubChatService(case.model_response)),
        indexing_service,
    )
    response = await service.query(
        question=case.question,
        indexed_resources=indexed_resources,
        provider_config=DEFAULT_PROVIDER,
        max_citations=case.max_citations,
    )

    return build_knowledge_grounding_eval_result(
        case=case,
        response=response,
        indexed_resources=indexed_resources,
    )


async def evaluate_live_knowledge_grounding(
    case: KnowledgeGroundingEvalCase,
    *,
    chat_service: ChatService | StubChatService,
    provider_config: ProviderConfig,
) -> EvalResult:
    """Run grounded retrieval checks against a real provider."""

    indexing_service = KnowledgeIndexingService()
    indexed_resources = [
        indexing_service.index_resource(resource)
        for resource in case.resource_documents
    ]
    service = KnowledgeQueryService(cast(ChatService, chat_service), indexing_service)
    response = await service.query(
        question=case.question,
        indexed_resources=indexed_resources,
        provider_config=provider_config,
        max_citations=case.max_citations,
    )

    return build_knowledge_grounding_eval_result(
        case=case,
        response=response,
        indexed_resources=indexed_resources,
    )


def build_knowledge_grounding_eval_result(
    *,
    case: KnowledgeGroundingEvalCase,
    response: KnowledgeQueryResponse,
    indexed_resources: list[IndexedKnowledgeResource],
) -> EvalResult:
    """Convert a knowledge-grounding response into standardized checks."""

    indexed_paths = {resource.resource_path for resource in indexed_resources}
    cited_paths = [citation.resource_path for citation in response.citations]
    answer_lower = response.answer.lower()

    checks = [
        EvalCheck(
            name="citation_presence_matches_expectation",
            passed=(len(response.citations) > 0) == case.expect_citations,
            detail=(
                "Expected citations="
                f"{case.expect_citations}, got {len(response.citations)}."
                if (len(response.citations) > 0) != case.expect_citations
                else "Citation presence matches expectation."
            ),
        ),
        EvalCheck(
            name="citations_reference_indexed_resources",
            passed=all(path in indexed_paths for path in cited_paths),
            detail=(
                "All citations reference indexed repository resources."
                if all(path in indexed_paths for path in cited_paths)
                else "Found citations that were not part of the indexed resource set."
            ),
        ),
    ]
    checks.extend(
        [
            EvalCheck(
                name=f"cites_expected_path:{path}",
                passed=path in cited_paths,
                detail=(
                    f'Expected citation for "{path}" was not returned.'
                    if path not in cited_paths
                    else f'Citation for "{path}" was returned.'
                ),
            )
            for path in case.expected_resource_paths
        ]
    )
    checks.extend(
        [
            EvalCheck(
                name=f"answer_mentions:{term}",
                passed=term.lower() in answer_lower,
                detail=(
                    f'Answer should mention "{term}".'
                    if term.lower() not in answer_lower
                    else f'Answer mentions "{term}".'
                ),
            )
            for term in case.expected_answer_substrings
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "citation_count": len(response.citations),
            "cited_paths": cited_paths,
            "answer_preview": response.answer[:160],
        },
    )


def build_chat_eval_result(
    *,
    case: ChatSanityEvalCase,
    answer: str,
) -> EvalResult:
    """Convert one chat answer into standardized sanity checks."""

    checks = [check_non_empty("response_non_empty", answer)]
    checks.extend(
        check_contains_text(
            answer,
            expected=case.expected_substrings,
            forbidden=case.forbidden_substrings,
        )
    )
    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "response_preview": answer[:160],
        },
    )


def check_non_empty(name: str, value: str) -> EvalCheck:
    """Create a non-empty-string check."""

    normalized = value.strip()
    return EvalCheck(
        name=name,
        passed=bool(normalized),
        detail="Value is present." if normalized else "Value must not be empty.",
    )


def check_contains_text(
    answer: str,
    *,
    expected: list[str],
    forbidden: list[str],
) -> list[EvalCheck]:
    """Build substring inclusion/exclusion checks."""

    answer_lower = answer.lower()
    checks: list[EvalCheck] = []

    for token in expected:
        checks.append(
            EvalCheck(
                name=f"contains:{token}",
                passed=token.lower() in answer_lower,
                detail=(
                    f'Answer should contain "{token}".'
                    if token.lower() not in answer_lower
                    else f'Answer contains "{token}".'
                ),
            )
        )

    for token in forbidden:
        checks.append(
            EvalCheck(
                name=f"excludes:{token}",
                passed=token.lower() not in answer_lower,
                detail=(
                    f'Answer should not contain "{token}".'
                    if token.lower() in answer_lower
                    else f'Answer excludes "{token}".'
                ),
            )
        )

    return checks


def build_eval_result(
    *,
    case_id: str,
    case_type: str,
    description: str,
    checks: list[EvalCheck],
    metadata: dict[str, Any],
) -> EvalResult:
    """Aggregate check-level outcomes into one case result."""

    passed_count = sum(1 for check in checks if check.passed)
    total = len(checks)
    score = 1.0 if total == 0 else round(passed_count / total, 4)

    return EvalResult(
        id=case_id,
        type=case_type,
        description=description,
        passed=passed_count == total,
        score=score,
        checks=checks,
        metadata=metadata,
    )


def evaluate_quality_gate(
    *,
    report_results: list[EvalResult],
    policy: EvalPolicy,
    baseline_report: EvalReport | None = None,
) -> list[str]:
    """Evaluate report results against policy thresholds and an optional baseline."""

    failures: list[str] = []
    total_cases = len(report_results)
    passed_cases = sum(1 for result in report_results if result.passed)
    pass_rate = 0.0 if total_cases == 0 else passed_cases / total_cases

    if pass_rate < policy.minimum_pass_rate:
        failures.append(
            f"pass_rate below minimum: {pass_rate:.4f} < {policy.minimum_pass_rate:.4f}"
        )

    result_ids = {result.id for result in report_results}
    for case_id in policy.required_case_ids:
        if case_id not in result_ids:
            failures.append(f"required case missing: {case_id}")

    if baseline_report is None:
        return failures

    baseline_by_id = {result.id: result for result in baseline_report.results}
    current_by_id = {result.id: result for result in report_results}

    for case_id, current in current_by_id.items():
        baseline = baseline_by_id.get(case_id)
        if baseline is None:
            continue

        score_drop = baseline.score - current.score
        if score_drop > policy.max_allowed_score_drop:
            failures.append(
                f"score regression for {case_id}: "
                f"{current.score:.4f} vs baseline {baseline.score:.4f}"
            )

        if policy.require_no_new_failures and baseline.passed and not current.passed:
            failures.append(f"new failure introduced: {case_id}")

    return failures


def build_report(
    *,
    cases_path: Path,
    results: list[EvalResult],
    mode: EvalMode = "deterministic",
    provider_config: ProviderConfig | None = None,
    gate_failures: list[str] | None = None,
    baseline_path: Path | None = None,
    archive_path: Path | None = None,
) -> EvalReport:
    """Convert case results into one top-level report object."""

    total_cases = len(results)
    passed_cases = sum(1 for result in results if result.passed)
    failed_cases = total_cases - passed_cases
    by_type = dict(sorted(Counter(result.type for result in results).items()))
    normalized_gate_failures = gate_failures or []

    return EvalReport(
        generated_at=datetime.now(tz=UTC).isoformat(),
        mode=mode,
        provider=provider_config.provider if provider_config else None,
        model=provider_config.model if provider_config else None,
        base_url=provider_config.base_url if provider_config else None,
        cases_path=str(cases_path),
        total_cases=total_cases,
        passed_cases=passed_cases,
        failed_cases=failed_cases,
        pass_rate=0.0 if total_cases == 0 else round(passed_cases / total_cases, 4),
        by_type=by_type,
        failed_case_ids=[result.id for result in results if not result.passed],
        gate_passed=len(normalized_gate_failures) == 0,
        gate_failures=normalized_gate_failures,
        baseline_path=str(baseline_path) if baseline_path else None,
        archive_path=str(archive_path) if archive_path else None,
        results=results,
    )


def write_report(report: EvalReport, output_path: Path) -> None:
    """Persist the report JSON to disk."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def archive_report(output_path: Path, archive_dir: Path, generated_at: str) -> Path:
    """Copy the latest report into a timestamped history location."""

    archive_dir.mkdir(parents=True, exist_ok=True)
    timestamp = generated_at.replace(":", "-")
    archive_path = archive_dir / f"{timestamp}.json"
    shutil.copyfile(output_path, archive_path)
    return archive_path


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the evaluation runner."""

    parser = argparse.ArgumentParser(description="Run deterministic ai-service evals.")
    parser.add_argument(
        "--mode",
        choices=("deterministic", "live"),
        default="deterministic",
        help="Use deterministic stubbed outputs or a live provider configuration.",
    )
    parser.add_argument(
        "--cases",
        type=Path,
        default=None,
        help="Path to the JSON file containing evaluation cases.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Where to write the JSON evaluation report.",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        default=None,
        help="Path to the JSON policy file for quality-gate thresholds.",
    )
    parser.add_argument(
        "--baseline",
        type=Path,
        default=None,
        help="Optional baseline report to compare current results against.",
    )
    parser.add_argument(
        "--archive-dir",
        type=Path,
        default=None,
        help="Directory where timestamped report history should be written.",
    )
    parser.add_argument(
        "--case-id",
        default=None,
        help="Run only one named evaluation case from the selected case file.",
    )
    parser.add_argument(
        "--provider",
        default=None,
        help="Live mode only: provider name, for example openai or anthropic.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Live mode only: provider model name.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Live mode only: provider API key. Falls back to AI_SERVICE_EVAL_API_KEY.",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="Live mode only: optional custom base URL.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Live mode only: provider temperature.",
    )
    return parser.parse_args()


async def run() -> int:
    """CLI entrypoint used by the Nx eval target."""

    args = parse_args()
    mode = cast(EvalMode, args.mode)
    cases_path = resolve_cases_path(args)
    output_path = resolve_output_path(args)
    policy_path = resolve_policy_path(args)
    baseline_path = resolve_baseline_path(args)
    archive_dir = resolve_archive_dir(args)
    cases = filter_eval_cases(load_eval_cases(cases_path), case_id=args.case_id)
    policy = load_policy(policy_path)
    baseline_report = load_report(baseline_path) if baseline_path.exists() else None

    live_eval_config = resolve_live_eval_config(args) if mode == "live" else None
    if mode == "live":
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            results = await evaluate_cases_with_mode(
                cases,
                mode=mode,
                live_eval_config=live_eval_config,
                chat_service=create_chat_service(http_client),
            )
    else:
        results = await evaluate_cases_with_mode(cases, mode=mode)

    gate_failures = evaluate_quality_gate(
        report_results=results,
        policy=policy,
        baseline_report=baseline_report,
    )
    report = build_report(
        cases_path=cases_path,
        results=results,
        mode=mode,
        provider_config=live_eval_config.provider_config if live_eval_config else None,
        gate_failures=gate_failures,
        baseline_path=baseline_path if baseline_report else None,
    )
    write_report(report, output_path)
    archive_path = archive_report(output_path, archive_dir, report.generated_at)
    archived_report = report.model_copy(update={"archive_path": str(archive_path)})
    write_report(archived_report, output_path)
    shutil.copyfile(output_path, archive_path)

    print(
        f"ai-service evals ({archived_report.mode}): "
        f"{archived_report.passed_cases}/{archived_report.total_cases} passed "
        f"({archived_report.pass_rate * 100:.1f}%)"
    )
    print(f"quality gate: {'passed' if archived_report.gate_passed else 'failed'}")
    if archived_report.failed_case_ids:
        print("failed cases:", ", ".join(archived_report.failed_case_ids))
    if archived_report.gate_failures:
        print("gate failures:", " | ".join(archived_report.gate_failures))
    if not archived_report.gate_passed:
        return 1
    return 0


def main() -> None:
    """Synchronous wrapper for the async evaluation runner."""

    raise SystemExit(asyncio.run(run()))


def ensure_live_chat_service(
    chat_service: ChatService | StubChatService | None,
) -> ChatService | StubChatService:
    """Validate that live mode received a concrete chat service."""

    if chat_service is None:
        raise ValueError("Live evaluation mode requires a chat service instance.")
    return chat_service


def ensure_live_provider_config(
    live_eval_config: LiveEvalConfig | None,
) -> ProviderConfig:
    """Validate that live mode received a concrete provider config."""

    if live_eval_config is None:
        raise ValueError("Live evaluation mode requires provider configuration.")
    return live_eval_config.provider_config


def resolve_cases_path(args: argparse.Namespace) -> Path:
    """Resolve the effective cases path for the selected mode."""

    if args.cases is not None:
        return args.cases
    return DEFAULT_LIVE_CASES_PATH if args.mode == "live" else DEFAULT_CASES_PATH


def resolve_policy_path(args: argparse.Namespace) -> Path:
    """Resolve the effective policy path for the selected mode."""

    if args.policy is not None:
        return args.policy
    return DEFAULT_LIVE_POLICY_PATH if args.mode == "live" else DEFAULT_POLICY_PATH


def resolve_baseline_path(args: argparse.Namespace) -> Path:
    """Resolve the effective baseline path for the selected mode."""

    if args.baseline is not None:
        return args.baseline
    return DEFAULT_LIVE_BASELINE_PATH if args.mode == "live" else DEFAULT_BASELINE_PATH


def resolve_output_path(args: argparse.Namespace) -> Path:
    """Resolve the effective output path for the selected mode."""

    if args.output is not None:
        return args.output
    return DEFAULT_LIVE_OUTPUT_PATH if args.mode == "live" else DEFAULT_OUTPUT_PATH


def resolve_archive_dir(args: argparse.Namespace) -> Path:
    """Resolve the effective archive directory for the selected mode."""

    if args.archive_dir is not None:
        return args.archive_dir
    return DEFAULT_LIVE_ARCHIVE_DIR if args.mode == "live" else DEFAULT_ARCHIVE_DIR


def resolve_live_eval_config(args: argparse.Namespace) -> LiveEvalConfig:
    """Resolve provider config for live evaluation mode from args or env."""

    provider = args.provider or os.environ.get("AI_SERVICE_EVAL_PROVIDER") or "openai"
    model = args.model or os.environ.get("AI_SERVICE_EVAL_MODEL")
    api_key = args.api_key or os.environ.get("AI_SERVICE_EVAL_API_KEY")
    base_url = args.base_url or os.environ.get("AI_SERVICE_EVAL_BASE_URL")

    if not model:
        raise ValueError(
            "Live evaluation mode requires --model or AI_SERVICE_EVAL_MODEL."
        )
    if not api_key:
        raise ValueError(
            "Live evaluation mode requires --api-key or AI_SERVICE_EVAL_API_KEY."
        )

    return LiveEvalConfig(
        provider_config=ProviderConfig(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=args.temperature,
        )
    )


if __name__ == "__main__":
    main()
