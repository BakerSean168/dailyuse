import pytest
from unittest.mock import AsyncMock
from ai_service.orchestrator.handlers.goal_handler import GoalWorkflowHandler
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import GoalPlanningResponse, GoalClarificationLLMResponse

@pytest.fixture
def handler():
    service = AsyncMock()
    return GoalWorkflowHandler(goal_planning_service=service)

def test_can_handle(handler):
    assert handler.can_handle("goal") is True
    assert handler.can_handle("knowledge") is False

@pytest.mark.asyncio
async def test_goal_handler_clarification_flow(handler):
    handler.goal_planning_service.plan_with_clarification.return_value = GoalPlanningResponse(
        state="clarification",
        clarification=GoalClarificationLLMResponse(
            needsClarification=True,
            rationale="Vague",
            questions=[
                {
                    "question": "What outcome do you want from this goal?",
                    "context": None,
                },
                {
                    "question": "What timeline are you targeting?",
                    "context": None,
                },
            ],
        ),
        usage={"prompt_tokens": 10},
    )

    context = WorkflowContext(
        request_id="req-123",
        workflow_type="goal",
        input_data={
            "idea": "learn something",
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret"
            }
        }
    )

    result = await handler.handle(context)
    assert result.state == "clarification"
    assert result.clarification is not None
    assert result.clarification.needs_clarification is True
    handler.goal_planning_service.plan_with_clarification.assert_awaited_once()
    kwargs = handler.goal_planning_service.plan_with_clarification.await_args.kwargs
    assert kwargs["idea"] == "learn something"
    assert kwargs["category"] is None
    assert kwargs["timeframe"] is None
    assert kwargs["include_key_results"] is True
    assert kwargs["enable_clarification"] is True
    assert kwargs["clarification_answers"] is None
    assert kwargs["request_id"] == "req-123"
