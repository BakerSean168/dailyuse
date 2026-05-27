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
from pathlib import Path
from typing import cast

import httpx

from ai_service.evals.eval_models import (
    DEFAULT_ARCHIVE_DIR,
    DEFAULT_BASELINE_PATH,
    DEFAULT_CASES_PATH,
    DEFAULT_LIVE_ARCHIVE_DIR,
    DEFAULT_LIVE_BASELINE_PATH,
    DEFAULT_LIVE_CASES_PATH,
    DEFAULT_LIVE_OUTPUT_PATH,
    DEFAULT_LIVE_POLICY_PATH,
    DEFAULT_OUTPUT_PATH,
    DEFAULT_POLICY_PATH,
    DEFAULT_PROVIDER,
    ChatSanityEvalCase,
    EvalCase,
    EvalCheck,
    EvalMode,
    EvalPolicy,
    EvalReport,
    EvalResult,
    GoalPlanningEvalCase,
    KnowledgeGroundingEvalCase,
    LiveEvalConfig,
    StubChatService,
)
from ai_service.evals.eval_reporter import (
    archive_report,
    build_chat_eval_result,
    build_eval_result,
    build_goal_planning_eval_result,
    build_knowledge_grounding_eval_result,
    build_report,
    ensure_live_chat_service,
    ensure_live_provider_config,
    evaluate_quality_gate,
    write_report,
)
from ai_service.evals.goal_workflow_harness import (
    GoalWorkflowEvalCase,
    GoalWorkflowTrace,
    run_goal_workflow_case,
)
from ai_service.schemas import (
    ChatMessage,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService, create_chat_service
from ai_service.services.goal_planning_service import GoalPlanningService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)

# Re-export for backward compatibility
__all__ = [
    "DEFAULT_ARCHIVE_DIR",
    "DEFAULT_BASELINE_PATH",
    "DEFAULT_CASES_PATH",
    "DEFAULT_LIVE_ARCHIVE_DIR",
    "DEFAULT_LIVE_BASELINE_PATH",
    "DEFAULT_LIVE_CASES_PATH",
    "DEFAULT_LIVE_OUTPUT_PATH",
    "DEFAULT_LIVE_POLICY_PATH",
    "DEFAULT_OUTPUT_PATH",
    "DEFAULT_POLICY_PATH",
    "DEFAULT_PROVIDER",
    "ChatSanityEvalCase",
    "EvalCase",
    "EvalCheck",
    "EvalMode",
    "EvalPolicy",
    "EvalReport",
    "EvalResult",
    "GoalPlanningEvalCase",
    "KnowledgeGroundingEvalCase",
    "LiveEvalConfig",
    "StubChatService",
    "archive_report",
    "build_chat_eval_result",
    "build_eval_result",
    "build_goal_planning_eval_result",
    "build_knowledge_grounding_eval_result",
    "build_report",
    "evaluate_cases",
    "evaluate_cases_with_mode",
    "evaluate_quality_gate",
    "filter_eval_cases",
    "load_eval_cases",
    "load_policy",
    "load_report",
    "write_report",
]


# ── Loaders ─────────────────────────────────────────────────────────────────


def load_eval_cases(path: Path) -> list[EvalCase]:
    """Load and validate evaluation cases from JSON."""

    from pydantic import TypeAdapter

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


# ── Evaluators ──────────────────────────────────────────────────────────────


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


# ── Workflow result builder ─────────────────────────────────────────────────


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
                f"Expected action tools {case.expected.action_tools}, "
                f"got {trace.action_tools}."
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
                    f"Expected failure stage {case.expected.failure_stage}, "
                    f"got {trace.failure_stage}."
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
                    f"Expected execution status "
                    f"{case.expected.execution_status}, got {actual_status}."
                    if actual_status != case.expected.execution_status
                    else "Execution status matches expectations."
                ),
            )
        )

    if case.expected.can_retry is not None:
        actual_can_retry = (
            bool(trace.recovery.get("canRetry")) if trace.recovery is not None else None
        )
        checks.append(
            EvalCheck(
                name="recovery_can_retry_matches",
                passed=actual_can_retry == case.expected.can_retry,
                detail=(
                    f"Expected canRetry={case.expected.can_retry}, "
                    f"got {actual_can_retry}."
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


# ── CLI ─────────────────────────────────────────────────────────────────────


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
