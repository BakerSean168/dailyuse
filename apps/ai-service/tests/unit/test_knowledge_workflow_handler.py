from unittest.mock import AsyncMock

import pytest

from ai_service.orchestrator.handlers.knowledge_handler import KnowledgeWorkflowHandler
from ai_service.orchestrator.models import WorkflowContext
from ai_service.schemas import KnowledgeQueryResponse


@pytest.fixture
def handler():
    service = AsyncMock()
    return KnowledgeWorkflowHandler(knowledge_query_service=service)


def test_can_handle(handler):
    assert handler.can_handle("knowledge") is True
    assert handler.can_handle("analytics") is False


@pytest.mark.asyncio
async def test_knowledge_handler_executes_query(handler):
    handler.knowledge_query_service.query.return_value = KnowledgeQueryResponse(
        answer="Repository-backed answers are enabled.",
        citations=[
            {
                "resource_id": "resource-1",
                "resource_path": "notes/python-ai.md",
                "title": "Python AI",
                "chunk_index": 0,
                "excerpt": "Repository-backed answers are enabled.",
                "score": 3.0,
            }
        ],
        usage={"total_tokens": 42},
    )

    context = WorkflowContext(
        request_id="req-789",
        workflow_type="knowledge",
        input_data={
            "question": "How does the AI service answer from notes?",
            "indexed_resources": [
                {
                    "identity_id": "identity-1",
                    "repository_id": "repo-1",
                    "resource_id": "resource-1",
                    "resource_path": "notes/python-ai.md",
                    "title": "Python AI",
                    "mime_type": "text/markdown",
                    "content_hash": "abcd1234",
                    "summary": "Repository-backed answers are enabled.",
                    "keywords": ["repository", "answers"],
                    "embedding": [],
                    "chunks": [
                        {
                            "chunk_index": 0,
                            "content": "Repository-backed answers are enabled.",
                            "content_hash": "abcd1234",
                            "start_offset": 0,
                            "end_offset": 40,
                            "heading_path": ["Python AI"],
                            "keywords": ["repository", "answers"],
                            "embedding": [],
                        }
                    ],
                    "metadata": {},
                }
            ],
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "api_key": "secret",
            },
            "max_citations": 3,
        },
    )

    result = await handler.handle(context)

    assert result.answer == "Repository-backed answers are enabled."
    assert result.citations[0].resource_path == "notes/python-ai.md"
    handler.knowledge_query_service.query.assert_awaited_once()
