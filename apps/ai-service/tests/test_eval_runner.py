"""Tests for the evaluation runner."""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from ai_service.errors import UpstreamProviderError
from ai_service.evals.eval_case_loader import (
    filter_eval_cases,
    load_eval_cases,
    load_report,
)
from ai_service.evals.eval_cli import (
    RetryingLiveChatService,
    resolve_live_eval_config,
)
from ai_service.evals.eval_models import (
    DEFAULT_PROVIDER,
    EvalPolicy,
    LiveEvalConfig,
    StubChatService,
)
from ai_service.evals.eval_reporter import (
    build_report,
    evaluate_quality_gate,
)
from ai_service.evals.eval_workflow_checks import check_clarification_contract
from ai_service.evals.goal_workflow_harness import GoalWorkflowTrace
from ai_service.evals.runner import (
    evaluate_cases,
    evaluate_cases_with_mode,
)
from ai_service.schemas import ChatCompleteResponse, ChatToolCall, ChatToolCallFunction


def test_live_eval_config_uses_configurable_completion_budget(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_EVAL_MAX_TOKENS", "4096")
    config = resolve_live_eval_config(
        SimpleNamespace(
            provider="openai",
            model="gemini-2.5-flash",
            api_key="test-key",
            base_url="https://generativelanguage.googleapis.com/v1beta/openai",
            temperature=0.2,
            max_tokens=None,
        )
    )

    assert config.provider_config.max_tokens == 4096


def test_live_eval_config_rejects_nonpositive_completion_budget():
    with pytest.raises(ValueError, match="greater than zero"):
        resolve_live_eval_config(
            SimpleNamespace(
                provider="openai",
                model="gemini-2.5-flash",
                api_key="test-key",
                base_url=None,
                temperature=0.2,
                max_tokens=0,
            )
        )


@pytest.mark.asyncio
async def test_live_eval_chat_service_retries_transient_upstream_failures():
    class FlakyChatService:
        def __init__(self):
            self.calls = 0

        async def complete(self, messages, config, *, tools=None, tool_choice=None):
            del messages, config, tools, tool_choice
            self.calls += 1
            if self.calls < 3:
                raise UpstreamProviderError(
                    "temporary capacity error",
                    upstream_status_code=503,
                )
            return ChatCompleteResponse(content="ok", finish_reason="stop")

    delegate = FlakyChatService()
    service = RetryingLiveChatService(
        delegate,  # type: ignore[arg-type]
        max_attempts=3,
        base_delay_seconds=0,
    )

    response = await service.complete([], DEFAULT_PROVIDER)

    assert response.content == "ok"
    assert delegate.calls == 3


@pytest.mark.asyncio
async def test_live_eval_chat_service_does_not_retry_nontransient_failures():
    class InvalidRequestChatService:
        def __init__(self):
            self.calls = 0

        async def complete(self, messages, config, *, tools=None, tool_choice=None):
            del messages, config, tools, tool_choice
            self.calls += 1
            raise UpstreamProviderError(
                "invalid request",
                upstream_status_code=400,
            )

    delegate = InvalidRequestChatService()
    service = RetryingLiveChatService(
        delegate,  # type: ignore[arg-type]
        base_delay_seconds=0,
    )

    with pytest.raises(UpstreamProviderError, match="invalid request"):
        await service.complete([], DEFAULT_PROVIDER)

    assert delegate.calls == 1


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

    assert report.total_cases == 7
    assert report.failed_cases == 0
    assert report.by_type == {"goal_workflow": 7}
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
            "needsClarification": True,
            "questions": [
                {
                    "question": "How will you measure success?",
                    "context": "A measurable target keeps the goal concrete.",
                },
                {
                    "question": "By when should you reach this result?",
                    "context": "A timeline defines the planning horizon.",
                },
            ],
            "rationale": "The success criteria and timeline are missing.",
        }
    )
    draft_goal = {
        "title": "Improve weekly work planning",
        "description": (
            "Complete weekly priorities more reliably through planning and reviews."
        ),
        "motivation": "Reduce missed deadlines and keep priorities visible.",
        "category": "work",
        "importance": "Important",
        "tags": ["planning", "weekly-review"],
        "feasibilityAnalysis": "An eight-week planning routine is narrow enough.",
        "aiInsights": (
            "Use one measurable result before adding more planning metrics."
        ),
        "suggestedDurationDays": 56,
    }
    draft_key_results = [
        {
            "title": "Complete weekly priorities reliably",
            "description": "Complete at least 90% of weekly priorities.",
            "targetValue": 90,
            "unit": "percent",
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
            "summary": "Create the planning goal and one measurable key result.",
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
                clarification_json,
            ]
        ),
    )
    policy = EvalPolicy.model_validate_json(
        (root / "evals" / "goal_workflow_live_policy.json").read_text(
            encoding="utf-8"
        )
    )
    gate_failures = evaluate_quality_gate(
        report_results=results,
        policy=policy,
    )
    report = build_report(
        cases_path=cases_path,
        results=results,
        mode="live",
        provider_config=DEFAULT_PROVIDER,
        gate_failures=gate_failures,
    )

    assert report.total_cases == 2
    assert report.failed_cases == 0
    assert report.gate_passed
    assert policy.minimum_pass_rate == 1.0
    assert policy.require_no_new_failures
    assert policy.required_case_ids == [
        "live-goal-workflow-clarification-quality",
        "live-goal-agent-runtime-clarification",
    ]
    assert report.by_type == {
        "agent_runtime_goal_create": 1,
        "goal_workflow": 1,
    }
    assert results[0].metadata["execution_status"] == "success"
    assert results[0].metadata["clarification_question_count"] == 2
    assert {
        check.name for check in results[0].checks if check.passed
    } >= {
        "clarification_covers:success_criteria",
        "clarification_covers:timeline",
        "clarification_uses:en-US",
    }
    assert results[1].metadata["run_status"] == "waiting_clarification"
    assert results[1].metadata["action_tools"] == []
    assert {
        check.name for check in results[1].checks if check.passed
    } >= {
        "clarification_interrupt_present",
        "clarification_question_count_in_range",
        "clarification_mentions:success",
        "clarification_mentions:timeline",
    }


def test_live_goal_workflow_contract_rejects_generic_clarification():
    """A generic question must not satisfy distinct missing-information checks."""

    root = Path(__file__).resolve().parents[1]
    case = load_eval_cases(
        root / "evals" / "goal_workflow_live_cases.json"
    )[0]
    checks = check_clarification_contract(
        case,
        GoalWorkflowTrace(
            clarification_question_count=1,
            clarification_text="What else would you like to add to this goal?",
        ),
    )
    checks_by_name = {check.name: check for check in checks}

    assert not checks_by_name["clarification_covers:success_criteria"].passed
    assert not checks_by_name["clarification_covers:timeline"].passed
