"""Tests for the evaluation runner."""

from __future__ import annotations

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
    load_eval_cases,
    load_report,
)


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
                """{
                  "goal": {
                    "title": "Ship live evaluation coverage",
                    "description": "Add a live evaluation path for provider-backed regression checks before release.",
                    "motivation": "Live evaluation makes provider drift visible earlier.",
                    "category": "work",
                    "importance": "Important",
                    "tags": ["ai", "evaluation", "live"],
                    "feasibilityAnalysis": "The existing deterministic harness can be extended with a smaller live suite.",
                    "aiInsights": "Start with a small live suite and expand once failure handling is clear.",
                    "suggestedDurationDays": 14
                  },
                  "keyResults": [
                    {
                      "title": "Add live chat eval",
                      "description": "Cover a rollout guidance prompt with provider-backed execution.",
                      "targetValue": 1,
                      "unit": "suite"
                    },
                    {
                      "title": "Add live grounding eval",
                      "description": "Verify repository-grounded answers still cite the expected document.",
                      "targetValue": 1,
                      "unit": "suite"
                    }
                  ]
                }""",
                (
                    "Retrieval works by selecting relevant excerpts from repository "
                    "resources and answering from that grounded context."
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
