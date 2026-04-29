import pytest
from unittest.mock import AsyncMock

from ai_service.orchestrator.handlers.goal_automation_handler import (
    GoalAutomationWorkflowHandler,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import GoalAutomationResponse


@pytest.fixture
def handler():
    service = AsyncMock()
    return GoalAutomationWorkflowHandler(goal_planning_service=service)


def test_can_handle(handler):
    assert handler.can_handle("goal-automation") is True
    assert handler.can_handle("goal") is False


@pytest.mark.asyncio
async def test_goal_automation_handler_executes_plan(handler):
    handler.goal_planning_service.plan_automation.return_value = (
        GoalAutomationResponse.model_validate(
            {
                "summary": "Create the goal first.",
                "goal": {
                    "title": "Ship AI automation",
                    "description": "Expose a reviewable automation flow.",
                    "category": "work",
                    "importance": "Important",
                    "tags": ["ai"],
                    "suggestedStartDate": 1,
                    "suggestedEndDate": 2,
                },
                "toolCalls": [{"tool": "create_goal"}],
            }
        )
    )

    context = WorkflowContext(
        request_id="req-101",
        workflow_type="goal-automation",
        input_data={
            "idea": "Automate goal setup with a confirmation step.",
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        },
    )

    result = await handler.handle(context)

    assert result.summary == "Create the goal first."
    assert result.tool_calls[0].tool == "create_goal"
    handler.goal_planning_service.plan_automation.assert_awaited_once()
