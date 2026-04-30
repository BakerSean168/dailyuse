"""Tests for the dedicated goal-workflow eval harness."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ai_service.evals.goal_workflow_harness import (
    GoalWorkflowEvalCase,
    build_execution_recovery,
    build_execution_summary,
    run_goal_workflow_case,
)
from ai_service.evals.runner import DEFAULT_PROVIDER


def load_goal_workflow_cases() -> list[GoalWorkflowEvalCase]:
    root = Path(__file__).resolve().parents[1]
    raw = json.loads((root / "evals" / "goal_workflow_cases.json").read_text(encoding="utf-8"))
    return [GoalWorkflowEvalCase.model_validate(item) for item in raw]


@pytest.mark.asyncio
async def test_goal_workflow_harness_runs_bundled_partial_case():
    """The bundled partial-failure workflow case should produce a full trace."""

    case = load_goal_workflow_cases()[0]
    trace = await run_goal_workflow_case(
        case,
        provider_config=DEFAULT_PROVIDER,
        mode="deterministic",
    )

    assert trace.stages == ["clarification", "draft", "confirm", "result"]
    assert trace.failure_stage is None
    assert trace.action_tools == ["create_goal", "create_key_result", "create_task_template"]
    assert trace.execution_summary == {
        "status": "partial",
        "executedCount": 2,
        "skippedCount": 0,
        "failedCount": 1,
    }
    assert trace.recovery is not None
    assert trace.recovery["canRetry"] is True
    assert "search_notes" in trace.tool_calls_seen
    assert "submit_goal_automation_plan" in trace.tool_calls_seen


@pytest.mark.asyncio
async def test_goal_workflow_harness_requires_clarification_answers_when_questions_are_returned():
    """If the clarification step stops the workflow, the harness should mark that stage."""

    case = load_goal_workflow_cases()[0].model_copy(update={"clarification_answers": None})
    trace = await run_goal_workflow_case(
        case,
        provider_config=DEFAULT_PROVIDER,
        mode="deterministic",
    )

    assert trace.stages == ["clarification"]
    assert trace.failure_stage == "clarification"
    assert "clarification_answers" in (trace.failure_detail or "")


def test_goal_workflow_recovery_helpers_match_ts_status_semantics():
    """Fake execute summaries should retain the same status semantics as the TS workflow."""

    executed_actions = [
        {"tool": "create_goal", "status": "executed", "message": "ok", "entityId": "goal-1"},
        {"tool": "create_key_result", "status": "failed", "message": "broken"},
        {"tool": "create_task_template", "status": "skipped", "message": "later"},
    ]

    assert build_execution_summary(executed_actions) == {
        "status": "partial",
        "executedCount": 1,
        "skippedCount": 1,
        "failedCount": 1,
    }
    assert build_execution_recovery(executed_actions) == {
        "canRetry": True,
        "failedActions": [
            {"tool": "create_key_result", "status": "failed", "message": "broken"}
        ],
        "suggestions": [
            "Confirm the goal exists and the key result drafts are complete before retrying execution.",
            "Review skipped actions before rerunning execution.",
        ],
    }
