"""Tests for the evaluation runner."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ai_service.evals.runner import (
    DEFAULT_PROVIDER,
    EvalPolicy,
    LiveEvalConfig,
    StubChatService,
    build_report,
    evaluate_cases,
    evaluate_cases_with_mode,
    evaluate_quality_gate,
    filter_eval_cases,
    load_eval_cases,
    load_report,
)
from ai_service.schemas import ChatCompleteResponse, ChatToolCall, ChatToolCallFunction


@pytest.mark.asyncio
async def test_eval_runner_passes_bundled_regression_cases():
    """The checked-in evaluation fixtures should all pass."""

    cases_path = Path(__file__).resolve().parents[1] / "evals" / "regression_cases.json"
    cases = load_eval_cases(cases_path)
    results = await evaluate_cases(cases)
    report = build_report(cases_path=cases_path, results=results)

    assert report.total_cases >= 4
    assert report.failed_cases == 0
    assert report.passed_cases == report.total_cases
    assert "knowledge_grounding" in report.by_type
    assert all(result.passed for result in report.results)
    assert report.gate_passed


@pytest.mark.asyncio
async def test_eval_runner_passes_bundled_goal_workflow_cases():
    """The checked-in workflow fixtures should all pass through the shared runner."""

    cases_path = (
        Path(__file__).resolve().parents[1] / "evals" / "goal_workflow_cases.json"
    )
    cases = load_eval_cases(cases_path)
    results = await evaluate_cases(cases)
    report = build_report(cases_path=cases_path, results=results)

    assert report.total_cases == 4
    assert report.failed_cases == 0
    assert report.by_type == {"goal_workflow": 4}
    assert all(result.passed for result in report.results)


def test_filter_eval_cases_supports_case_id_selection():
    """The runner should support replaying a single named case."""

    cases_path = (
        Path(__file__).resolve().parents[1] / "evals" / "goal_workflow_cases.json"
    )
    cases = load_eval_cases(cases_path)

    filtered = filter_eval_cases(
        cases,
        case_id="goal-workflow-direct-submit-success",
    )
    assert len(filtered) == 1
    assert filtered[0].id == "goal-workflow-direct-submit-success"

    with pytest.raises(ValueError, match="No evaluation case found"):
        filter_eval_cases(cases, case_id="missing-case-id")


@pytest.mark.asyncio
async def test_eval_quality_gate_flags_score_regression():
    """A lower score than the checked-in baseline should fail the quality gate."""

    root = Path(__file__).resolve().parents[1]
    cases = load_eval_cases(root / "evals" / "regression_cases.json")
    baseline = load_report(root / "evals" / "baseline_report.json")
    results = await evaluate_cases(cases)
    degraded_results = [
        result.model_copy(update={"score": 0.5, "passed": False})
        if result.id == "chat-incremental-rollout-guidance"
        else result
        for result in results
    ]

    failures = evaluate_quality_gate(
        report_results=degraded_results,
        policy=EvalPolicy(
            minimum_pass_rate=1.0,
            required_case_ids=["chat-incremental-rollout-guidance"],
            max_allowed_score_drop=0.0,
            require_no_new_failures=True,
        ),
        baseline_report=baseline,
    )

    assert any(
        "score regression for chat-incremental-rollout-guidance" in failure
        for failure in failures
    )
    assert any(
        "new failure introduced: chat-incremental-rollout-guidance" in failure
        for failure in failures
    )


@pytest.mark.asyncio
async def test_eval_runner_supports_live_mode_with_stubbed_provider_responses():
    """Live mode should be testable without real provider credentials."""

    root = Path(__file__).resolve().parents[1]
    cases_path = root / "evals" / "live_cases.json"
    cases = load_eval_cases(cases_path)
    results = await evaluate_cases_with_mode(
        cases,
        mode="live",
        live_eval_config=LiveEvalConfig(provider_config=DEFAULT_PROVIDER),
        chat_service=StubChatService(
            [
                (
                    "Roll this out incrementally with tests and observability so "
                    "provider drift stays visible."
                ),
                json.dumps(
                    {
                        "goal": {
                            "title": "Ship live evaluation coverage",
                            "description": (
                                "Add a live evaluation path for provider-backed "
                                "regression checks before release."
                            ),
                            "motivation": (
                                "Live evaluation makes provider drift visible earlier."
                            ),
                            "category": "work",
                            "importance": "Important",
                            "tags": ["ai", "evaluation", "live"],
                            "feasibilityAnalysis": (
                                "The existing deterministic harness can be extended "
                                "with a smaller live suite."
                            ),
                            "aiInsights": (
                                "Start with a small live suite and expand once "
                                "failure handling is clear."
                            ),
                            "suggestedDurationDays": 14,
                        },
                        "keyResults": [
                            {
                                "title": "Add live chat eval",
                                "description": (
                                    "Cover a rollout guidance prompt with "
                                    "provider-backed execution."
                                ),
                                "targetValue": 1,
                                "unit": "suite",
                            },
                            {
                                "title": "Add live grounding eval",
                                "description": (
                                    "Verify repository-grounded answers still cite "
                                    "the expected document."
                                ),
                                "targetValue": 1,
                                "unit": "suite",
                            },
                        ],
                    }
                ),
                (
                    "Retrieval works by chunking resources, selecting relevant "
                    "excerpts, and answering from that grounded context."
                ),
            ]
        ),
    )
    report = build_report(
        cases_path=cases_path,
        results=results,
        mode="live",
        provider_config=DEFAULT_PROVIDER,
    )

    assert report.mode == "live"
    assert report.provider == DEFAULT_PROVIDER.provider
    assert report.model == DEFAULT_PROVIDER.model
    assert report.failed_cases == 0
    assert report.passed_cases == report.total_cases
    assert all(result.passed for result in results)


@pytest.mark.asyncio
async def test_eval_runner_supports_live_goal_workflow_with_stubbed_provider():
    """Live mode should also support the workflow harness when responses are stubbed."""

    root = Path(__file__).resolve().parents[1]
    cases_path = root / "evals" / "goal_workflow_live_cases.json"
    cases = load_eval_cases(cases_path)
    clarification_json = json.dumps(
        {
            "needsClarification": False,
            "questions": [],
            "rationale": "The idea is specific enough.",
        }
    )
    draft_goal = {
        "title": "Create a concrete AI workflow goal",
        "description": (
            "Run weekly execution reviews around one "
            "measurable milestone."
        ),
        "motivation": "Keep AI workflow progress visible.",
        "category": "work",
        "importance": "Important",
        "tags": ["ai", "workflow"],
        "feasibilityAnalysis": (
            "One milestone and a weekly ritual are narrow enough."
        ),
        "aiInsights": (
            "Start with the execution review loop "
            "before adding more automation."
        ),
        "suggestedDurationDays": 90,
    }
    draft_key_results = [
        {
            "title": "Finish one workflow milestone",
            "description": "Ship one measurable workflow improvement.",
            "targetValue": 1,
            "unit": "milestone",
        }
    ]
    draft_response = json.dumps(
        {
            "goal": draft_goal,
            "keyResults": draft_key_results,
        }
    )
    submit_plan = json.dumps(
        {
            "summary": (
                "Create the goal and attach one measurable key result."
            ),
            "goal": draft_goal,
            "keyResults": draft_key_results,
            "taskTemplates": [],
            "toolCalls": [
                {
                    "tool": "create_goal",
                    "rationale": "Create the goal first.",
                },
                {
                    "tool": "create_key_result",
                    "index": 0,
                    "rationale": "Attach the milestone as a KR.",
                },
            ],
        }
    )
    results = await evaluate_cases_with_mode(
        cases,
        mode="live",
        live_eval_config=LiveEvalConfig(provider_config=DEFAULT_PROVIDER),
        chat_service=StubChatService(
            [
                clarification_json,
                draft_response,
                ChatCompleteResponse(
                    content="",
                    finish_reason="tool_calls",
                    toolCalls=[
                        ChatToolCall(
                            id="call_submit_live",
                            function=ChatToolCallFunction(
                                name="submit_goal_automation_plan",
                                arguments=submit_plan,
                            ),
                        )
                    ],
                    usage={
                        "prompt_tokens": 10,
                        "completion_tokens": 8,
                        "total_tokens": 18,
                    },
                ),
            ]
        ),
    )
    report = build_report(
        cases_path=cases_path,
        results=results,
        mode="live",
        provider_config=DEFAULT_PROVIDER,
    )

    assert report.total_cases == 1
    assert report.failed_cases == 0
    assert report.by_type == {"goal_workflow": 1}
    assert results[0].metadata["execution_status"] == "success"
