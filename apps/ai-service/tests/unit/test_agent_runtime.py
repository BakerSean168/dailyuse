import json

import pytest

from ai_service.agent_runtime import (
    AgentRunHistoryStore,
    FileBackedInMemorySaver,
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
)
from ai_service.schemas import (
    AgentExecutedAction,
    AgentResumePayload,
    GoalPlanningResponse,
    KeyResultDraft,
    PlannedGoal,
    ProviderConfig,
)


def _knowledge_citation():
    return {
        "resourceId": "resource-1",
        "resourcePath": "notes/agent-runtime.md",
        "title": "Agent Runtime Notes",
        "chunkIndex": 0,
        "excerpt": "Agent answers must show repository citations.",
        "score": 0.91,
    }


def _incrementing_clock(start: int = 1000, step: int = 5):
    current = start

    def clock() -> int:
        nonlocal current
        value = current
        current += step
        return value

    return clock


def _assert_node_lifecycle(result, node: str) -> None:
    events = [
        (index, event)
        for index, event in enumerate(result.events)
        if event.data.get("node") == node
    ]
    started = next(
        index
        for index, event in events
        if event.type == "node.started"
    )
    completed_index, completed_event = next(
        (index, event)
        for index, event in events
        if event.type == "node.completed"
    )
    assert started < completed_index
    assert isinstance(completed_event.data.get("durationMs"), int)
    assert completed_event.data["durationMs"] >= 0


def _assert_goal_agent_action_plan(result) -> None:
    goal_artifact = next(
        artifact
        for artifact in result.state.artifacts
        if artifact.kind == "goal_draft"
    )
    action_plan = next(
        artifact
        for artifact in result.state.artifacts
        if artifact.kind == "action_plan"
    )
    key_results = goal_artifact.data["keyResults"]
    task_templates = goal_artifact.data["taskTemplates"]
    reminders = goal_artifact.data["reminders"]

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
    assert action_plan.data["summary"] == (
        "Create one goal, two key results, two task templates, and one "
        "review reminder after approval."
    )
    assert action_plan.data["warnings"] == []
    assert [action.tool for action in result.state.pending_actions] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert [action.index for action in result.state.pending_actions] == [
        0,
        0,
        1,
        0,
        1,
        0,
    ]
    assert result.state.pending_actions[1].depends_on == [0]
    assert result.state.pending_actions[2].depends_on == [0]
    assert result.state.pending_actions[3].depends_on == [0, 1]
    assert result.state.pending_actions[4].depends_on == [0, 2]
    assert result.state.pending_actions[5].depends_on == [0]
    assert result.state.pending_actions[1].payload == key_results[0]
    assert result.state.pending_actions[3].payload == task_templates[0]
    assert result.state.pending_actions[5].payload == reminders[0]


def _tool_completed_events(result, tool: str):
    return [
        event
        for event in result.events
        if event.type == "tool.completed" and event.data.get("tool") == tool
    ]


def _assert_tool_completed_duration(result, tool: str) -> None:
    completed = _tool_completed_events(result, tool)
    assert completed
    assert isinstance(completed[0].data.get("durationMs"), int)
    assert completed[0].data["durationMs"] >= 0


def test_goal_create_graph_pauses_for_approval_without_side_effects():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)

    result = runtime.start_goal_create(
        run_id="run-1",
        thread_id="thread-1",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )

    assert result.waiting_for_approval is True
    assert result.run.status == "waiting_approval"
    assert result.state.stage == "approval"
    assert result.interrupts[0]["agentType"] == "goal.create"
    assert result.state.pending_actions[0].tool == "create_goal"
    assert result.state.executed_actions == []
    assert result.state.artifacts[0].data["suggestedStartDate"] == 1000
    _assert_goal_agent_action_plan(result)
    _assert_node_lifecycle(result, "prepare_approval")
    assert [event.type for event in result.events][-1] == "approval.required"


def test_goal_create_graph_projects_supplied_read_only_context():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)

    result = runtime.start_goal_create(
        run_id="run-context",
        thread_id="thread-context",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
        related_resources=[
            {
                "identity_id": "identity-1",
                "repository_id": "repo-1",
                "resource_id": "resource-1",
                "resource_path": "notes/agent-workflow.md",
                "title": "Agent workflow notes",
                "mime_type": "text/markdown",
                "content": "Goal Agent should review existing notes before drafting.",
                "metadata": {"source": "test"},
            }
        ],
        analytics_context={
            "dashboard": {"stats": {"activeGoals": 2}},
            "task_dashboard": {"summary": {"totalTasks": 5}},
            "goals": [{"id": "goal-1", "title": "Existing Agent work"}],
            "goal_search_results": [
                {"id": "goal-2", "title": "Similar workspace goal"}
            ],
            "extra": {"source": "test"},
        },
    )

    assert result.waiting_for_approval is True
    by_tool = {
        item["tool"]: item
        for item in result.state.retrieved_context
    }
    assert by_tool["search_existing_goals"]["matches"] == [
        {"id": "goal-2", "title": "Similar workspace goal"}
    ]
    assert by_tool["search_knowledge"]["matches"][0] == {
        "resourceId": "resource-1",
        "resourcePath": "notes/agent-workflow.md",
        "title": "Agent workflow notes",
        "mimeType": "text/markdown",
        "excerpt": "Goal Agent should review existing notes before drafting.",
        "metadata": {"source": "test"},
    }
    assert by_tool["fetch_goal_stats"]["summary"] == {
        "goalCount": 1,
        "goalSearchResultCount": 1,
        "hasDashboard": True,
        "hasTaskDashboard": True,
        "dashboard": {"stats": {"activeGoals": 2}},
        "taskDashboard": {"summary": {"totalTasks": 5}},
        "extra": {"source": "test"},
    }
    action_plan = next(
        artifact
        for artifact in result.state.artifacts
        if artifact.kind == "action_plan"
    )
    assert action_plan.data["warnings"] == [
        "Potential overlap with existing goals: Similar workspace goal."
    ]
    assert _tool_completed_events(result, "search_existing_goals")[0].data[
        "matchCount"
    ] == 1
    assert _tool_completed_events(result, "search_knowledge")[0].data[
        "matchCount"
    ] == 1
    assert _tool_completed_events(result, "fetch_goal_stats")[0].data[
        "summary"
    ]["goalSearchResultCount"] == 1


def test_goal_create_graph_uses_goal_planning_service_when_provider_config_supplied():
    class StubGoalPlanningService:
        def __init__(self):
            self.calls = []

        async def plan(self, **kwargs):
            self.calls.append(kwargs)
            return GoalPlanningResponse(
                goal=PlannedGoal(
                    title="Ship planner-backed Agent workflow",
                    description="Use GoalPlanningService inside the Agent graph.",
                    motivation="Reduce deterministic placeholder output.",
                    category="work",
                    importance="Important",
                    tags=["ai", "agent"],
                    feasibilityAnalysis="A thin async graph node is enough.",
                    aiInsights="Keep TS as the write boundary.",
                    suggestedStartDate=2000,
                    suggestedEndDate=3000,
                ),
                keyResults=[
                    KeyResultDraft(
                        title="Planner-backed draft generated",
                        description="The draft came from GoalPlanningService.",
                        targetValue=1,
                        unit="draft",
                    )
                ],
                usage={
                    "prompt_tokens": 7,
                    "completion_tokens": 5,
                    "total_tokens": 12,
                },
            )

    service = StubGoalPlanningService()
    runtime = GoalCreateAgentRuntime(
        clock=lambda: 1000,
        goal_planning_service=service,
    )

    result = runtime.start_goal_create(
        run_id="run-planner",
        thread_id="thread-planner",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
        category="work",
        provider_config=ProviderConfig(
            provider="openai",
            model="gpt-4o-mini",
            api_key="test-key",
        ),
        request_id="request-planner",
    )

    assert service.calls[0]["idea"] == (
        "Ship the AI Agent workspace with approval gates"
    )
    assert service.calls[0]["provider_config"].model == "gpt-4o-mini"
    assert service.calls[0]["request_id"] == "request-planner"
    assert result.waiting_for_approval is True
    assert result.state.usage.total_tokens == 12
    goal_artifact = next(
        artifact
        for artifact in result.state.artifacts
        if artifact.kind == "goal_draft"
    )
    assert goal_artifact.data["title"] == "Ship planner-backed Agent workflow"
    assert goal_artifact.data["keyResults"] == [
        {
            "title": "Planner-backed draft generated",
            "description": "The draft came from GoalPlanningService.",
            "valueType": "Incremental",
            "calculationMethod": "Sum",
            "startValue": 0,
            "currentValue": 0,
            "targetValue": 1,
            "unit": "draft",
            "weight": 3,
        }
    ]
    assert [action.tool for action in result.state.pending_actions] == [
        "create_goal",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert result.state.pending_actions[3].depends_on == [0]


def test_goal_create_graph_pauses_for_clarification_when_input_is_too_brief():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)

    result = runtime.start_goal_create(
        run_id="run-clarify",
        thread_id="thread-clarify",
        identity_id="identity-1",
        idea="Get fit",
    )

    assert result.waiting_for_clarification is True
    assert result.run.status == "waiting_clarification"
    assert result.state.stage == "clarify"
    assert result.state.pending_actions == []
    assert result.state.executed_actions == []
    assert result.interrupts[0]["type"] == "clarification.required"
    assert result.interrupts[0]["agentType"] == "goal.create"
    assert len(result.interrupts[0]["questions"]) == 2
    assert [event.type for event in result.events][-1] == (
        "clarification.required"
    )


def test_goal_create_graph_resumes_from_clarification_to_approval():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    runtime.start_goal_create(
        run_id="run-clarify",
        thread_id="thread-clarify",
        identity_id="identity-1",
        idea="Get fit",
    )

    result = runtime.resume_goal_create(
        thread_id="thread-clarify",
        payload=AgentResumePayload(
            userDecision="clarify",
            clarificationAnswers=[
                "Run a 5K without stopping.",
                "Review progress every Sunday for the next quarter.",
            ],
        ),
    )

    assert result.waiting_for_approval is True
    assert result.run.status == "waiting_approval"
    assert result.state.stage == "approval"
    assert result.state.messages[-1].content.startswith("Clarification answers:")
    assert result.state.artifacts[0].data["title"].startswith("Get fit")
    assert "Run a 5K without stopping." in result.state.artifacts[0].data[
        "description"
    ]
    _assert_goal_agent_action_plan(result)
    assert [event.type for event in result.events][-1] == "approval.required"


def test_goal_create_graph_rejects_non_clarify_decision_during_clarification():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    runtime.start_goal_create(
        run_id="run-clarify",
        thread_id="thread-clarify",
        identity_id="identity-1",
        idea="Get fit",
    )

    with pytest.raises(
        ValueError,
        match="Goal Agent clarification can only resume with a clarify decision.",
    ):
        runtime.resume_goal_create(
            thread_id="thread-clarify",
            payload=AgentResumePayload(
                userDecision="confirm",
                clarificationAnswers=["Run a 5K without stopping."],
            ),
        )


def test_goal_create_graph_rejects_clarify_decision_during_approval():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    runtime.start_goal_create(
        run_id="run-approval",
        thread_id="thread-approval",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )

    with pytest.raises(
        ValueError,
        match=(
            "Goal Agent approval can only resume with confirm, edit, cancel, "
            "or regenerate decisions."
        ),
    ):
        runtime.resume_goal_create(
            thread_id="thread-approval",
            payload=AgentResumePayload(
                userDecision="clarify",
                clarificationAnswers=["Add more details."],
            ),
        )


def test_goal_create_graph_resumes_same_thread_and_pauses_for_external_execution():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_goal_create(
        run_id="run-1",
        thread_id="thread-1",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )

    resumed = runtime.resume_goal_create(
        thread_id="thread-1",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )

    assert resumed.waiting_for_execution is True
    assert resumed.run.status == "waiting_execution"
    assert resumed.state.stage == "execute"
    assert resumed.state.approved_actions[0].tool == "create_goal"
    assert [action.tool for action in resumed.state.approved_actions] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert resumed.state.executed_actions == []
    assert resumed.interrupts[0]["type"] == "execution.required"
    assert resumed.interrupts[0]["agentType"] == "goal.create"
    assert resumed.interrupts[0]["approvedActions"][0]["tool"] == "create_goal"
    assert resumed.interrupts[0]["approvedActions"][3]["tool"] == (
        "create_task_template"
    )
    assert resumed.interrupts[0]["artifacts"][0]["kind"] == "goal_draft"
    assert [event.type for event in resumed.events][-1] == "execution.required"


def test_goal_create_graph_completes_after_ts_executor_results_are_resumed():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_goal_create(
        run_id="run-1",
        thread_id="thread-1",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )
    runtime.resume_goal_create(
        thread_id="thread-1",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )

    resumed = runtime.resume_goal_create(
        thread_id="thread-1",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="executed",
                    entityId="goal-1",
                    message="Created goal",
                ),
                AgentExecutedAction(
                    tool="create_key_result",
                    status="executed",
                    entityId="key-result-1",
                    message="Created first key result",
                ),
                AgentExecutedAction(
                    tool="create_key_result",
                    status="executed",
                    entityId="key-result-2",
                    message="Created second key result",
                ),
                AgentExecutedAction(
                    tool="create_task_template",
                    status="executed",
                    entityId="task-template-1",
                    message="Created first task template",
                ),
                AgentExecutedAction(
                    tool="create_task_template",
                    status="executed",
                    entityId="task-template-2",
                    message="Created second task template",
                ),
                AgentExecutedAction(
                    tool="create_reminder",
                    status="executed",
                    entityId="reminder-1",
                    message="Created review reminder",
                ),
            ],
        ),
    )

    assert resumed.run.status == "completed"
    assert resumed.state.stage == "result"
    assert resumed.interrupts == []
    assert resumed.state.executed_actions[0].entity_id == "goal-1"
    assert [action.tool for action in resumed.state.executed_actions] == [
        "create_goal",
        "create_key_result",
        "create_key_result",
        "create_task_template",
        "create_task_template",
        "create_reminder",
    ]
    assert "action.executed" in [event.type for event in resumed.events]
    assert _tool_completed_events(resumed, "create_goal")[0].data["status"] == (
        "executed"
    )
    assert _tool_completed_events(resumed, "create_key_result")[0].data[
        "source"
    ] == "external_executor"
    _assert_tool_completed_duration(resumed, "create_goal")
    _assert_tool_completed_duration(resumed, "create_key_result")
    assert [event.type for event in resumed.events][-1] == "run.completed"


def test_goal_create_graph_projects_execution_timeline_and_recovery_artifact():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_goal_create(
        run_id="run-recovery",
        thread_id="thread-recovery",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )
    runtime.resume_goal_create(
        thread_id="thread-recovery",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )

    resumed = runtime.resume_goal_create(
        thread_id="thread-recovery",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="failed",
                    message="Goal service unavailable",
                ),
                AgentExecutedAction(
                    tool="create_key_result",
                    status="skipped",
                    message="Skipped because goal creation failed.",
                ),
                AgentExecutedAction(
                    tool="create_task_template",
                    status="skipped",
                    message="Skipped because goal creation failed.",
                ),
            ],
        ),
    )

    timeline = next(
        artifact
        for artifact in resumed.state.artifacts
        if artifact.kind == "execution_timeline"
    )
    assert timeline.data["summary"] == {
        "status": "failed",
        "executedCount": 0,
        "skippedCount": 2,
        "failedCount": 1,
    }
    assert timeline.data["timeline"][0]["message"] == "Goal service unavailable"
    assert timeline.data["recovery"]["canRetry"] is True
    assert timeline.data["recovery"]["failedActions"][0]["tool"] == "create_goal"
    assert timeline.data["recovery"]["skippedActions"][0]["tool"] == (
        "create_key_result"
    )
    assert timeline.data["recovery"]["retryApprovedActions"] == [
        action.model_dump(by_alias=True)
        for action in start.state.pending_actions
    ]
    assert timeline.data["recovery"]["suggestions"] == [
        (
            "Fix the goal creation error and retry the same approved plan; "
            "dependent actions were skipped."
        ),
        "Review skipped dependent actions before retrying execution.",
    ]
    assert "artifact.updated" in [event.type for event in resumed.events]
    assert resumed.events[-1].type == "run.completed"


def test_goal_create_graph_retries_failed_execution_with_same_approved_plan():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_goal_create(
        run_id="run-retry",
        thread_id="thread-retry",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )
    runtime.resume_goal_create(
        thread_id="thread-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )
    runtime.resume_goal_create(
        thread_id="thread-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="failed",
                    message="Goal service unavailable",
                ),
                AgentExecutedAction(
                    tool="create_key_result",
                    status="skipped",
                    message="Skipped because goal creation failed.",
                ),
            ],
        ),
    )

    retry = runtime.resume_goal_create(
        thread_id="thread-retry",
        payload=AgentResumePayload(userDecision="confirm"),
    )

    assert retry.waiting_for_execution is True
    assert retry.run.status == "waiting_execution"
    assert retry.state.stage == "execute"
    assert retry.state.executed_actions == []
    assert [
        action.model_dump(by_alias=True)
        for action in retry.state.approved_actions
    ] == [
        action.model_dump(by_alias=True)
        for action in start.state.pending_actions
    ]
    assert retry.interrupts[0]["type"] == "execution.required"
    assert retry.interrupts[0]["approvedActions"][0]["tool"] == "create_goal"
    assert retry.events[-1].type == "execution.required"


def test_goal_create_file_checkpoint_restores_failed_result_and_retry(tmp_path):
    checkpoint_path = tmp_path / "goal-create.pkl"
    runtime = GoalCreateAgentRuntime(
        checkpointer=FileBackedInMemorySaver(checkpoint_path),
        clock=lambda: 1000,
    )
    start = runtime.start_goal_create(
        run_id="run-durable",
        thread_id="thread-durable",
        identity_id="identity-1",
        idea="Ship durable Agent checkpoint recovery with retryable execution",
    )
    runtime.resume_goal_create(
        thread_id="thread-durable",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )
    runtime.resume_goal_create(
        thread_id="thread-durable",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="failed",
                    message="Goal service unavailable",
                ),
                AgentExecutedAction(
                    tool="create_key_result",
                    status="skipped",
                    message="Skipped because goal creation failed.",
                ),
            ],
        ),
    )

    restored = GoalCreateAgentRuntime(
        checkpointer=FileBackedInMemorySaver(checkpoint_path),
        clock=lambda: 2000,
    )
    snapshot = restored.get_snapshot(thread_id="thread-durable")
    retry = restored.resume_goal_create(
        thread_id=restored.get_thread_id(run_id="run-durable") or "",
        payload=AgentResumePayload(userDecision="confirm"),
    )

    assert checkpoint_path.exists()
    assert restored.get_thread_id(run_id="run-durable") == "thread-durable"
    assert snapshot.run.status == "completed"
    assert snapshot.state.stage == "result"
    timeline = next(
        artifact
        for artifact in snapshot.state.artifacts
        if artifact.kind == "execution_timeline"
    )
    assert timeline.data["recovery"]["canRetry"] is True
    assert retry.waiting_for_execution is True
    assert retry.state.stage == "execute"
    assert retry.state.executed_actions == []
    assert [
        action.model_dump(by_alias=True)
        for action in retry.state.approved_actions
    ] == [
        action.model_dump(by_alias=True)
        for action in start.state.pending_actions
    ]


def test_goal_create_file_run_history_restores_recent_run_list(tmp_path):
    history_path = tmp_path / "goal-create-runs.json"
    runtime = GoalCreateAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=_incrementing_clock(),
    )
    runtime.start_goal_create(
        run_id="run-history-a",
        thread_id="thread-history-a",
        identity_id="identity-1",
        conversation_id="conversation-1",
        idea=(
            "Ship durable Agent run history recovery with approval gates and "
            "retryable execution"
        ),
    )
    completed = runtime.start_goal_create(
        run_id="run-history-b",
        thread_id="thread-history-b",
        identity_id="identity-1",
        conversation_id="conversation-1",
        idea=(
            "Deliver persistent Agent execution results with approved actions "
            "and retry evidence"
        ),
    )
    runtime.resume_goal_create(
        thread_id="thread-history-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=completed.state.pending_actions,
        ),
    )
    runtime.resume_goal_create(
        thread_id="thread-history-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="executed",
                    entityId="goal-history-b",
                    message="Created goal",
                )
            ],
        ),
    )

    restored = GoalCreateAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=lambda: 2000,
    )

    assert history_path.exists()
    assert restored.get_thread_id(run_id="run-history-a") == "thread-history-a"
    assert [run.run_id for run in restored.list_runs(identity_id="identity-1")] == [
        "run-history-b",
        "run-history-a",
    ]
    assert [
        run.run_id
        for run in restored.list_runs(identity_id="identity-1", active_only=True)
    ] == ["run-history-a"]
    restored_snapshot = restored.get_snapshot(thread_id="thread-history-a")
    history_payload = json.loads(history_path.read_text(encoding="utf-8"))
    waiting_result = history_payload["results"]["run-history-a"]
    completed_result = history_payload["results"]["run-history-b"]

    assert restored_snapshot.interrupts[0]["agentType"] == "goal.create"
    assert restored_snapshot.interrupts[0]["pendingActions"][0]["tool"] == (
        "create_goal"
    )
    assert waiting_result["interrupts"][0]["agentType"] == "goal.create"
    assert waiting_result["interrupts"][0]["pendingActions"][0]["tool"] == (
        "create_goal"
    )
    assert waiting_result["state"]["pendingActions"][0]["tool"] == "create_goal"
    assert completed_result["run"]["status"] == "completed"
    assert completed_result["state"]["approvedActions"][0]["tool"] == "create_goal"
    assert completed_result["state"]["executedActions"][0]["entityId"] == (
        "goal-history-b"
    )


def test_agent_run_history_store_loads_metadata_only_manifest(tmp_path):
    history_path = tmp_path / "goal-create-runs.json"
    history_path.write_text(
        json.dumps(
            {
                "version": 1,
                "runs": {
                    "run-legacy": {
                        "runId": "run-legacy",
                        "threadId": "thread-legacy",
                        "conversationId": "conversation-legacy",
                        "identityId": "identity-1",
                        "agentType": "goal.create",
                        "status": "waiting_approval",
                        "createdAt": 1000,
                        "updatedAt": 1100,
                    }
                },
            }
        ),
        encoding="utf-8",
    )

    store = AgentRunHistoryStore(history_path)

    assert store.thread_index() == {"run-legacy": "thread-legacy"}
    assert [run.run_id for run in store.list_runs()] == ["run-legacy"]
    assert store.get_result_by_thread_id(thread_id="thread-legacy") is None


def test_agent_run_history_store_quarantines_invalid_manifest(tmp_path):
    history_path = tmp_path / "goal-create-runs.json"
    history_path.write_text("{not valid json", encoding="utf-8")

    store = AgentRunHistoryStore(history_path)

    assert store.list_runs() == []
    assert store.thread_index() == {}
    assert not history_path.exists()
    assert (tmp_path / "goal-create-runs.json.corrupt").exists()


def test_file_backed_checkpoint_quarantines_invalid_pickle(tmp_path):
    checkpoint_path = tmp_path / "goal-create.pkl"
    checkpoint_path.write_bytes(b"not a pickle payload")

    saver = FileBackedInMemorySaver(checkpoint_path)

    assert list(saver.list(None)) == []
    assert not checkpoint_path.exists()
    assert (tmp_path / "goal-create.pkl.corrupt").exists()


def test_goal_create_snapshot_uses_memory_checkpoint_by_thread_id():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)

    runtime.start_goal_create(
        run_id="run-1",
        thread_id="thread-1",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )

    snapshot = runtime.get_snapshot(thread_id="thread-1")

    assert snapshot.run.run_id == "run-1"
    assert snapshot.run.thread_id == "thread-1"
    assert snapshot.waiting_for_approval is True
    assert snapshot.state.artifacts[0].kind == "goal_draft"


def test_agent_runtime_lists_runs_for_identity_and_active_statuses():
    clock = _incrementing_clock()
    runtime = GoalCreateAgentRuntime(clock=clock)

    runtime.start_goal_create(
        run_id="run-a",
        thread_id="thread-a",
        identity_id="identity-1",
        conversation_id="conversation-1",
        idea="Ship the AI Agent workspace with approval gates",
    )
    completed = runtime.start_goal_create(
        run_id="run-b",
        thread_id="thread-b",
        identity_id="identity-1",
        conversation_id="conversation-1",
        idea="Create completed goal run after execution",
    )
    runtime.resume_goal_create(
        thread_id="thread-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=completed.state.pending_actions,
        ),
    )
    runtime.resume_goal_create(
        thread_id="thread-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_goal",
                    status="executed",
                    entityId="goal-1",
                    message="Created goal",
                )
            ],
        ),
    )
    runtime.start_goal_create(
        run_id="run-other",
        thread_id="thread-other",
        identity_id="identity-2",
        conversation_id="conversation-1",
        idea="Ship another identity goal",
    )

    all_runs = runtime.list_runs(identity_id="identity-1")
    active_runs = runtime.list_runs(identity_id="identity-1", active_only=True)

    assert [run.run_id for run in all_runs] == ["run-b", "run-a"]
    assert [run.run_id for run in active_runs] == ["run-a"]
    assert runtime.list_runs(
        identity_id="identity-1",
        conversation_id="conversation-missing",
    ) == []


def test_goal_create_resume_cancel_does_not_execute_side_effects():
    runtime = GoalCreateAgentRuntime(clock=lambda: 1000)
    runtime.start_goal_create(
        run_id="run-1",
        thread_id="thread-1",
        identity_id="identity-1",
        idea="Ship the AI Agent workspace with approval gates",
    )

    cancelled = runtime.resume_goal_create(
        thread_id="thread-1",
        payload=AgentResumePayload(userDecision="cancel"),
    )

    assert cancelled.run.status == "cancelled"
    assert cancelled.state.stage == "result"
    assert cancelled.state.executed_actions == []


def test_knowledge_qa_graph_completes_with_grounded_answer_artifact():
    runtime = KnowledgeQaAgentRuntime(clock=lambda: 1000)

    result = runtime.start_knowledge_qa(
        run_id="run-knowledge-1",
        thread_id="thread-knowledge-1",
        identity_id="identity-1",
        question="What do my notes say about grounded answers?",
        answer="Use repository citations when evidence exists.",
        citations=[_knowledge_citation()],
        provider_id="provider-1",
        token_usage={
            "promptTokens": 20,
            "completionTokens": 10,
            "totalTokens": 30,
        },
        processing_time_ms=1234,
        matched_resource_count=4,
    )

    assert result.run.status == "completed"
    assert result.run.agent_type == "knowledge.qa"
    assert result.state.intent == "knowledge-qa"
    assert result.state.stage == "result"
    assert result.state.pending_actions == []
    assert result.state.executed_actions == []
    assert result.interrupts == []
    assert result.state.citations[0].resource_path == "notes/agent-runtime.md"
    assert result.state.usage.prompt_tokens == 20
    artifact = result.state.artifacts[0]
    assert artifact.kind == "knowledge_answer"
    assert artifact.data["evidenceStatus"] == "grounded"
    assert artifact.data["answer"] == "Use repository citations when evidence exists."
    assert artifact.data["providerId"] == "provider-1"
    assert artifact.data["tokenUsage"] == {
        "promptTokens": 20,
        "completionTokens": 10,
        "totalTokens": 30,
    }
    assert artifact.data["processingTimeMs"] == 1234
    assert artifact.data["matchedResourceCount"] == 4
    assert artifact.data["relatedNotes"] == [
        {
            "resourceId": "resource-1",
            "resourcePath": "notes/agent-runtime.md",
            "title": "Agent Runtime Notes",
            "excerpt": "Agent answers must show repository citations.",
            "score": 0.91,
        }
    ]
    _assert_node_lifecycle(result, "answer")
    assert _tool_completed_events(result, "search_knowledge")[0].data[
        "matchCount"
    ] == 1
    assert "citation.selected" in [event.type for event in result.events]
    assert result.events[-1].type == "run.completed"


def test_knowledge_qa_graph_marks_insufficient_evidence_without_citations():
    runtime = KnowledgeQaAgentRuntime(clock=lambda: 1000)

    result = runtime.start_knowledge_qa(
        run_id="run-knowledge-2",
        thread_id="thread-knowledge-2",
        identity_id="identity-1",
        question="What does the repository say about an unknown topic?",
    )

    assert result.run.status == "completed"
    assert result.state.citations == []
    artifact = result.state.artifacts[0]
    assert artifact.kind == "knowledge_answer"
    assert artifact.data["evidenceStatus"] == "insufficient"
    assert artifact.data["relatedNotes"] == []
    assert "Current knowledge base evidence is insufficient" in artifact.data["answer"]


def test_agent_node_completed_events_include_duration_ms():
    runtime = KnowledgeQaAgentRuntime(clock=_incrementing_clock())

    result = runtime.start_knowledge_qa(
        run_id="run-observable",
        thread_id="thread-observable",
        identity_id="identity-1",
        question="Which node timings should be observable?",
        citations=[_knowledge_citation()],
    )

    completed_events = [
        event for event in result.events if event.type == "node.completed"
    ]

    assert completed_events
    assert all(
        isinstance(event.data.get("durationMs"), int)
        and event.data["durationMs"] >= 0
        for event in completed_events
    )
    assert any(event.data["durationMs"] > 0 for event in completed_events)


def test_knowledge_qa_snapshot_uses_memory_checkpoint_by_thread_id():
    runtime = KnowledgeQaAgentRuntime(clock=lambda: 1000)

    runtime.start_knowledge_qa(
        run_id="run-knowledge-3",
        thread_id="thread-knowledge-3",
        identity_id="identity-1",
        question="What should be restored?",
        citations=[_knowledge_citation()],
    )

    snapshot = runtime.get_snapshot(thread_id="thread-knowledge-3")

    assert snapshot.run.run_id == "run-knowledge-3"
    assert snapshot.run.thread_id == "thread-knowledge-3"
    assert snapshot.run.status == "completed"
    assert snapshot.state.artifacts[0].kind == "knowledge_answer"


def test_knowledge_qa_file_run_history_restores_recent_run_list(tmp_path):
    history_path = tmp_path / "knowledge-qa-runs.json"
    runtime = KnowledgeQaAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=_incrementing_clock(),
    )
    runtime.start_knowledge_qa(
        run_id="run-knowledge-history-a",
        thread_id="thread-knowledge-history-a",
        identity_id="identity-1",
        conversation_id="conversation-knowledge",
        question="What should grounded answers cite?",
        citations=[_knowledge_citation()],
    )
    runtime.start_knowledge_qa(
        run_id="run-knowledge-history-b",
        thread_id="thread-knowledge-history-b",
        identity_id="identity-1",
        conversation_id="conversation-knowledge",
        question="How should run history be restored?",
        citations=[_knowledge_citation()],
    )
    runtime.start_knowledge_qa(
        run_id="run-knowledge-history-other",
        thread_id="thread-knowledge-history-other",
        identity_id="identity-2",
        conversation_id="conversation-knowledge",
        question="What should another identity see?",
        citations=[_knowledge_citation()],
    )

    restored = KnowledgeQaAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=lambda: 2000,
    )

    assert history_path.exists()
    assert restored.get_thread_id(
        run_id="run-knowledge-history-a"
    ) == "thread-knowledge-history-a"
    assert [
        run.run_id for run in restored.list_runs(identity_id="identity-1")
    ] == [
        "run-knowledge-history-b",
        "run-knowledge-history-a",
    ]
    assert restored.list_runs(identity_id="identity-1", active_only=True) == []
    restored_snapshot = restored.get_snapshot(
        thread_id="thread-knowledge-history-a"
    )
    history_payload = json.loads(history_path.read_text(encoding="utf-8"))
    stored_result = history_payload["results"]["run-knowledge-history-a"]

    assert restored_snapshot.run.status == "completed"
    assert restored_snapshot.state.artifacts[0].kind == "knowledge_answer"
    assert restored_snapshot.state.citations[0].resource_path == (
        "notes/agent-runtime.md"
    )
    assert stored_result["state"]["artifacts"][0]["kind"] == "knowledge_answer"
    assert stored_result["state"]["citations"][0]["resourcePath"] == (
        "notes/agent-runtime.md"
    )


def test_knowledge_generate_graph_completes_with_note_draft_artifact():
    runtime = KnowledgeGenerateAgentRuntime(clock=lambda: 1000)

    result = runtime.start_knowledge_generate(
        run_id="run-note-1",
        thread_id="thread-note-1",
        identity_id="identity-1",
        topic="Grounding knowledge answers",
        source="Question: What should answers cite?\nAnswer: Repository excerpts.",
        title="Grounding knowledge answers",
        target_subpath="notes/ai",
        provider_id="provider-1",
        model="gpt-4o-mini",
    )

    assert result.waiting_for_approval is True
    assert result.run.status == "waiting_approval"
    assert result.run.agent_type == "knowledge.generate"
    assert result.state.intent == "knowledge-generate"
    assert result.state.stage == "approval"
    assert result.state.pending_actions[0].tool == "create_knowledge_note"
    assert result.state.executed_actions == []
    assert result.interrupts[0]["agentType"] == "knowledge.generate"
    artifact = result.state.artifacts[0]
    assert artifact.kind == "knowledge_note_draft"
    assert artifact.title == "Grounding knowledge answers"
    assert artifact.data["topic"] == "Grounding knowledge answers"
    assert artifact.data["title"] == "Grounding knowledge answers"
    assert artifact.data["source"] == (
        "Question: What should answers cite?\nAnswer: Repository excerpts."
    )
    assert artifact.data["targetSubpath"] == "notes/ai"
    assert artifact.data["tags"] == []
    # duplicateRisk is now computed based on retrieved_context
    # Since retrieve_context returns matchCount=0, we expect "none"
    assert artifact.data["duplicateRisk"] == "none"
    assert artifact.data["indexStatus"] == "draft"
    pending_action = artifact.data["savePlan"]["pendingAction"]
    assert pending_action["tool"] == "create_knowledge_note"
    assert pending_action["payload"]["title"] == "Grounding knowledge answers"
    assert pending_action["payload"]["topic"] == "Grounding knowledge answers"
    assert pending_action["payload"]["contentArtifactId"] == (
        "run-note-1:knowledge-note-draft"
    )
    assert pending_action["payload"]["targetSubpath"] == "notes/ai"
    assert pending_action["payload"]["providerId"] == "provider-1"
    assert pending_action["payload"]["model"] == "gpt-4o-mini"
    assert "Grounding knowledge answers" in pending_action["payload"]["contentMarkdown"]
    _assert_node_lifecycle(result, "draft_note")
    assert "artifact.updated" in [event.type for event in result.events]
    assert result.events[-1].type == "approval.required"


def test_knowledge_generate_graph_resumes_to_execution_and_result():
    runtime = KnowledgeGenerateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_knowledge_generate(
        run_id="run-note-execute",
        thread_id="thread-note-execute",
        identity_id="identity-1",
        topic="Grounding knowledge answers",
        title="Grounding knowledge answers",
    )

    execution = runtime.resume_knowledge_generate(
        thread_id="thread-note-execute",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )

    assert execution.waiting_for_execution is True
    assert execution.run.status == "waiting_execution"
    assert execution.interrupts[0]["type"] == "execution.required"
    assert execution.interrupts[0]["agentType"] == "knowledge.generate"

    completed = runtime.resume_knowledge_generate(
        thread_id="thread-note-execute",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_knowledge_note",
                    status="executed",
                    entityId="resource-1",
                    message="Saved knowledge note to notes/ai/grounding.md.",
                    data={
                        "resolvedPath": "notes/ai/grounding.md",
                        "indexStatus": "pending",
                    },
                )
            ],
        ),
    )

    assert completed.run.status == "completed"
    assert completed.state.stage == "result"
    assert completed.state.executed_actions[0].tool == "create_knowledge_note"
    assert completed.state.executed_actions[0].data == {
        "resolvedPath": "notes/ai/grounding.md",
        "indexStatus": "pending",
    }
    assert _tool_completed_events(completed, "create_knowledge_note")[0].data[
        "status"
    ] == "executed"
    _assert_tool_completed_duration(completed, "create_knowledge_note")
    timeline = completed.state.artifacts[-1]
    assert timeline.kind == "execution_timeline"
    assert timeline.data["summary"] == {
        "status": "success",
        "executedCount": 1,
        "failedCount": 0,
    }
    assert completed.events[-1].type == "run.completed"


def test_knowledge_generate_graph_retries_failed_execution_with_same_approved_plan():
    runtime = KnowledgeGenerateAgentRuntime(clock=lambda: 1000)
    start = runtime.start_knowledge_generate(
        run_id="run-note-retry",
        thread_id="thread-note-retry",
        identity_id="identity-1",
        topic="Grounding knowledge answers",
        title="Grounding knowledge answers",
    )

    runtime.resume_knowledge_generate(
        thread_id="thread-note-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )
    completed = runtime.resume_knowledge_generate(
        thread_id="thread-note-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_knowledge_note",
                    status="failed",
                    message="Repository write failed.",
                )
            ],
        ),
    )

    assert completed.run.status == "completed"
    assert completed.state.stage == "result"
    timeline = completed.state.artifacts[-1]
    assert timeline.kind == "execution_timeline"
    assert timeline.data["summary"] == {
        "status": "failed",
        "executedCount": 0,
        "failedCount": 1,
    }
    assert timeline.data["recovery"]["canRetry"] is True
    assert timeline.data["recovery"]["failedActions"][0]["tool"] == (
        "create_knowledge_note"
    )
    assert timeline.data["recovery"]["retryApprovedActions"] == [
        action.model_dump(by_alias=True) for action in start.state.pending_actions
    ]

    retry = runtime.resume_knowledge_generate(
        thread_id="thread-note-retry",
        payload=AgentResumePayload(userDecision="confirm"),
    )

    assert retry.waiting_for_execution is True
    assert retry.run.status == "waiting_execution"
    assert retry.state.stage == "execute"
    assert retry.state.executed_actions == []
    assert [
        action.model_dump(by_alias=True) for action in retry.state.approved_actions
    ] == [action.model_dump(by_alias=True) for action in start.state.pending_actions]
    assert retry.interrupts[0]["type"] == "execution.required"
    assert retry.interrupts[0]["approvedActions"] == [
        action.model_dump(by_alias=True) for action in start.state.pending_actions
    ]
    assert retry.events[-1].type == "execution.required"


def test_knowledge_generate_file_checkpoint_restores_failed_result_and_retry(
    tmp_path,
):
    checkpoint_path = tmp_path / "knowledge-generate.pkl"
    runtime = KnowledgeGenerateAgentRuntime(
        checkpointer=FileBackedInMemorySaver(checkpoint_path),
        clock=lambda: 1000,
    )
    start = runtime.start_knowledge_generate(
        run_id="run-note-durable-retry",
        thread_id="thread-note-durable-retry",
        identity_id="identity-1",
        topic="Grounding knowledge answers",
        title="Grounding knowledge answers",
    )
    runtime.resume_knowledge_generate(
        thread_id="thread-note-durable-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=start.state.pending_actions,
        ),
    )
    runtime.resume_knowledge_generate(
        thread_id="thread-note-durable-retry",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_knowledge_note",
                    status="failed",
                    message="Repository write failed.",
                )
            ],
        ),
    )

    restored = KnowledgeGenerateAgentRuntime(
        checkpointer=FileBackedInMemorySaver(checkpoint_path),
        clock=lambda: 2000,
    )
    snapshot = restored.get_snapshot(thread_id="thread-note-durable-retry")
    retry = restored.resume_knowledge_generate(
        thread_id=restored.get_thread_id(run_id="run-note-durable-retry") or "",
        payload=AgentResumePayload(userDecision="confirm"),
    )

    assert checkpoint_path.exists()
    assert restored.get_thread_id(
        run_id="run-note-durable-retry"
    ) == "thread-note-durable-retry"
    assert snapshot.run.status == "completed"
    assert snapshot.state.stage == "result"
    timeline = next(
        artifact
        for artifact in snapshot.state.artifacts
        if artifact.kind == "execution_timeline"
    )
    assert timeline.data["recovery"]["canRetry"] is True
    assert retry.waiting_for_execution is True
    assert retry.state.stage == "execute"
    assert retry.state.executed_actions == []
    assert [
        action.model_dump(by_alias=True) for action in retry.state.approved_actions
    ] == [action.model_dump(by_alias=True) for action in start.state.pending_actions]


def test_knowledge_generate_file_run_history_restores_recent_run_list(tmp_path):
    history_path = tmp_path / "knowledge-generate-runs.json"
    runtime = KnowledgeGenerateAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=_incrementing_clock(),
    )
    runtime.start_knowledge_generate(
        run_id="run-note-history-a",
        thread_id="thread-note-history-a",
        identity_id="identity-1",
        conversation_id="conversation-note",
        topic="Restore pending knowledge note draft state",
        title="Pending note draft",
    )
    completed = runtime.start_knowledge_generate(
        run_id="run-note-history-b",
        thread_id="thread-note-history-b",
        identity_id="identity-1",
        conversation_id="conversation-note",
        topic="Restore saved knowledge note result state",
        title="Saved note result",
    )
    runtime.resume_knowledge_generate(
        thread_id="thread-note-history-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            approvedActions=completed.state.pending_actions,
        ),
    )
    runtime.resume_knowledge_generate(
        thread_id="thread-note-history-b",
        payload=AgentResumePayload(
            userDecision="confirm",
            executedActions=[
                AgentExecutedAction(
                    tool="create_knowledge_note",
                    status="executed",
                    entityId="resource-history-b",
                    message="Saved knowledge note",
                    data={
                        "resolvedPath": "notes/ai/saved-note-result.md",
                        "indexStatus": "pending",
                    },
                )
            ],
        ),
    )

    restored = KnowledgeGenerateAgentRuntime(
        run_history=AgentRunHistoryStore(history_path),
        clock=lambda: 2000,
    )

    assert history_path.exists()
    assert restored.get_thread_id(
        run_id="run-note-history-a"
    ) == "thread-note-history-a"
    assert [
        run.run_id for run in restored.list_runs(identity_id="identity-1")
    ] == [
        "run-note-history-b",
        "run-note-history-a",
    ]
    assert [
        run.run_id
        for run in restored.list_runs(identity_id="identity-1", active_only=True)
    ] == ["run-note-history-a"]
    restored_snapshot = restored.get_snapshot(thread_id="thread-note-history-a")
    history_payload = json.loads(history_path.read_text(encoding="utf-8"))
    waiting_result = history_payload["results"]["run-note-history-a"]
    completed_result = history_payload["results"]["run-note-history-b"]

    assert restored_snapshot.interrupts[0]["agentType"] == "knowledge.generate"
    assert restored_snapshot.state.pending_actions[0].tool == (
        "create_knowledge_note"
    )
    assert waiting_result["state"]["pendingActions"][0]["tool"] == (
        "create_knowledge_note"
    )
    assert completed_result["run"]["status"] == "completed"
    assert completed_result["state"]["approvedActions"][0]["tool"] == (
        "create_knowledge_note"
    )
    assert completed_result["state"]["executedActions"][0]["entityId"] == (
        "resource-history-b"
    )
    assert completed_result["state"]["executedActions"][0]["data"] == {
        "indexStatus": "pending",
        "resolvedPath": "notes/ai/saved-note-result.md",
    }


def test_knowledge_generate_graph_uses_topic_as_default_title():
    runtime = KnowledgeGenerateAgentRuntime(clock=lambda: 1000)

    result = runtime.start_knowledge_generate(
        run_id="run-note-2",
        thread_id="thread-note-2",
        identity_id="identity-1",
        topic="How agent runtime checkpoints work",
    )

    artifact = result.state.artifacts[0]
    assert artifact.kind == "knowledge_note_draft"
    assert artifact.title == "How agent runtime checkpoints work"
    assert "How agent runtime checkpoints work" in artifact.data["markdown"]


def test_knowledge_generate_snapshot_uses_memory_checkpoint_by_thread_id():
    runtime = KnowledgeGenerateAgentRuntime(clock=lambda: 1000)

    runtime.start_knowledge_generate(
        run_id="run-note-3",
        thread_id="thread-note-3",
        identity_id="identity-1",
        topic="Restore note draft state",
    )

    snapshot = runtime.get_snapshot(thread_id="thread-note-3")

    assert snapshot.run.run_id == "run-note-3"
    assert snapshot.run.thread_id == "thread-note-3"
    assert snapshot.run.status == "waiting_approval"
    assert snapshot.state.artifacts[0].kind == "knowledge_note_draft"
