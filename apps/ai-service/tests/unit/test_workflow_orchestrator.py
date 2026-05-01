import pytest

from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import AIWorkflowOrchestrator


@pytest.fixture
def orchestrator():
    return AIWorkflowOrchestrator()


class StubHandler:
    def __init__(self, *, handles: bool, result=None, error: Exception | None = None):
        self.handles = handles
        self.result = result
        self.error = error
        self.handled_contexts = []

    def can_handle(self, workflow_type: str) -> bool:
        return self.handles

    async def handle(self, context: WorkflowContext):
        self.handled_contexts.append(context)
        if self.error:
            raise self.error
        return self.result


@pytest.mark.asyncio
async def test_orchestrator_routing(orchestrator):
    handler = StubHandler(handles=True, result={"state": "draft", "goal": "test"})

    orchestrator.register_handler(handler)

    context = WorkflowContext(
        request_id="req-123", workflow_type="goal", input_data={"idea": "test"}
    )

    result = await orchestrator.execute(context)
    assert result["state"] == "draft"
    assert handler.handled_contexts == [context]


@pytest.mark.asyncio
async def test_orchestrator_uses_first_matching_handler(orchestrator):
    first_handler = StubHandler(
        handles=True, result={"state": "draft", "goal": "first"}
    )
    second_handler = StubHandler(
        handles=True, result={"state": "draft", "goal": "second"}
    )

    orchestrator.register_handler(first_handler)
    orchestrator.register_handler(second_handler)

    context = WorkflowContext(
        request_id="req-123", workflow_type="goal", input_data={"idea": "test"}
    )

    result = await orchestrator.execute(context)
    assert result["goal"] == "first"
    assert len(first_handler.handled_contexts) == 1
    assert second_handler.handled_contexts == []


@pytest.mark.asyncio
async def test_orchestrator_bubbles_handler_errors(orchestrator):
    handler = StubHandler(handles=True, error=RuntimeError("handler failed"))
    orchestrator.register_handler(handler)

    context = WorkflowContext(
        request_id="req-123", workflow_type="goal", input_data={"idea": "test"}
    )

    with pytest.raises(RuntimeError, match="handler failed"):
        await orchestrator.execute(context)


@pytest.mark.asyncio
async def test_orchestrator_no_handler(orchestrator):
    context = WorkflowContext(
        request_id="req-123", workflow_type="unknown", input_data={"idea": "test"}
    )

    with pytest.raises(ValueError, match="No handler found for workflow type: unknown"):
        await orchestrator.execute(context)
