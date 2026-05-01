from unittest.mock import AsyncMock

import pytest

from ai_service.orchestrator.handlers.knowledge_index_handler import (
    KnowledgeIndexWorkflowHandler,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import IndexedKnowledgeResource


@pytest.fixture
def handler():
    service = AsyncMock()
    return KnowledgeIndexWorkflowHandler(knowledge_indexing_service=service)


def test_can_handle(handler):
    assert handler.can_handle("knowledge-index") is True
    assert handler.can_handle("knowledge") is False


@pytest.mark.asyncio
async def test_knowledge_index_handler_executes_index(handler):
    handler.knowledge_indexing_service.index_resource_async.return_value = (
        IndexedKnowledgeResource.model_validate(
            {
                "identity_id": "identity-1",
                "repository_id": "repo-1",
                "resource_id": "resource-1",
                "resource_path": "notes/python-ai.md",
                "title": "Python AI",
                "mime_type": "text/markdown",
                "content_hash": "abcd1234",
                "summary": "Repository-backed answers are enabled.",
                "keywords": [],
                "embedding": [],
                "chunks": [],
                "metadata": {},
            }
        )
    )

    context = WorkflowContext(
        request_id="req-303",
        workflow_type="knowledge-index",
        input_data={
            "resource": {
                "identity_id": "identity-1",
                "repository_id": "repo-1",
                "resource_id": "resource-1",
                "resource_path": "notes/python-ai.md",
                "title": "Python AI",
                "mime_type": "text/markdown",
                "content": "Repository-backed answers are enabled.",
                "metadata": {},
            }
        },
    )

    result = await handler.handle(context)

    assert result.indexed_resource.resource_id == "resource-1"
    handler.knowledge_indexing_service.index_resource_async.assert_awaited_once()
