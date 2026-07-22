"""Tests for knowledge indexing and querying endpoints."""

from unittest.mock import AsyncMock, patch

import pytest

from ai_service.schemas import (
    ChatCompleteResponse,
    ChatMessage,
    KnowledgeExpansionResponse,
    KnowledgeQueryResponse,
    KnowledgeResourceDocument,
    ProviderConfig,
)
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)


class FakeChatService:
    """Minimal chat service used by knowledge-query unit tests."""

    async def complete(
        self,
        messages: list[ChatMessage],
        config: ProviderConfig,
        *,
        tools=None,
        tool_choice=None,
    ) -> ChatCompleteResponse:
        del messages, config, tools, tool_choice
        return ChatCompleteResponse(
            content="Grounded answers should cite the relevant repository resource.",
            finish_reason="stop",
            usage={"total_tokens": 12},
        )

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        del texts, config
        return []


class FakeEmbeddingChatService(FakeChatService):
    """Chat service variant that returns deterministic provider embeddings."""

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        del config
        return [
            [index + 1.0, index + 2.0, index + 3.0] for index, _text in enumerate(texts)
        ]


class FakeSemanticEmbeddingChatService(FakeChatService):
    """Embedding service that encodes semantic matches
    independent of lexical overlap."""

    async def embed(
        self,
        texts: list[str],
        config: ProviderConfig,
    ) -> list[list[float]]:
        del config
        embeddings: list[list[float]] = []
        for text in texts:
            normalized = text.lower()
            if "traceable evidence" in normalized or "provenance" in normalized:
                embeddings.append([1.0, 0.0, 0.0])
            elif "grocer" in normalized or "apples" in normalized:
                embeddings.append([0.0, 1.0, 0.0])
            else:
                embeddings.append([0.0, 0.0, 1.0])
        return embeddings


class TestKnowledgeIndexRoute:
    """Tests for deterministic resource indexing."""

    def test_index_resource_success(self, client):
        """A text resource is chunked into an indexed representation."""

        response = client.post(
            "/internal/workflows/knowledge-index",
            json={
                "resource": {
                    "identity_id": "identity-1",
                    "repository_id": "repo-1",
                    "resource_id": "resource-1",
                    "resource_path": "notes/python-ai.md",
                    "title": "Python AI",
                    "mime_type": "text/markdown",
                    "content": (
                        "# Python AI\n\n"
                        "The AI service now supports repository-backed answers.\n\n"
                        "Chunking happens before retrieval."
                    ),
                    "metadata": {},
                }
            },
        )

        assert response.status_code == 200
        data = response.json()["indexed_resource"]
        assert data["resource_id"] == "resource-1"
        assert len(data["chunks"]) >= 1
        assert data["summary"]
        assert len(data["embedding"]) > 0
        assert len(data["chunks"][0]["embedding"]) > 0


class TestKnowledgeQueryRoute:
    """Tests for the knowledge query HTTP endpoint."""

    def test_query_knowledge_success(self, client):
        """A valid knowledge query returns grounded citations."""

        with patch(
            "ai_service.services.knowledge_query_service.KnowledgeQueryService.query",
            new_callable=AsyncMock,
        ) as mock_query:
            mock_query.return_value = KnowledgeQueryResponse(
                answer="The notes indicate that repository-backed answers are enabled.",
                citations=[
                    {
                        "resource_id": "resource-1",
                        "resource_path": "notes/python-ai.md",
                        "title": "Python AI",
                        "chunk_index": 0,
                        "excerpt": (
                            "The AI service now supports repository-backed answers."
                        ),
                        "score": 3.0,
                    }
                ],
                usage={"total_tokens": 42},
            )

            response = client.post(
                "/internal/workflows/knowledge",
                json={
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
                            "chunks": [
                                {
                                    "chunk_index": 0,
                                    "content": (
                                        "The AI service now supports "
                                        "repository-backed answers."
                                    ),
                                    "content_hash": "abcd1234",
                                    "start_offset": 0,
                                    "end_offset": 58,
                                    "heading_path": ["Python AI"],
                                    "keywords": ["repository", "answers"],
                                }
                            ],
                            "metadata": {},
                        }
                    ],
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["citations"][0]["resource_path"] == "notes/python-ai.md"
            assert data["usage"]["total_tokens"] == 42

    def test_expand_knowledge_success(self, client):
        """A valid expansion request returns grounded draft content."""

        with patch(
            "ai_service.services.knowledge_expansion_service.KnowledgeExpansionService.expand",
            new_callable=AsyncMock,
        ) as mock_expand:
            mock_expand.return_value = KnowledgeExpansionResponse(
                expanded_content=(
                    "# Repository Grounding\n\n"
                    "Grounded answers should cite the repository path "
                    "that supplied the evidence."
                ),
                citations=[
                    {
                        "resource_id": "resource-1",
                        "resource_path": "notes/python-ai.md",
                        "title": "Python AI",
                        "chunk_index": 0,
                        "excerpt": "Repository-backed answers are enabled.",
                        "score": 2.5,
                    }
                ],
                usage={"total_tokens": 21},
            )

            response = client.post(
                "/internal/workflows/knowledge-expand",
                json={
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
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["expanded_content"].startswith("# Repository Grounding")
            assert data["citations"][0]["resource_path"] == "notes/python-ai.md"
            assert data["usage"]["total_tokens"] == 21


@pytest.mark.asyncio
async def test_hybrid_retrieval_scores_semantically_related_content():
    """Hybrid retrieval should rank the grounded repository note
    above an unrelated one."""

    indexing_service = KnowledgeIndexingService()
    query_service = KnowledgeQueryService(FakeChatService(), indexing_service)
    indexed_resources = [
        indexing_service.index_resource(
            KnowledgeResourceDocument(
                identity_id="identity-1",
                repository_id="repo-1",
                resource_id="resource-grounding",
                resource_path="docs/repository-grounding.md",
                title="Repository Grounding",
                mime_type="text/markdown",
                content=(
                    "Citations should reference knowledge notes after chunk "
                    "selection so grounded answers stay traceable."
                ),
                metadata={},
            )
        ),
        indexing_service.index_resource(
            KnowledgeResourceDocument(
                identity_id="identity-1",
                repository_id="repo-1",
                resource_id="resource-groceries",
                resource_path="docs/groceries.md",
                title="Groceries",
                mime_type="text/markdown",
                content="Buy apples, oranges, and rice this weekend.",
                metadata={},
            )
        ),
    ]

    response = await query_service.query(
        question="How does grounding from repos cite sources?",
        indexed_resources=indexed_resources,
        provider_config=ProviderConfig(
            provider="openai",
            model="gpt-4o-mini",
            api_key="test-key",
        ),
        max_citations=1,
    )

    assert response.citations[0].resource_path == "docs/repository-grounding.md"


@pytest.mark.asyncio
async def test_provider_embeddings_override_local_vectors_when_available():
    """Provider embeddings should replace local fallback vectors during indexing."""

    indexing_service = KnowledgeIndexingService(FakeEmbeddingChatService())
    indexed_resource = await indexing_service.index_resource_async(
        KnowledgeResourceDocument(
            identity_id="identity-1",
            repository_id="repo-1",
            resource_id="resource-grounding",
            resource_path="docs/repository-grounding.md",
            title="Repository Grounding",
            mime_type="text/markdown",
            content=(
                "# Repository Grounding\n\n"
                "Grounded answers should cite knowledge notes after retrieval."
            ),
            metadata={},
        ),
        provider_config=ProviderConfig(
            provider="openai",
            model="gpt-4o-mini",
            embedding_model="text-embedding-3-small",
            api_key="test-key",
        ),
    )

    assert indexed_resource.embedding == pytest.approx([0.267261, 0.534522, 0.801784])
    assert indexed_resource.chunks[0].embedding == pytest.approx(
        [0.371391, 0.557086, 0.742781]
    )


@pytest.mark.asyncio
async def test_query_uses_provider_embeddings_when_indexed_vectors_are_provider_sized():
    """Query-side citation ranking should use provider embeddings
    when dimensions match."""

    chat_service = FakeSemanticEmbeddingChatService()
    indexing_service = KnowledgeIndexingService(chat_service)
    query_service = KnowledgeQueryService(chat_service, indexing_service)
    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4o-mini",
        embedding_model="text-embedding-3-small",
        api_key="test-key",
    )
    indexed_resources = [
        await indexing_service.index_resource_async(
            KnowledgeResourceDocument(
                identity_id="identity-1",
                repository_id="repo-1",
                resource_id="resource-provenance",
                resource_path="docs/provenance-playbook.md",
                title="Grounding Playbook",
                mime_type="text/markdown",
                content="Provenance ensures each response points back to stored notes.",
                metadata={},
            ),
            provider_config=provider_config,
        ),
        await indexing_service.index_resource_async(
            KnowledgeResourceDocument(
                identity_id="identity-1",
                repository_id="repo-1",
                resource_id="resource-groceries",
                resource_path="docs/groceries.md",
                title="Groceries",
                mime_type="text/markdown",
                content="Buy apples and oranges this weekend.",
                metadata={},
            ),
            provider_config=provider_config,
        ),
    ]

    response = await query_service.query(
        question="How do traceable evidence answers work?",
        indexed_resources=indexed_resources,
        provider_config=provider_config,
        max_citations=1,
    )

    assert response.citations[0].resource_path == "docs/provenance-playbook.md"
