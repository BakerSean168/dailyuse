import pytest
from pydantic import ValidationError

from ai_service.schemas import (
    AgentActionPlan,
    AgentEvent,
    AgentResumePayload,
    AgentState,
    ReminderDraft,
)


def test_agent_action_plan_uses_confirmation_first_side_effect_shape():
    plan = AgentActionPlan(
        summary="Create a goal after approval.",
        actions=[
            {
                "tool": "create_goal",
                "index": 0,
                "payload": {"title": "Ship AI workspace"},
            },
            {
                "tool": "create_key_result",
                "index": 1,
                "dependsOn": [0],
                "payload": {"title": "Root workspace route"},
            },
        ],
    )

    assert plan.actions[1].depends_on == [0]
    assert plan.model_dump(by_alias=True)["actions"][1]["dependsOn"] == [0]


def test_agent_state_accepts_knowledge_answer_artifact_with_citation():
    state = AgentState(
        stage="answer",
        intent="knowledge-qa",
        artifacts=[
            {
                "artifactId": "artifact-1",
                "kind": "knowledge_answer",
                "title": "Grounded answer",
                "data": {"answer": "Use citations when evidence exists."},
                "updatedAt": 1,
            }
        ],
        citations=[
            {
                "resourceId": "resource-1",
                "resourcePath": "notes/ai.md",
                "chunkIndex": 0,
                "excerpt": "Answers should be grounded.",
                "score": 0.9,
            }
        ],
    )

    assert state.messages == []
    assert state.citations[0].resource_path == "notes/ai.md"


def test_agent_event_rejects_unknown_event_type():
    with pytest.raises(ValidationError):
        AgentEvent(
            eventId="event-1",
            runId="run-1",
            sequence=0,
            type="run.paused",
            createdAt=1,
        )


def test_agent_resume_payload_carries_approved_plan():
    payload = AgentResumePayload(
        userDecision="confirm",
        approvedPlan={
            "summary": "Approved plan",
            "actions": [{"tool": "create_goal", "index": 0}],
        },
        approvedActions=[{"tool": "create_goal", "index": 0}],
    )

    assert payload.user_decision == "confirm"
    assert payload.approved_actions is not None
    assert payload.approved_actions[0].tool == "create_goal"


def test_agent_resume_payload_carries_clarification_answers():
    payload = AgentResumePayload(
        userDecision="clarify",
        clarificationAnswers=[
            "Run a 5K without stopping.",
            "Review progress every Sunday.",
        ],
    )

    assert payload.user_decision == "clarify"
    assert payload.clarification_answers == [
        "Run a 5K without stopping.",
        "Review progress every Sunday.",
    ]


def test_reminder_draft_defaults_and_serializes_time_of_day():
    default_reminder = ReminderDraft(
        title="Weekly review",
        importance="Moderate",
        cadence="weekly",
    )
    custom_reminder = ReminderDraft(
        title="Morning review",
        importance="Moderate",
        cadence="daily",
        timeOfDay="10:30",
    )

    assert default_reminder.time_of_day == "09:00"
    assert default_reminder.model_dump(by_alias=True)["timeOfDay"] == "09:00"
    assert custom_reminder.time_of_day == "10:30"


def test_reminder_draft_rejects_invalid_time_of_day():
    with pytest.raises(ValidationError):
        ReminderDraft(
            title="Invalid review",
            importance="Moderate",
            cadence="weekly",
            timeOfDay="25:00",
        )


def test_agent_resume_payload_carries_external_execution_results():
    payload = AgentResumePayload(
        userDecision="confirm",
        executedActions=[
            {
                "tool": "create_goal",
                "status": "executed",
                "entityId": "goal-1",
                "message": "Created goal",
            },
            {
                "tool": "create_key_result",
                "status": "failed",
                "message": "Missing key result draft",
            },
        ],
    )

    assert payload.executed_actions is not None
    assert payload.executed_actions[0].entity_id == "goal-1"
    assert payload.executed_actions[1].status == "failed"


def test_agent_event_accepts_external_execution_required_event():
    event = AgentEvent(
        eventId="event-1",
        runId="run-1",
        sequence=0,
        type="execution.required",
        createdAt=1,
        data={"type": "execution.required"},
    )

    assert event.type == "execution.required"


def test_agent_event_accepts_clarification_required_event():
    event = AgentEvent(
        eventId="event-1",
        runId="run-1",
        sequence=0,
        type="clarification.required",
        createdAt=1,
        data={"type": "clarification.required"},
    )

    assert event.type == "clarification.required"
