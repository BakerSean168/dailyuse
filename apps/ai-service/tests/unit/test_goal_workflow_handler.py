import pytest
from unittest.mock import AsyncMock
from ai_service.orchestrator.handlers.goal_handler import GoalWorkflowHandler
from ai_service.orchestrator.models import WorkflowContext

@pytest.fixture
def handler():
    return GoalWorkflowHandler(chat_service=AsyncMock())

def test_can_handle(handler):
    assert handler.can_handle("goal") is True
    assert handler.can_handle("knowledge") is False

@pytest.mark.asyncio
async def test_goal_handler_clarification_flow(handler):
    # Mock the chat service to return needsClarification=True
    handler.chat_service.complete.return_value.content = '''{
        "needsClarification": true,
        "questions": [
            {"question": "What outcome do you want from this goal?", "context": null},
            {"question": "What timeline are you targeting?", "context": null}
        ],
        "rationale": "Vague"
    }'''
    handler.chat_service.complete.return_value.usage = {"prompt_tokens": 10}

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
