"""Tests for the Agent runtime eval harness."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter

from ai_service.evals.agent_runtime_harness import (
    AgentRuntimeGoalCreateEvalCase,
    AgentRuntimeKnowledgeGenerateEvalCase,
    AgentRuntimeKnowledgeQaEvalCase,
    run_agent_runtime_goal_create_case,
    run_agent_runtime_knowledge_generate_case,
    run_agent_runtime_knowledge_qa_case,
)
from ai_service.evals.eval_models import EvalCase
from ai_service.evals.runner import build_report, evaluate_cases, load_eval_cases


def load_agent_runtime_cases() -> list[EvalCase]:
    root = Path(__file__).resolve().parents[1]
    raw = json.loads(
        (root / "evals" / "agent_runtime_cases.json").read_text(encoding="utf-8")
    )
    return TypeAdapter(list[EvalCase]).validate_python(raw)


def agent_runtime_goal_case(
    case_id: str = "agent-runtime-goal-create-planner-draft",
) -> AgentRuntimeGoalCreateEvalCase:
    return next(
        case
        for case in load_agent_runtime_cases()
        if isinstance(case, AgentRuntimeGoalCreateEvalCase) and case.id == case_id
    )


def agent_runtime_knowledge_case() -> AgentRuntimeKnowledgeQaEvalCase:
    return next(
        case
        for case in load_agent_runtime_cases()
        if isinstance(case, AgentRuntimeKnowledgeQaEvalCase)
    )


def agent_runtime_knowledge_generate_case() -> AgentRuntimeKnowledgeGenerateEvalCase:
    return next(
        case
        for case in load_agent_runtime_cases()
        if isinstance(case, AgentRuntimeKnowledgeGenerateEvalCase)
    )


@pytest.mark.asyncio
async def test_goal_create_harness_runs_planner_backed_agent_runtime_case():
    """The goal.create eval case should exercise runtime artifacts."""

    result = await run_agent_runtime_goal_create_case(agent_runtime_goal_case())

    assert result.run.status == "waiting_approval"
    assert result.state.stage == "approval"
    assert result.interrupts[0]["agentType"] == "goal.create"
    assert result.state.usage.total_tokens == 18
    goal_artifact = next(
        artifact for artifact in result.state.artifacts if artifact.kind == "goal_draft"
    )
    assert goal_artifact.title == "Ship Agent runtime checkpoint evals"
    assert len(goal_artifact.data["keyResults"]) == 2
    assert [action.tool for action in result.state.pending_actions] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]


@pytest.mark.asyncio
async def test_goal_create_harness_runs_provider_clarification_case():
    """The goal.create eval case should exercise provider-derived questions."""

    result = await run_agent_runtime_goal_create_case(
        agent_runtime_goal_case(
            "agent-runtime-goal-create-provider-clarification"
        )
    )

    assert result.run.status == "waiting_clarification"
    assert result.state.stage == "clarify"
    assert result.state.artifacts == []
    assert result.state.pending_actions == []
    clarification = result.interrupts[0]
    assert clarification["type"] == "clarification.required"
    assert [question["question"] for question in clarification["questions"]] == [
        "How will you measure success?",
        "What timeline should the goal use?",
    ]
    assert result.state.usage.total_tokens == 9


@pytest.mark.asyncio
async def test_knowledge_qa_harness_runs_grounded_agent_runtime_case():
    """The knowledge.qa eval case should exercise citation projection."""

    result = await run_agent_runtime_knowledge_qa_case(agent_runtime_knowledge_case())

    assert result.run.status == "completed"
    assert result.state.stage == "result"
    assert result.state.usage.total_tokens == 30
    assert result.state.citations[0].resource_path == "docs/agent-runtime.md"
    answer_artifact = result.state.artifacts[0]
    assert answer_artifact.kind == "knowledge_answer"
    assert answer_artifact.data["evidenceStatus"] == "grounded"
    assert answer_artifact.data["matchedResourceCount"] == 1


def test_knowledge_generate_harness_runs_draft_save_plan_agent_runtime_case():
    """The knowledge.generate eval case should exercise approval-gated saves."""

    result = run_agent_runtime_knowledge_generate_case(
        agent_runtime_knowledge_generate_case()
    )

    assert result.run.status == "waiting_approval"
    assert result.state.stage == "approval"
    assert result.interrupts[0]["agentType"] == "knowledge.generate"
    draft_artifact = next(
        artifact
        for artifact in result.state.artifacts
        if artifact.kind == "knowledge_note_draft"
    )
    assert draft_artifact.title == "Grounded knowledge answers"
    assert draft_artifact.data["savePlan"]["postSave"]["indexStatus"] == "pending"
    assert [action.tool for action in result.state.pending_actions] == [
        "create_knowledge_note",
    ]
    assert (
        result.state.pending_actions[0].payload["targetSubpath"]
        == "notes/ai"
    )


@pytest.mark.asyncio
async def test_eval_runner_passes_bundled_agent_runtime_cases():
    """The shared eval runner should dispatch Agent runtime cases."""

    root = Path(__file__).resolve().parents[1]
    cases_path = root / "evals" / "agent_runtime_cases.json"
    cases = load_eval_cases(cases_path)
    results = await evaluate_cases(cases)
    report = build_report(cases_path=cases_path, results=results)

    assert report.total_cases == 4
    assert report.failed_cases == 0
    assert report.by_type == {
        "agent_runtime_goal_create": 2,
        "agent_runtime_knowledge_generate": 1,
        "agent_runtime_knowledge_qa": 1,
    }
    assert all(result.passed for result in report.results)
