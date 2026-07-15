"""Goal workflow evaluation check functions.

Extracted from runner.py to reduce orchestration module size.
"""

from __future__ import annotations

import re

from ai_service.evals.eval_models import EvalCheck
from ai_service.evals.goal_workflow_harness import (
    GoalWorkflowEvalCase,
    GoalWorkflowTrace,
)


def check_stage_sequence(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> EvalCheck:
    return EvalCheck(
        name="stage_sequence_matches",
        passed=trace.stages == case.expected.stage_sequence,
        detail=(
            f"Expected stages {case.expected.stage_sequence}, got {trace.stages}."
            if trace.stages != case.expected.stage_sequence
            else "Workflow stages match expectations."
        ),
    )


def _matches_locale(text: str, locale: str) -> bool:
    contains_cjk = re.search(r"[\u3400-\u9fff]", text) is not None
    contains_latin = re.search(r"[A-Za-z]", text) is not None
    if locale == "zh-CN":
        return contains_cjk
    return contains_latin and not contains_cjk


def check_clarification_contract(
    case: GoalWorkflowEvalCase,
    trace: GoalWorkflowTrace,
) -> list[EvalCheck]:
    checks = [
        EvalCheck(
            name="clarification_question_count_at_most_three",
            passed=trace.clarification_question_count <= 3,
            detail=(
                "Clarification asks no more than three questions."
                if trace.clarification_question_count <= 3
                else (
                    "Clarification returned "
                    f"{trace.clarification_question_count} questions."
                )
            ),
        )
    ]
    locale = case.expected.clarification_locale
    if locale is not None:
        passed = _matches_locale(trace.clarification_text, locale)
        checks.append(
            EvalCheck(
                name=f"clarification_uses:{locale}",
                passed=passed,
                detail=(
                    f"Clarification uses {locale}."
                    if passed
                    else f"Clarification does not consistently use {locale}."
                ),
            )
        )
    return checks


def check_structured_output_locale(
    case: GoalWorkflowEvalCase,
    trace: GoalWorkflowTrace,
) -> EvalCheck | None:
    locale = case.expected.output_locale
    if locale is None:
        return None
    text = " ".join((trace.goal_text, trace.structured_text)).strip()
    passed = _matches_locale(text, locale)
    return EvalCheck(
        name=f"structured_output_uses:{locale}",
        passed=passed,
        detail=(
            f"Structured Goal Agent output uses {locale}."
            if passed
            else f"Structured Goal Agent output does not consistently use {locale}."
        ),
    )


def check_action_tools(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> EvalCheck:
    return EvalCheck(
        name="action_tools_match",
        passed=trace.action_tools == case.expected.action_tools,
        detail=(
            f"Expected action tools {case.expected.action_tools}, "
            f"got {trace.action_tools}."
            if trace.action_tools != case.expected.action_tools
            else "Workflow action tools match expectations."
        ),
    )


def check_failures(case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace) -> EvalCheck:
    if case.expected.failure_stage is None:
        return EvalCheck(
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
    return EvalCheck(
        name="failure_stage_matches",
        passed=trace.failure_stage == case.expected.failure_stage,
        detail=(
            f"Expected failure stage {case.expected.failure_stage}, "
            f"got {trace.failure_stage}."
            if trace.failure_stage != case.expected.failure_stage
            else "Workflow failed at the expected stage."
        ),
    )


def check_execution_status(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> EvalCheck | None:
    if case.expected.execution_status is None:
        return None
    actual_status = (
        trace.execution_summary.get("status")
        if trace.execution_summary is not None
        else None
    )
    return EvalCheck(
        name="execution_status_matches",
        passed=actual_status == case.expected.execution_status,
        detail=(
            f"Expected execution status "
            f"{case.expected.execution_status}, got {actual_status}."
            if actual_status != case.expected.execution_status
            else "Execution status matches expectations."
        ),
    )


def check_recovery_retry(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> EvalCheck | None:
    if case.expected.can_retry is None:
        return None
    actual_can_retry = (
        bool(trace.recovery.get("canRetry")) if trace.recovery is not None else None
    )
    return EvalCheck(
        name="recovery_can_retry_matches",
        passed=actual_can_retry == case.expected.can_retry,
        detail=(
            f"Expected canRetry={case.expected.can_retry}, got {actual_can_retry}."
            if actual_can_retry != case.expected.can_retry
            else "Recovery canRetry matches expectations."
        ),
    )


def check_goal_terms(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> list[EvalCheck]:
    goal_blob = trace.goal_text.lower()
    return [
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


def check_tool_calls(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> list[EvalCheck]:
    seen_tool_calls = set(trace.tool_calls_seen)
    return [
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


def check_recovery_terms(
    case: GoalWorkflowEvalCase, trace: GoalWorkflowTrace
) -> list[EvalCheck]:
    recovery_blob = " ".join(
        [
            *(trace.recovery.get("suggestions", []) if trace.recovery else []),
            *(action.get("message", "") for action in trace.executed_actions),
        ]
    ).lower()
    return [
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
