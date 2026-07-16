"""Tests for experimental Agent runtime endpoints."""

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from ai_service.config import get_settings
from ai_service.main import create_app
from ai_service.schemas import GoalPlanningResponse


def _start_goal_run(
    client,
    *,
    run_id: str = "run-1",
    thread_id: str = "thread-1",
    locale: str = "en-US",
):
    return client.post(
        "/internal/agents/runs",
        json={
            "runId": run_id,
            "threadId": thread_id,
            "identityId": "identity-1",
            "agentType": "goal.create",
            "locale": locale,
            "input": {
                "idea": "Ship the AI Agent workspace with approval gates",
                "category": "work",
            },
        },
    )


def _start_brief_goal_run(
    client,
    *,
    run_id: str = "brief-run-1",
    thread_id: str = "brief-thread-1",
    locale: str = "en-US",
):
    return client.post(
        "/internal/agents/runs",
        json={
            "runId": run_id,
            "threadId": thread_id,
            "identityId": "identity-1",
            "agentType": "goal.create",
            "locale": locale,
            "input": {
                "idea": "Get fit",
                "category": "health",
            },
        },
    )


def _start_knowledge_run(
    client,
    *,
    run_id: str = "knowledge-run-1",
    thread_id: str = "knowledge-thread-1",
):
    return client.post(
        "/internal/agents/runs",
        json={
            "runId": run_id,
            "threadId": thread_id,
            "identityId": "identity-1",
            "agentType": "knowledge.qa",
            "locale": "en-US",
            "input": {
                "question": "What do my notes say about grounded answers?",
                "answer": "Use repository citations when evidence exists.",
                "providerId": "provider-1",
                "tokenUsage": {
                    "promptTokens": 20,
                    "completionTokens": 10,
                    "totalTokens": 30,
                },
                "processingTimeMs": 1234,
                "matchedResourceCount": 4,
                "citations": [
                    {
                        "resourceId": "resource-1",
                        "resourcePath": "notes/agent-runtime.md",
                        "title": "Agent Runtime Notes",
                        "chunkIndex": 0,
                        "excerpt": "Agent answers must show repository citations.",
                        "score": 0.91,
                    }
                ],
            },
        },
    )


def _start_insufficient_knowledge_run(
    client,
    *,
    run_id: str = "knowledge-insufficient-run-1",
    thread_id: str = "knowledge-insufficient-thread-1",
):
    return client.post(
        "/internal/agents/runs",
        json={
            "runId": run_id,
            "threadId": thread_id,
            "identityId": "identity-1",
            "agentType": "knowledge.qa",
            "locale": "en-US",
            "input": {
                "question": "What do my notes say about unindexed archives?",
                "citations": [],
            },
        },
    )


def _start_knowledge_generate_run(
    client,
    *,
    run_id: str = "knowledge-generate-run-1",
    thread_id: str = "knowledge-generate-thread-1",
):
    return client.post(
        "/internal/agents/runs",
        json={
            "runId": run_id,
            "threadId": thread_id,
            "identityId": "identity-1",
            "agentType": "knowledge.generate",
            "locale": "en-US",
            "input": {
                "topic": "Grounding knowledge answers",
                "source": (
                    "Question: What should answers cite?\nAnswer: Repository excerpts."
                ),
                "title": "Grounding knowledge answers",
                "targetSubpath": "notes/ai",
                "providerId": "provider-1",
                "model": "gpt-4o-mini",
            },
        },
    )


def _assert_goal_agent_action_plan(data):
    goal_artifact = next(
        artifact
        for artifact in data["state"]["artifacts"]
        if artifact["kind"] == "goal_draft"
    )
    action_plan = next(
        artifact
        for artifact in data["state"]["artifacts"]
        if artifact["kind"] == "action_plan"
    )
    key_results = goal_artifact["data"]["keyResults"]
    task_templates = goal_artifact["data"]["taskTemplates"]
    reminders = goal_artifact["data"]["reminders"]
    pending_actions = data["state"]["pendingActions"]

    assert len(key_results) == 2
    assert len(task_templates) == 2
    assert len(reminders) == 1
    assert key_results[0]["valueType"] == "Incremental"
    assert key_results[0]["calculationMethod"] == "Sum"
    assert key_results[0]["targetValue"] == 12
    assert key_results[0]["unit"] == "updates"
    assert task_templates[0]["importance"] == "Moderate"
    assert task_templates[0]["cadence"] == "weekly"
    assert reminders[0]["importance"] == "Moderate"
    assert reminders[0]["cadence"] == "weekly"
    assert reminders[0]["timeOfDay"] == "09:00"
    assert action_plan["data"]["summary"] == (
        "Create one goal, two key results, two task templates, and one "
        "review reminder after approval."
    )
    assert action_plan["data"]["warnings"] == []
    assert [action["tool"] for action in pending_actions] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert [action["index"] for action in pending_actions] == [
        0,
        0,
        1,
        0,
        1,
        0,
    ]
    assert pending_actions[1]["dependsOn"] == [0]
    assert pending_actions[2]["dependsOn"] == [0]
    assert pending_actions[3]["dependsOn"] == [0, 1]
    assert pending_actions[4]["dependsOn"] == [0, 2]
    assert pending_actions[5]["dependsOn"] == [0]
    assert pending_actions[1]["payload"] == key_results[0]
    assert pending_actions[3]["payload"] == task_templates[0]
    assert pending_actions[5]["payload"] == reminders[0]


def test_start_goal_create_agent_run_pauses_for_approval(client):
    response = _start_goal_run(client)

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_approval"
    assert data["run"]["agentType"] == "goal.create"
    assert data["state"]["stage"] == "approval"
    assert data["state"]["pendingActions"][0]["tool"] == "create_goal"
    assert data["state"]["executedActions"] == []
    _assert_goal_agent_action_plan(data)
    assert data["interrupts"][0]["agentType"] == "goal.create"
    assert data["interrupts"][0]["pendingActions"][0]["tool"] == "create_goal"
    assert data["interrupts"][0]["pendingActions"][3]["tool"] == (
        "create_task_template"
    )
    assert data["events"][-1]["type"] == "approval.required"


def test_start_goal_create_agent_run_accepts_read_only_context(client):
    response = client.post(
        "/internal/agents/runs",
        json={
            "runId": "run-context",
            "threadId": "thread-context",
            "identityId": "identity-1",
            "agentType": "goal.create",
            "locale": "en-US",
            "input": {
                "idea": "Ship the AI Agent workspace with approval gates",
                "related_resources": [
                    {
                        "identity_id": "identity-1",
                        "repository_id": "repo-1",
                        "resource_id": "resource-1",
                        "resource_path": "notes/agent-workflow.md",
                        "title": "Agent workflow notes",
                        "mime_type": "text/markdown",
                        "content": (
                            "Goal Agent should review existing notes before drafting."
                        ),
                        "metadata": {"source": "test"},
                    }
                ],
                "analyticsContext": {
                    "dashboard": {"stats": {"activeGoals": 2}},
                    "taskDashboard": {"summary": {"totalTasks": 5}},
                    "goals": [{"id": "goal-1", "title": "Existing Agent work"}],
                    "goalSearchResults": [
                        {"id": "goal-2", "title": "Similar workspace goal"}
                    ],
                    "extra": {"source": "test"},
                },
                "contextErrors": [
                    {
                        "tool": "fetch_goal_stats",
                        "message": "analytics unavailable",
                    }
                ],
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    by_tool = {item["tool"]: item for item in data["state"]["retrievedContext"]}
    assert by_tool["search_existing_goals"]["matches"][0]["title"] == (
        "Similar workspace goal"
    )
    assert by_tool["search_knowledge"]["matches"][0]["resourcePath"] == (
        "notes/agent-workflow.md"
    )
    assert by_tool["fetch_goal_stats"]["summary"]["hasTaskDashboard"] is True
    assert by_tool["context_load_errors"]["errors"] == [
        {
            "tool": "fetch_goal_stats",
            "message": "analytics unavailable",
        }
    ]


def test_start_goal_create_agent_run_uses_provider_backed_planner(client):
    with (
        patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.clarify",
            new_callable=AsyncMock,
        ) as mock_clarify,
        patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.plan",
            new_callable=AsyncMock,
        ) as mock_plan,
    ):
        mock_clarify.return_value = GoalPlanningResponse(state="draft")
        mock_plan.return_value = GoalPlanningResponse.model_validate(
            {
                "goal": {
                    "title": "Ship planner-backed Agent workflow",
                    "description": "Use GoalPlanningService inside the Agent graph.",
                    "motivation": "Reduce deterministic placeholder output.",
                    "category": "work",
                    "importance": "Important",
                    "tags": ["ai", "agent"],
                    "feasibilityAnalysis": "A thin async graph node is enough.",
                    "aiInsights": "Keep TS as the write boundary.",
                    "suggestedStartDate": 2000,
                    "suggestedEndDate": 3000,
                },
                "keyResults": [
                    {
                        "title": "Planner-backed draft generated",
                        "description": "The draft came from GoalPlanningService.",
                        "targetValue": 1,
                        "unit": "draft",
                    }
                ],
                "usage": {
                    "prompt_tokens": 7,
                    "completion_tokens": 5,
                    "total_tokens": 12,
                },
            }
        )

        response = client.post(
            "/internal/agents/runs",
            json={
                "runId": "run-planner-route",
                "threadId": "thread-planner-route",
                "identityId": "identity-1",
                "agentType": "goal.create",
                "locale": "en-US",
                "input": {
                    "idea": "Ship the AI Agent workspace with approval gates",
                    "category": "work",
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            },
            headers={"X-Request-Id": "request-planner-route"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_approval"
    assert data["state"]["usage"]["totalTokens"] == 12
    assert data["state"]["artifacts"][0]["data"]["title"] == (
        "Ship planner-backed Agent workflow"
    )
    mock_clarify.assert_awaited_once()
    clarify_kwargs = mock_clarify.await_args.kwargs
    assert clarify_kwargs["provider_config"].model == "gpt-4o-mini"
    assert clarify_kwargs["timeframe"] is None
    assert clarify_kwargs["locale"] == "en-US"
    assert clarify_kwargs["request_id"] == "request-planner-route"
    mock_plan.assert_awaited_once()
    kwargs = mock_plan.await_args.kwargs
    assert kwargs["provider_config"].model == "gpt-4o-mini"
    assert kwargs["timeframe"] is None
    assert kwargs["locale"] == "en-US"
    assert kwargs["request_id"] == "request-planner-route"


def test_start_goal_create_agent_run_uses_provider_backed_clarification(client):
    with (
        patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.clarify",
            new_callable=AsyncMock,
        ) as mock_clarify,
        patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.plan",
            new_callable=AsyncMock,
        ) as mock_plan,
    ):
        mock_clarify.return_value = GoalPlanningResponse.model_validate(
            {
                "state": "clarification",
                "clarification": {
                    "needsClarification": True,
                    "rationale": "Success criteria and timeline are missing.",
                    "questions": [
                        {
                            "question": "How will you measure success?",
                            "context": "A target makes the result verifiable.",
                        },
                        {
                            "question": "By when should you reach it?",
                            "context": "A deadline determines the plan horizon.",
                        },
                    ],
                },
            }
        )

        response = client.post(
            "/internal/agents/runs",
            json={
                "runId": "run-provider-clarification-route",
                "threadId": "thread-provider-clarification-route",
                "identityId": "identity-1",
                "agentType": "goal.create",
                "locale": "en-US",
                "input": {
                    "idea": (
                        "I want to improve how I plan my work, but I have not "
                        "decided what success means or by when."
                    ),
                    "category": "work",
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            },
            headers={"X-Request-Id": "request-provider-clarification-route"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_clarification"
    assert data["interrupts"][0]["rationale"] == (
        "Success criteria and timeline are missing."
    )
    assert [
        question["question"] for question in data["interrupts"][0]["questions"]
    ] == [
        "How will you measure success?",
        "By when should you reach it?",
    ]
    mock_plan.assert_not_awaited()
    mock_clarify.assert_awaited_once()
    kwargs = mock_clarify.await_args.kwargs
    assert kwargs["provider_config"].model == "gpt-4o-mini"
    assert kwargs["locale"] == "en-US"
    assert kwargs["request_id"] == "request-provider-clarification-route"


def test_start_goal_create_agent_run_pauses_for_clarification_when_input_is_brief(
    client,
):
    response = _start_brief_goal_run(client)

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_clarification"
    assert data["state"]["stage"] == "clarify"
    assert data["state"]["pendingActions"] == []
    assert data["state"]["executedActions"] == []
    assert data["interrupts"][0]["type"] == "clarification.required"
    assert data["interrupts"][0]["agentType"] == "goal.create"
    assert len(data["interrupts"][0]["questions"]) == 2
    assert data["events"][-1]["type"] == "clarification.required"


def test_start_goal_create_agent_run_uses_requested_chinese_locale(client):
    response = _start_brief_goal_run(
        client,
        run_id="brief-run-zh",
        thread_id="brief-thread-zh",
        locale="zh-CN",
    )

    assert response.status_code == 200
    questions = response.json()["interrupts"][0]["questions"]
    assert 1 <= len(questions) <= 3
    assert all(
        any("\u4e00" <= character <= "\u9fff" for character in item["question"])
        for item in questions
    )


def test_resume_goal_create_agent_run_requires_clarification_answers(client):
    start_response = _start_brief_goal_run(client)
    assert start_response.status_code == 200

    response = client.post(
        "/internal/agents/runs/brief-run-1/resume",
        json={"userDecision": "clarify"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Clarification answers are required to continue Goal Agent clarification."
    )


def test_resume_goal_create_agent_run_rejects_confirm_during_clarification(client):
    start_response = _start_brief_goal_run(client)
    assert start_response.status_code == 200

    response = client.post(
        "/internal/agents/runs/brief-run-1/resume",
        json={
            "userDecision": "confirm",
            "clarificationAnswers": ["Run a 5K without stopping."],
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Goal Agent clarification can only resume with a clarify decision."
    )


def test_resume_goal_create_agent_run_continues_from_clarification_to_approval(
    client,
):
    start_response = _start_brief_goal_run(client)
    assert start_response.status_code == 200

    response = client.post(
        "/internal/agents/runs/brief-run-1/resume",
        json={
            "userDecision": "clarify",
            "clarificationAnswers": [
                "Run a 5K without stopping.",
                "Review progress every Sunday for the next quarter.",
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_approval"
    assert data["state"]["stage"] == "approval"
    assert data["state"]["artifacts"][0]["kind"] == "goal_draft"
    assert (
        "Run a 5K without stopping."
        in data["state"]["artifacts"][0]["data"]["description"]
    )
    _assert_goal_agent_action_plan(data)
    assert data["events"][-1]["type"] == "approval.required"


def test_resume_goal_create_agent_run_rejects_clarify_during_approval(client):
    start_response = _start_goal_run(client)
    assert start_response.status_code == 200

    response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "clarify",
            "clarificationAnswers": ["Add more details."],
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Goal Agent approval can only resume with confirm, edit, cancel, "
        "or regenerate decisions."
    )


def test_resume_goal_create_agent_run_requires_external_execution_after_confirmation(
    client,
):
    start_response = _start_goal_run(client)
    assert start_response.status_code == 200
    pending_actions = start_response.json()["state"]["pendingActions"]

    response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": pending_actions,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_execution"
    assert data["state"]["stage"] == "execute"
    assert data["state"]["approvedActions"][0]["tool"] == "create_goal"
    assert [action["tool"] for action in data["state"]["approvedActions"]] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert data["state"]["executedActions"] == []
    assert data["interrupts"][0]["type"] == "execution.required"
    assert data["interrupts"][0]["approvedActions"][0]["tool"] == "create_goal"
    assert data["interrupts"][0]["approvedActions"][3]["tool"] == (
        "create_task_template"
    )
    assert data["events"][-1]["type"] == "execution.required"


def test_resume_goal_create_agent_run_requires_executed_actions_while_waiting_execution(
    client,
):
    start_response = _start_goal_run(client)
    assert start_response.status_code == 200
    pending_actions = start_response.json()["state"]["pendingActions"]

    execution_response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": pending_actions,
        },
    )
    assert execution_response.status_code == 200
    assert execution_response.json()["run"]["status"] == "waiting_execution"

    response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={"userDecision": "confirm"},
    )

    assert response.status_code == 422
    assert (
        response.json()["detail"]
        == "Executed actions are required to finish Agent execution."
    )

    snapshot_response = client.get("/internal/agents/runs/run-1")
    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["status"] == "waiting_execution"
    assert snapshot["state"]["stage"] == "execute"
    assert snapshot["state"]["executedActions"] == []


def test_resume_goal_create_agent_run_completes_with_external_execution_results(client):
    start_response = _start_goal_run(client)
    assert start_response.status_code == 200
    pending_actions = start_response.json()["state"]["pendingActions"]

    execution_response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": pending_actions,
        },
    )
    assert execution_response.status_code == 200
    assert execution_response.json()["run"]["status"] == "waiting_execution"

    response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "executedActions": [
                {
                    "tool": "create_goal",
                    "status": "executed",
                    "entityId": "goal-1",
                    "message": "Created goal",
                },
                {
                    "tool": "create_key_result",
                    "status": "executed",
                    "entityId": "key-result-1",
                    "message": "Created first key result",
                },
                {
                    "tool": "create_key_result",
                    "status": "executed",
                    "entityId": "key-result-2",
                    "message": "Created second key result",
                },
                {
                    "tool": "create_task_template",
                    "status": "executed",
                    "entityId": "task-template-1",
                    "message": "Created first task template",
                },
                {
                    "tool": "create_task_template",
                    "status": "executed",
                    "entityId": "task-template-2",
                    "message": "Created second task template",
                },
                {
                    "tool": "create_reminder",
                    "status": "executed",
                    "entityId": "reminder-1",
                    "message": "Created review reminder",
                },
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "completed"
    assert data["state"]["stage"] == "result"
    assert data["state"]["executedActions"][0]["tool"] == "create_goal"
    assert data["state"]["executedActions"][0]["status"] == "executed"
    assert [action["tool"] for action in data["state"]["executedActions"]] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert data["interrupts"] == []
    assert "action.executed" in [event["type"] for event in data["events"]]


def test_resume_goal_create_agent_run_retries_failed_execution_with_same_plan(
    client,
):
    start_response = _start_goal_run(client)
    assert start_response.status_code == 200
    pending_actions = start_response.json()["state"]["pendingActions"]

    execution_response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": pending_actions,
        },
    )
    assert execution_response.status_code == 200
    assert execution_response.json()["run"]["status"] == "waiting_execution"

    failed_response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={
            "userDecision": "confirm",
            "executedActions": [
                {
                    "tool": "create_goal",
                    "status": "failed",
                    "message": "Goal service unavailable",
                },
                {
                    "tool": "create_key_result",
                    "status": "skipped",
                    "message": "Skipped because goal creation failed.",
                },
            ],
        },
    )
    assert failed_response.status_code == 200
    assert failed_response.json()["run"]["status"] == "completed"

    retry_response = client.post(
        "/internal/agents/runs/run-1/resume",
        json={"userDecision": "confirm"},
    )

    assert retry_response.status_code == 200
    data = retry_response.json()
    assert data["run"]["status"] == "waiting_execution"
    assert data["state"]["stage"] == "execute"
    assert data["state"]["executedActions"] == []
    assert data["state"]["approvedActions"] == pending_actions
    assert data["interrupts"][0]["type"] == "execution.required"
    assert data["interrupts"][0]["approvedActions"] == pending_actions
    assert data["events"][-1]["type"] == "execution.required"


def test_get_agent_run_snapshot_and_events_use_thread_checkpoint(client):
    start_response = _start_goal_run(
        client,
        run_id="run-snapshot",
        thread_id="thread-snapshot",
    )
    assert start_response.status_code == 200

    snapshot_response = client.get("/internal/agents/runs/run-snapshot")
    events_response = client.get("/internal/agents/runs/run-snapshot/events")

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "run-snapshot"
    assert snapshot["run"]["threadId"] == "thread-snapshot"
    assert snapshot["run"]["status"] == "waiting_approval"
    assert snapshot["interrupts"][0]["runId"] == "run-snapshot"

    assert events_response.status_code == 200
    events = events_response.json()
    assert events[-1]["type"] == "approval.required"
    assert any(
        event["type"] == "tool.completed"
        and event["data"].get("tool") == "search_knowledge"
        for event in events
    )


def test_goal_agent_snapshot_survives_app_recreation(tmp_path, monkeypatch):
    checkpoint_dir = tmp_path / "agent-checkpoints"
    monkeypatch.setenv("AGENT_CHECKPOINT_DIR", str(checkpoint_dir))
    get_settings.cache_clear()

    first_app = create_app()
    with TestClient(first_app) as client:
        response = _start_goal_run(
            client,
            run_id="run-durable-route",
            thread_id="thread-durable-route",
        )
        assert response.status_code == 200
    assert (checkpoint_dir / "goal-create-runs.json").exists()

    get_settings.cache_clear()
    second_app = create_app()
    with TestClient(second_app) as client:
        snapshot_response = client.get("/internal/agents/runs/run-durable-route")
        list_response = client.get(
            "/internal/agents/runs",
            params={"identityId": "identity-1", "activeOnly": "true"},
        )

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "run-durable-route"
    assert snapshot["run"]["threadId"] == "thread-durable-route"
    assert snapshot["run"]["status"] == "waiting_approval"
    assert snapshot["state"]["stage"] == "approval"
    assert snapshot["state"]["artifacts"][0]["kind"] == "goal_draft"
    assert snapshot["interrupts"][0]["agentType"] == "goal.create"
    assert list_response.status_code == 200
    assert [run["runId"] for run in list_response.json()] == ["run-durable-route"]


def test_knowledge_qa_agent_snapshot_survives_app_recreation(tmp_path, monkeypatch):
    checkpoint_dir = tmp_path / "agent-checkpoints"
    monkeypatch.setenv("AGENT_CHECKPOINT_DIR", str(checkpoint_dir))
    get_settings.cache_clear()

    first_app = create_app()
    with TestClient(first_app) as client:
        response = _start_knowledge_run(
            client,
            run_id="knowledge-run-durable-route",
            thread_id="knowledge-thread-durable-route",
        )
        assert response.status_code == 200
    assert (checkpoint_dir / "knowledge-qa-runs.json").exists()

    get_settings.cache_clear()
    second_app = create_app()
    with TestClient(second_app) as client:
        snapshot_response = client.get(
            "/internal/agents/runs/knowledge-run-durable-route",
        )
        list_response = client.get(
            "/internal/agents/runs",
            params={"identityId": "identity-1", "status": "completed"},
        )

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "knowledge-run-durable-route"
    assert snapshot["run"]["threadId"] == "knowledge-thread-durable-route"
    assert snapshot["run"]["status"] == "completed"
    assert snapshot["state"]["stage"] == "result"
    assert snapshot["state"]["artifacts"][0]["kind"] == "knowledge_answer"
    assert snapshot["state"]["usage"]["totalTokens"] == 30
    assert snapshot["events"][-1]["type"] == "run.completed"
    assert list_response.status_code == 200
    assert [run["runId"] for run in list_response.json()] == [
        "knowledge-run-durable-route",
    ]


def test_knowledge_generate_agent_snapshot_survives_app_recreation(
    tmp_path,
    monkeypatch,
):
    checkpoint_dir = tmp_path / "agent-checkpoints"
    monkeypatch.setenv("AGENT_CHECKPOINT_DIR", str(checkpoint_dir))
    get_settings.cache_clear()

    first_app = create_app()
    with TestClient(first_app) as client:
        response = _start_knowledge_generate_run(
            client,
            run_id="knowledge-generate-run-durable-route",
            thread_id="knowledge-generate-thread-durable-route",
        )
        assert response.status_code == 200
    assert (checkpoint_dir / "knowledge-generate-runs.json").exists()

    get_settings.cache_clear()
    second_app = create_app()
    with TestClient(second_app) as client:
        snapshot_response = client.get(
            "/internal/agents/runs/knowledge-generate-run-durable-route",
        )
        list_response = client.get(
            "/internal/agents/runs",
            params={"identityId": "identity-1", "activeOnly": "true"},
        )

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "knowledge-generate-run-durable-route"
    assert snapshot["run"]["threadId"] == "knowledge-generate-thread-durable-route"
    assert snapshot["run"]["status"] == "waiting_approval"
    assert snapshot["state"]["stage"] == "approval"
    assert snapshot["state"]["artifacts"][0]["kind"] == "knowledge_note_draft"
    assert snapshot["interrupts"][0]["agentType"] == "knowledge.generate"
    assert list_response.status_code == 200
    assert [run["runId"] for run in list_response.json()] == [
        "knowledge-generate-run-durable-route",
    ]


def test_list_agent_runs_returns_recent_runs_for_identity(client):
    assert (
        _start_goal_run(
            client,
            run_id="goal-list-run",
            thread_id="goal-list-thread",
        ).status_code
        == 200
    )
    assert (
        _start_knowledge_generate_run(
            client,
            run_id="note-list-run",
            thread_id="note-list-thread",
        ).status_code
        == 200
    )
    assert (
        _start_knowledge_run(
            client,
            run_id="qa-list-run",
            thread_id="qa-list-thread",
        ).status_code
        == 200
    )

    active_response = client.get(
        "/internal/agents/runs",
        params={"identityId": "identity-1", "activeOnly": "true"},
    )
    completed_response = client.get(
        "/internal/agents/runs",
        params=[("identityId", "identity-1"), ("status", "completed")],
    )
    header_response = client.get(
        "/internal/agents/runs",
        headers={"X-Identity-Id": "identity-1"},
    )

    assert active_response.status_code == 200
    active_runs = active_response.json()
    assert {run["runId"] for run in active_runs} == {
        "goal-list-run",
        "note-list-run",
    }
    assert {run["status"] for run in active_runs} == {"waiting_approval"}

    assert completed_response.status_code == 200
    completed_runs = completed_response.json()
    assert [run["runId"] for run in completed_runs] == ["qa-list-run"]

    assert header_response.status_code == 200
    assert {run["runId"] for run in header_response.json()} >= {
        "goal-list-run",
        "note-list-run",
        "qa-list-run",
    }


def test_start_knowledge_qa_agent_run_completes_with_answer_artifact(client):
    response = _start_knowledge_run(client)

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "completed"
    assert data["run"]["agentType"] == "knowledge.qa"
    assert data["state"]["stage"] == "result"
    assert data["state"]["intent"] == "knowledge-qa"
    assert data["state"]["pendingActions"] == []
    assert data["state"]["executedActions"] == []
    assert data["interrupts"] == []
    assert data["state"]["citations"][0]["resourcePath"] == "notes/agent-runtime.md"
    assert data["state"]["usage"] == {
        "promptTokens": 20,
        "completionTokens": 10,
        "totalTokens": 30,
    }
    artifact = data["state"]["artifacts"][0]
    assert artifact["kind"] == "knowledge_answer"
    assert artifact["data"]["evidenceStatus"] == "grounded"
    assert artifact["data"]["answer"] == (
        "Use repository citations when evidence exists."
    )
    assert artifact["data"]["providerId"] == "provider-1"
    assert artifact["data"]["tokenUsage"] == {
        "promptTokens": 20,
        "completionTokens": 10,
        "totalTokens": 30,
    }
    assert artifact["data"]["processingTimeMs"] == 1234
    assert artifact["data"]["matchedResourceCount"] == 4
    assert artifact["data"]["relatedNotes"] == [
        {
            "resourceId": "resource-1",
            "resourcePath": "notes/agent-runtime.md",
            "title": "Agent Runtime Notes",
            "excerpt": "Agent answers must show repository citations.",
            "score": 0.91,
        }
    ]
    assert "citation.selected" in [event["type"] for event in data["events"]]
    assert data["events"][-1]["type"] == "run.completed"


def test_start_knowledge_qa_agent_run_marks_insufficient_evidence_without_citations(
    client,
):
    response = _start_insufficient_knowledge_run(client)

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "completed"
    assert data["run"]["agentType"] == "knowledge.qa"
    assert data["state"]["stage"] == "result"
    assert data["state"]["intent"] == "knowledge-qa"
    assert data["state"]["citations"] == []
    assert data["state"]["pendingActions"] == []
    assert data["state"]["executedActions"] == []
    assert data["interrupts"] == []
    artifact = data["state"]["artifacts"][0]
    assert artifact["kind"] == "knowledge_answer"
    assert artifact["data"]["evidenceStatus"] == "insufficient"
    assert artifact["data"]["citations"] == []
    assert artifact["data"]["relatedNotes"] == []
    assert artifact["data"]["matchedResourceCount"] == 0
    assert (
        "Current knowledge base evidence is insufficient" in artifact["data"]["answer"]
    )
    event_types = [event["type"] for event in data["events"]]
    assert "citation.selected" not in event_types
    assert data["events"][-1]["type"] == "run.completed"


def test_get_knowledge_qa_agent_snapshot_and_events_use_thread_checkpoint(client):
    start_response = _start_knowledge_run(
        client,
        run_id="knowledge-run-snapshot",
        thread_id="knowledge-thread-snapshot",
    )
    assert start_response.status_code == 200

    snapshot_response = client.get("/internal/agents/runs/knowledge-run-snapshot")
    events_response = client.get("/internal/agents/runs/knowledge-run-snapshot/events")

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "knowledge-run-snapshot"
    assert snapshot["run"]["threadId"] == "knowledge-thread-snapshot"
    assert snapshot["run"]["status"] == "completed"
    assert snapshot["state"]["artifacts"][0]["kind"] == "knowledge_answer"

    assert events_response.status_code == 200
    events = events_response.json()
    assert events[-1]["type"] == "run.completed"


def test_start_knowledge_generate_agent_run_completes_with_note_draft_artifact(
    client,
):
    response = _start_knowledge_generate_run(client)

    assert response.status_code == 200
    data = response.json()
    assert data["run"]["status"] == "waiting_approval"
    assert data["run"]["agentType"] == "knowledge.generate"
    assert data["state"]["stage"] == "approval"
    assert data["state"]["intent"] == "knowledge-generate"
    assert data["state"]["pendingActions"][0]["tool"] == "create_knowledge_note"
    assert data["state"]["executedActions"] == []
    assert data["interrupts"][0]["agentType"] == "knowledge.generate"
    artifact = data["state"]["artifacts"][0]
    assert artifact["kind"] == "knowledge_note_draft"
    assert artifact["title"] == "Grounding knowledge answers"
    assert artifact["data"]["source"] == (
        "Question: What should answers cite?\nAnswer: Repository excerpts."
    )
    assert artifact["data"]["targetSubpath"] == "notes/ai"
    assert artifact["data"]["tags"] == []
    assert artifact["data"]["duplicateRisk"] == "none"
    assert artifact["data"]["indexStatus"] == "draft"
    pending_action = artifact["data"]["savePlan"]["pendingAction"]
    assert pending_action["tool"] == "create_knowledge_note"
    assert pending_action["payload"]["title"] == "Grounding knowledge answers"
    assert pending_action["payload"]["topic"] == "Grounding knowledge answers"
    assert pending_action["payload"]["contentArtifactId"] == (
        "knowledge-generate-run-1:knowledge-note-draft"
    )
    assert pending_action["payload"]["targetSubpath"] == "notes/ai"
    assert pending_action["payload"]["providerId"] == "provider-1"
    assert pending_action["payload"]["model"] == "gpt-4o-mini"
    assert "Grounding knowledge answers" in pending_action["payload"]["contentMarkdown"]
    assert "artifact.updated" in [event["type"] for event in data["events"]]
    assert data["events"][-1]["type"] == "approval.required"


def test_resume_knowledge_generate_agent_run_completes_after_execution(
    client,
):
    start_response = _start_knowledge_generate_run(client)
    assert start_response.status_code == 200
    start = start_response.json()

    execution_response = client.post(
        "/internal/agents/runs/knowledge-generate-run-1/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": start["state"]["pendingActions"],
        },
    )
    assert execution_response.status_code == 200
    execution = execution_response.json()
    assert execution["run"]["status"] == "waiting_execution"
    assert execution["interrupts"][0]["type"] == "execution.required"

    completed_response = client.post(
        "/internal/agents/runs/knowledge-generate-run-1/resume",
        json={
            "userDecision": "confirm",
            "executedActions": [
                {
                    "tool": "create_knowledge_note",
                    "status": "executed",
                    "entityId": "resource-1",
                    "message": "Saved knowledge note to notes/ai/grounding.md.",
                    "data": {
                        "resolvedPath": "notes/ai/grounding.md",
                        "indexStatus": "pending",
                    },
                }
            ],
        },
    )

    assert completed_response.status_code == 200
    completed = completed_response.json()
    assert completed["run"]["status"] == "completed"
    assert completed["state"]["stage"] == "result"
    assert completed["state"]["executedActions"][0]["data"] == {
        "resolvedPath": "notes/ai/grounding.md",
        "indexStatus": "pending",
    }
    timeline = completed["state"]["artifacts"][-1]
    assert timeline["kind"] == "execution_timeline"
    assert timeline["data"]["summary"] == {
        "status": "success",
        "executedCount": 1,
        "failedCount": 0,
    }
    assert completed["events"][-1]["type"] == "run.completed"


def test_resume_knowledge_generate_agent_run_retries_failed_execution(client):
    start_response = _start_knowledge_generate_run(
        client,
        run_id="knowledge-generate-run-retry",
        thread_id="knowledge-generate-thread-retry",
    )
    assert start_response.status_code == 200
    start = start_response.json()

    execution_response = client.post(
        "/internal/agents/runs/knowledge-generate-run-retry/resume",
        json={
            "userDecision": "confirm",
            "approvedActions": start["state"]["pendingActions"],
        },
    )
    assert execution_response.status_code == 200
    assert execution_response.json()["run"]["status"] == "waiting_execution"

    failed_response = client.post(
        "/internal/agents/runs/knowledge-generate-run-retry/resume",
        json={
            "userDecision": "confirm",
            "executedActions": [
                {
                    "tool": "create_knowledge_note",
                    "status": "failed",
                    "message": "Repository write failed.",
                }
            ],
        },
    )
    assert failed_response.status_code == 200
    failed = failed_response.json()
    assert failed["run"]["status"] == "completed"
    timeline = failed["state"]["artifacts"][-1]
    assert timeline["kind"] == "execution_timeline"
    assert timeline["data"]["summary"] == {
        "status": "failed",
        "executedCount": 0,
        "failedCount": 1,
    }
    assert timeline["data"]["recovery"]["canRetry"] is True
    assert (
        timeline["data"]["recovery"]["retryApprovedActions"]
        == (start["state"]["pendingActions"])
    )

    retry_response = client.post(
        "/internal/agents/runs/knowledge-generate-run-retry/resume",
        json={"userDecision": "confirm"},
    )
    assert retry_response.status_code == 200
    retry = retry_response.json()
    assert retry["run"]["status"] == "waiting_execution"
    assert retry["state"]["stage"] == "execute"
    assert retry["state"]["executedActions"] == []
    assert retry["state"]["approvedActions"] == start["state"]["pendingActions"]
    assert retry["interrupts"][0]["type"] == "execution.required"
    assert retry["interrupts"][0]["approvedActions"] == start["state"]["pendingActions"]
    assert retry["events"][-1]["type"] == "execution.required"


def test_get_knowledge_generate_agent_snapshot_and_events_use_thread_checkpoint(
    client,
):
    start_response = _start_knowledge_generate_run(
        client,
        run_id="knowledge-generate-run-snapshot",
        thread_id="knowledge-generate-thread-snapshot",
    )
    assert start_response.status_code == 200

    snapshot_response = client.get(
        "/internal/agents/runs/knowledge-generate-run-snapshot",
    )
    events_response = client.get(
        "/internal/agents/runs/knowledge-generate-run-snapshot/events",
    )

    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert snapshot["run"]["runId"] == "knowledge-generate-run-snapshot"
    assert snapshot["run"]["threadId"] == "knowledge-generate-thread-snapshot"
    assert snapshot["run"]["status"] == "waiting_approval"
    assert snapshot["state"]["artifacts"][0]["kind"] == "knowledge_note_draft"

    assert events_response.status_code == 200
    events = events_response.json()
    assert events[-1]["type"] == "approval.required"


def test_resume_unknown_agent_run_returns_not_found(client):
    response = client.post(
        "/internal/agents/runs/missing-run/resume",
        json={"userDecision": "confirm"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Agent run not found."
