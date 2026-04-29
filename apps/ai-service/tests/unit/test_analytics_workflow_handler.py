import pytest
from unittest.mock import AsyncMock

from ai_service.orchestrator.handlers.analytics_handler import AnalyticsWorkflowHandler
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import AnalyticsQueryResponse


@pytest.fixture
def handler():
    service = AsyncMock()
    return AnalyticsWorkflowHandler(analytics_query_service=service)


def test_can_handle(handler):
    assert handler.can_handle("analytics") is True
    assert handler.can_handle("goal") is False


@pytest.mark.asyncio
async def test_analytics_handler_executes_query(handler):
    handler.analytics_query_service.query.return_value = AnalyticsQueryResponse(
        answer="Overdue tasks need attention first.",
        highlights=["task.overdue: 3"],
        usage={"total_tokens": 12},
    )

    context = WorkflowContext(
        request_id="req-456",
        workflow_type="analytics",
        input_data={
            "question": "What needs attention today?",
            "context": {
                "dashboard": {"stats": {"activeGoals": 4}},
                "task_dashboard": {"summary": {"overdue": 3}},
                "goals": [],
                "goal_search_results": [],
                "extra": {},
            },
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        },
    )

    result = await handler.handle(context)

    assert result.answer == "Overdue tasks need attention first."
    assert result.highlights == ["task.overdue: 3"]
    handler.analytics_query_service.query.assert_awaited_once()
