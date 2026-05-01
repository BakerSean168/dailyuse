from unittest.mock import AsyncMock

import pytest

from ai_service.orchestrator.handlers.knowledge_note_handler import (
    KnowledgeNoteWorkflowHandler,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import KnowledgeNoteResponse


@pytest.fixture
def handler():
    service = AsyncMock()
    return KnowledgeNoteWorkflowHandler(knowledge_note_service=service)


def test_can_handle(handler):
    assert handler.can_handle("knowledge-note") is True
    assert handler.can_handle("knowledge") is False


@pytest.mark.asyncio
async def test_knowledge_note_handler_executes_generate(handler):
    handler.knowledge_note_service.generate.return_value = KnowledgeNoteResponse(
        content="# Python Tooling\n\nA concise note.",
        usage={"total_tokens": 17},
    )

    context = WorkflowContext(
        request_id="req-202",
        workflow_type="knowledge-note",
        input_data={
            "topic": "Python tooling",
            "title": "Python Tooling",
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        },
    )

    result = await handler.handle(context)

    assert result.content.startswith("# Python Tooling")
    handler.knowledge_note_service.generate.assert_awaited_once()
