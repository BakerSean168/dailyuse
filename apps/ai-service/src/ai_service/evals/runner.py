"""Evaluation runner for ai-service regression and live-provider checks.

This harness supports two modes:
- deterministic mode for CI-safe regression checks with fixed outputs
- live mode for smaller provider-backed quality checks before release
"""

from __future__ import annotations

import json
from typing import cast

from ai_service.evals.agent_runtime_harness import (
    run_agent_runtime_goal_create_case,
    run_agent_runtime_knowledge_generate_case,
    run_agent_runtime_knowledge_qa_case,
)
from ai_service.evals.eval_case_loader import (
    filter_eval_cases,
    load_eval_cases,
    load_policy,
    load_report,
)
from ai_service.evals.eval_models import (
    DEFAULT_PROVIDER,
    AgentRuntimeGoalCreateEvalCase,
    AgentRuntimeKnowledgeGenerateEvalCase,
    AgentRuntimeKnowledgeQaEvalCase,
    ChatSanityEvalCase,
    EvalCase,
    EvalCheck,
    EvalMode,
    EvalPolicy,
    EvalResult,
    GoalPlanningEvalCase,
    KnowledgeGroundingEvalCase,
    LiveEvalConfig,
    StubChatService,
)
from ai_service.evals.eval_reporter import (
    archive_report,
    build_agent_runtime_goal_create_eval_result,
    build_agent_runtime_knowledge_generate_eval_result,
    build_agent_runtime_knowledge_qa_eval_result,
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
from ai_service.evals.eval_workflow_checks import (
    check_action_tools,
    check_clarification_contract,
    check_execution_status,
    check_failures,
    check_goal_terms,
    check_recovery_retry,
    check_recovery_terms,
    check_stage_sequence,
    check_structured_output_locale,
    check_tool_calls,
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
from ai_service.services.chat_service import ChatService
from ai_service.services.goal_planning_service import GoalPlanningService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)

# Re-export for backward compatibility
__all__ = [
    "DEFAULT_PROVIDER",
    "ChatSanityEvalCase",
    "EvalCase",
    "EvalCheck",
    "EvalMode",
    "EvalPolicy",
    "EvalResult",
    "GoalPlanningEvalCase",
    "KnowledgeGroundingEvalCase",
    "LiveEvalConfig",
    "StubChatService",
    "archive_report",
    "build_agent_runtime_goal_create_eval_result",
    "build_agent_runtime_knowledge_generate_eval_result",
    "build_agent_runtime_knowledge_qa_eval_result",
    "build_chat_eval_result",
    "build_eval_result",
    "build_goal_planning_eval_result",
    "build_knowledge_grounding_eval_result",
    "build_goal_workflow_eval_result",
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


# ── Evaluators ──────────────────────────────────────────────────────────────


async def evaluate_cases(cases: list[EvalCase]) -> list[EvalResult]:
    """Run all evaluation cases and return normalized results."""

    return await evaluate_cases_with_mode(cases, mode="deterministic")


async def evaluate_chat_sanity(
    case: ChatSanityEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Score a chat answer against simple sanity expectations."""
    active_service = chat_service or StubChatService(case.model_response)
    active_config = provider_config or DEFAULT_PROVIDER
    completion = await active_service.complete(
        messages=[ChatMessage(role="user", content=case.question)],
        config=active_config,
    )
    return build_chat_eval_result(case=case, answer=completion.content.strip())


async def evaluate_goal_planning(
    case: GoalPlanningEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run goal-planning service checks (deterministic or live)."""
    stub_response = json.dumps(case.model_payload, ensure_ascii=False)
    active_service = chat_service or StubChatService(stub_response)
    active_config = provider_config or DEFAULT_PROVIDER
    service = GoalPlanningService(cast(ChatService, active_service))
    response = await service.plan(
        idea=case.idea,
        category=case.category,
        timeframe=case.timeframe,
        include_key_results=case.include_key_results,
        provider_config=active_config,
    )
    return build_goal_planning_eval_result(case=case, response=response)


async def evaluate_goal_workflow(
    case: GoalWorkflowEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run the full goal workflow against scripted or real provider."""
    mode = "live" if provider_config is not None else "deterministic"
    active_config = provider_config or DEFAULT_PROVIDER
    trace = await run_goal_workflow_case(
        case,
        provider_config=active_config,
        mode=mode,
        chat_service=chat_service,
    )
    return build_goal_workflow_eval_result(case=case, trace=trace)


async def evaluate_knowledge_grounding(
    case: KnowledgeGroundingEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run real retrieval service checks (deterministic or live)."""
    indexing_service = KnowledgeIndexingService()
    indexed_resources = [
        indexing_service.index_resource(resource)
        for resource in case.resource_documents
    ]
    active_service = chat_service or StubChatService(case.model_response)
    active_config = provider_config or DEFAULT_PROVIDER
    service = KnowledgeQueryService(
        cast(ChatService, active_service),
        indexing_service,
    )
    response = await service.query(
        question=case.question,
        indexed_resources=indexed_resources,
        provider_config=active_config,
        max_citations=case.max_citations,
    )
    return build_knowledge_grounding_eval_result(
        case=case,
        response=response,
        indexed_resources=indexed_resources,
    )


async def evaluate_agent_runtime_goal_create(
    case: AgentRuntimeGoalCreateEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run deterministic or live-provider goal.create runtime checks."""

    planning_service = None
    if provider_config is not None:
        if chat_service is None:
            raise ValueError("Live goal.create runtime eval requires a chat service.")
        planning_service = GoalPlanningService(cast(ChatService, chat_service))
    response = await run_agent_runtime_goal_create_case(
        case,
        goal_planning_service=planning_service,
        provider_config=provider_config,
    )
    return build_agent_runtime_goal_create_eval_result(
        case=case,
        response=response,
    )


async def evaluate_agent_runtime_knowledge_qa(
    case: AgentRuntimeKnowledgeQaEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run deterministic knowledge.qa Agent runtime checks."""

    del chat_service, provider_config
    response = await run_agent_runtime_knowledge_qa_case(case)
    return build_agent_runtime_knowledge_qa_eval_result(
        case=case,
        response=response,
    )


async def evaluate_agent_runtime_knowledge_generate(
    case: AgentRuntimeKnowledgeGenerateEvalCase,
    *,
    chat_service: ChatService | StubChatService | None = None,
    provider_config: ProviderConfig | None = None,
) -> EvalResult:
    """Run deterministic knowledge.generate Agent runtime checks."""

    del chat_service, provider_config
    response = run_agent_runtime_knowledge_generate_case(case)
    return build_agent_runtime_knowledge_generate_eval_result(
        case=case,
        response=response,
    )


async def evaluate_cases_with_mode(
    cases: list[EvalCase],
    *,
    mode: EvalMode,
    live_eval_config: LiveEvalConfig | None = None,
    chat_service: ChatService | StubChatService | None = None,
) -> list[EvalResult]:
    """Run evaluation cases in deterministic or live-provider mode."""
    results: list[EvalResult] = []

    # Pre-resolve live dependencies if mode is live
    if mode == "live":
        provider_config = ensure_live_provider_config(live_eval_config)
        active_service = ensure_live_chat_service(chat_service)
    elif chat_service is not None:
        provider_config = None
        active_service = ensure_live_chat_service(chat_service)
    else:
        provider_config = None
        active_service = None

    evaluator_registry = {
        "agent_runtime_goal_create": evaluate_agent_runtime_goal_create,
        "agent_runtime_knowledge_generate": evaluate_agent_runtime_knowledge_generate,
        "agent_runtime_knowledge_qa": evaluate_agent_runtime_knowledge_qa,
        "chat_sanity": evaluate_chat_sanity,
        "goal_planning": evaluate_goal_planning,
        "goal_workflow": evaluate_goal_workflow,
        "knowledge_grounding": evaluate_knowledge_grounding,
    }

    for case in cases:
        evaluator = evaluator_registry.get(case.type)
        if not evaluator:
            raise ValueError(f"No evaluator registered for case type: {case.type}")

        # Call unified evaluator with dependency injection
        results.append(
            await evaluator(  # type: ignore
                case,  # type: ignore
                chat_service=active_service,
                provider_config=provider_config,
            )
        )
    return results


# ── Workflow result builder ─────────────────────────────────────────────────


def build_goal_workflow_eval_result(
    *,
    case: GoalWorkflowEvalCase,
    trace: GoalWorkflowTrace,
) -> EvalResult:
    """Convert one workflow trace into standardized checks."""

    checks: list[EvalCheck] = []
    checks.append(check_stage_sequence(case, trace))
    checks.append(check_action_tools(case, trace))
    checks.append(check_failures(case, trace))
    checks.extend(check_clarification_contract(case, trace))

    locale_check = check_structured_output_locale(case, trace)
    if locale_check is not None:
        checks.append(locale_check)

    exec_status_check = check_execution_status(case, trace)
    if exec_status_check is not None:
        checks.append(exec_status_check)

    recovery_retry_check = check_recovery_retry(case, trace)
    if recovery_retry_check is not None:
        checks.append(recovery_retry_check)

    checks.extend(check_goal_terms(case, trace))
    checks.extend(check_tool_calls(case, trace))
    checks.extend(check_recovery_terms(case, trace))

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
            "clarification_question_count": trace.clarification_question_count,
            "clarification_text": trace.clarification_text,
            "recovery": trace.recovery,
            "completion_count": trace.completion_count,
        },
    )
