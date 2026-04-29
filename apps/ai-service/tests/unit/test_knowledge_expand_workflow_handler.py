import pytest
from unittest.mock import AsyncMock

from ai_service.orchestrator.handlers.knowledge_expand_handler import (
    KnowledgeExpandWorkflowHandler,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import KnowledgeExpansionResponse


@pytest.fixture
def handler():
    service = AsyncMock()
    return KnowledgeExpandWorkflowHandler(knowledge_expansion_service=service)


def test_can_handle(handler):
    assert handler.can_handle("knowledge-expand") is True
    assert handler.can_handle("knowledge") is False


@pytest.mark.asyncio
async def test_knowledge_expand_handler_executes_expand(handler):
    handler.knowledge_expansion_service.expand.return_value = (
        KnowledgeExpansionResponse(
            expanded_content="# Repository Grounding\n\nGrounded answers cite repos.",
            citations=[],
            usage={"total_tokens": 21},
        )
    )

    context = WorkflowContext(
        request_id="req-404",
        workflow_type="knowledge-expand",
        input_data={
            "instruction": "Expand this note with citation guidance.",
            "current_content": "# Repository Grounding",
            "related_resources": [
                {
                    "identity_id": "identity-1",
                    "repository_id": "repo-1",
                    "resource_id": "resource-1",
                    "resource_path": "notes/python-ai.md",
                    "title": "Python AI",
                    "mime_type": "text/markdown",
                    "content": "Repository-backed answers are enabled.",
                    "metadata": {},
                }
            ],
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
        },
    )

    result = await handler.handle(context)

    assert result.expanded_content.startswith("# Repository Grounding")
    handler.knowledge_expansion_service.expand.assert_awaited_once()
