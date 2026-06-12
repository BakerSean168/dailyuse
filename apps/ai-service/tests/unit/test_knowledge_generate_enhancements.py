"""Tests for knowledge.generate Agent enhancements: real search and provider-backed generation."""

from __future__ import annotations

import pytest

from ai_service.agent_runtime.graphs.knowledge_generate import (
    build_knowledge_generate_graph,
    create_knowledge_generate_initial_state,
)
from ai_service.schemas import (
    IndexedKnowledgeChunk,
    IndexedKnowledgeResource,
    KnowledgeCitation,
    ProviderConfig,
)


def _mock_knowledge_note_generator(
    *,
    topic: str,
    title: str | None,
    provider_config: ProviderConfig | None,
) -> dict[str, object]:
    """Mock provider-backed note generation."""
    return {
        "content": f"# {title or topic}\n\nThis is a provider-generated note about {topic}.\n\nIt has real content from the model.",
        "usage": {"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80},
    }


def _mock_knowledge_citation_selector(
    *,
    question: str,
    indexed_resources: list[IndexedKnowledgeResource],
    provider_config: ProviderConfig,
    max_citations: int = 10,
) -> list[KnowledgeCitation]:
    """Mock citation selector that returns realistic results."""
    if not indexed_resources:
        return []

    # Find matching resources based on question
    matches = []
    for resource in indexed_resources[:3]:  # Top 3 resources
        for chunk in resource.chunks[:2]:  # Top 2 chunks per resource
            if any(
                keyword.lower() in question.lower()
                for keyword in resource.keywords + chunk.keywords
            ):
                matches.append(
                    KnowledgeCitation(
                        resource_id=resource.resource_id,
                        resource_path=resource.resource_path,
                        title=resource.title,
                        chunk_index=chunk.chunk_index,
                        excerpt=chunk.content[:200],
                        score=3.5 if len(matches) == 0 else 2.0,
                    )
                )
            if len(matches) >= max_citations:
                break
        if len(matches) >= max_citations:
            break

    return matches[:max_citations]


def test_knowledge_generate_with_provider_backed_generation():
    """Verify provider-backed note generation produces real content and usage."""
    graph = build_knowledge_generate_graph(
        knowledge_note_generator=_mock_knowledge_note_generator,
    ).compile()

    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4",
        api_key="test-key",
    )

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="Python async patterns",
        provider_config=provider_config,
    )

    result = graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    # Should reach approval with provider-generated content
    assert result["status"] == "waiting_approval"
    assert result["stage"] == "approval"

    artifacts = result["artifacts"]
    assert len(artifacts) == 1
    draft = artifacts[0]
    assert draft["kind"] == "knowledge_note_draft"

    # Content should be from provider, not template
    assert "provider-generated note" in draft["data"]["markdown"]
    assert "async patterns" in draft["data"]["markdown"].lower()

    # Usage should be populated
    usage = result["usage"]
    assert usage["prompt_tokens"] == 50
    assert usage["completion_tokens"] == 30
    assert usage["total_tokens"] == 80


def test_knowledge_generate_with_real_search_integration():
    """Verify real knowledge search integration populates retrieved_context."""
    graph = build_knowledge_generate_graph(
        knowledge_citation_selector=_mock_knowledge_citation_selector,
    ).compile()

    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4",
        api_key="test-key",
    )

    indexed_resources = [
        IndexedKnowledgeResource(
            identity_id="test-identity",
            repository_id="test-repo",
            resource_id="resource-1",
            resource_path="notes/async.md",
            title="Async Programming Guide",
            mime_type="text/markdown",
            content_hash="a1b2c3d4e5f6g7h8",
            summary="Guide to async programming",
            keywords=["async", "await", "concurrency"],
            embedding=[0.1] * 128,
            chunks=[
                IndexedKnowledgeChunk(
                    chunk_index=0,
                    content="Async programming allows concurrent execution...",
                    content_hash="chunk-hash-1-valid",
                    start_offset=0,
                    end_offset=100,
                    heading_path=["Introduction"],
                    keywords=["async", "concurrent"],
                    embedding=[0.2] * 128,
                ),
            ],
            metadata={},
        ),
        IndexedKnowledgeResource(
            identity_id="test-identity",
            repository_id="test-repo",
            resource_id="resource-2",
            resource_path="notes/patterns.md",
            title="Design Patterns",
            mime_type="text/markdown",
            content_hash="b2c3d4e5f6g7h8i9",
            summary="Common design patterns",
            keywords=["patterns", "design", "architecture"],
            embedding=[0.3] * 128,
            chunks=[
                IndexedKnowledgeChunk(
                    chunk_index=0,
                    content="Patterns provide reusable solutions...",
                    content_hash="chunk-hash-2-valid",
                    start_offset=0,
                    end_offset=100,
                    heading_path=["Overview"],
                    keywords=["patterns", "solutions"],
                    embedding=[0.4] * 128,
                ),
            ],
            metadata={},
        ),
    ]

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="async patterns",
        provider_config=provider_config,
        indexed_resources=indexed_resources,
    )

    result = graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    # Retrieved context should have real search results
    retrieved_context = result["retrieved_context"]
    assert len(retrieved_context) == 1
    context = retrieved_context[0]
    assert context["tool"] == "find_related_notes"
    assert context["query"] == "async patterns"
    assert context["matchCount"] > 0

    # Matches should be populated
    matches = context["matches"]
    assert len(matches) > 0
    assert matches[0]["resourcePath"] == "notes/async.md"
    assert matches[0]["title"] == "Async Programming Guide"
    assert matches[0]["score"] >= 2.0


def test_knowledge_generate_duplicate_risk_assessment():
    """Verify duplicate risk is assessed based on search results."""

    # Custom selector that returns many high-score matches
    def high_similarity_selector(**kwargs):  # noqa: ARG001
        return [
            KnowledgeCitation(
                resource_id=f"resource-{i}",
                resource_path=f"notes/async-{i}.md",
                title=f"Async Note {i}",
                chunk_index=0,
                excerpt=f"Async content {i}...",
                score=3.8 - i * 0.1,  # High scores: 3.8, 3.7, 3.6, 3.5, 3.4, 3.3...
            )
            for i in range(6)
        ]

    graph = build_knowledge_generate_graph(
        knowledge_citation_selector=high_similarity_selector,
    ).compile()

    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4",
        api_key="test-key",
    )

    # Create resources with high-similarity keywords
    indexed_resources = []
    for i in range(6):
        indexed_resources.append(
            IndexedKnowledgeResource(
                identity_id="test-identity",
                repository_id="test-repo",
                resource_id=f"resource-{i}",
                resource_path=f"notes/async-{i}.md",
                title=f"Async Note {i}",
                mime_type="text/markdown",
                content_hash=f"hash-{i:08d}",
                summary="Async programming guide",
                keywords=["async", "python", "concurrency"],
                embedding=[0.1 + i * 0.01] * 128,
                chunks=[
                    IndexedKnowledgeChunk(
                        chunk_index=0,
                        content=f"Async content {i}...",
                        content_hash=f"chunk-hash-{i:08d}",
                        start_offset=0,
                        end_offset=100,
                        heading_path=["Section"],
                        keywords=["async", "python"],
                        embedding=[0.2 + i * 0.01] * 128,
                    ),
                ],
                metadata={},
            )
        )

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="python async patterns",
        provider_config=provider_config,
        indexed_resources=indexed_resources,
    )

    result = graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    artifacts = result["artifacts"]
    draft = artifacts[0]

    # With 6 high-score matches, duplicate risk should be high
    duplicate_risk = draft["data"]["duplicateRisk"]
    assert duplicate_risk == "high"

    # Related notes should be populated
    related_notes = draft["data"]["relatedNotes"]
    assert len(related_notes) == 5  # Top 5
    assert related_notes[0]["resourcePath"] == "notes/async-0.md"
    assert related_notes[0]["score"] == 3.8


def test_knowledge_generate_duplicate_risk_none_when_no_matches():
    """Verify duplicate risk is 'none' when no similar notes exist."""
    graph = build_knowledge_generate_graph(
        knowledge_citation_selector=_mock_knowledge_citation_selector,
    ).compile()

    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4",
        api_key="test-key",
    )

    # Create resources with completely different keywords
    indexed_resources = [
        IndexedKnowledgeResource(
            identity_id="test-identity",
            repository_id="test-repo",
            resource_id="resource-1",
            resource_path="notes/cooking.md",
            title="Cooking Guide",
            mime_type="text/markdown",
            content_hash="cooking-hash-12345678",
            summary="Cooking recipes",
            keywords=["cooking", "recipes", "food"],
            embedding=[0.9] * 128,
            chunks=[
                IndexedKnowledgeChunk(
                    chunk_index=0,
                    content="How to cook pasta...",
                    content_hash="chunk-cooking-12345678",
                    start_offset=0,
                    end_offset=100,
                    heading_path=["Recipes"],
                    keywords=["pasta", "cooking"],
                    embedding=[0.9] * 128,
                ),
            ],
            metadata={},
        ),
    ]

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="machine learning fundamentals",
        provider_config=provider_config,
        indexed_resources=indexed_resources,
    )

    result = graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    artifacts = result["artifacts"]
    draft = artifacts[0]

    # With no matches, duplicate risk should be 'none'
    duplicate_risk = draft["data"]["duplicateRisk"]
    assert duplicate_risk == "none"

    # No related notes
    related_notes = draft["data"]["relatedNotes"]
    assert len(related_notes) == 0


def test_knowledge_generate_fallback_to_template_on_empty_generation():
    """Verify fallback to template when provider returns empty content."""

    def empty_generator(**kwargs):  # noqa: ARG001
        return {"content": "", "usage": {}}

    graph = build_knowledge_generate_graph(
        knowledge_note_generator=empty_generator,
    ).compile()

    provider_config = ProviderConfig(
        provider="openai",
        model="gpt-4",
        api_key="test-key",
    )

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="Test Topic",
        provider_config=provider_config,
    )

    result = graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    artifacts = result["artifacts"]
    draft = artifacts[0]

    # Should fall back to template
    markdown = draft["data"]["markdown"]
    assert "# Test Topic" in markdown
    assert "## Topic" in markdown
    assert "experimental knowledge.generate graph" in markdown


def test_knowledge_generate_passes_provider_config_to_generator():
    """Verify provider_config is correctly passed to note generator."""
    captured_config = {}

    def capturing_generator(*, topic: str, title: str | None, provider_config):  # noqa: ARG001
        captured_config["provider_config"] = provider_config
        return {
            "content": f"# {title or topic}\n\nGenerated content.",
            "usage": {},
        }

    graph = build_knowledge_generate_graph(
        knowledge_note_generator=capturing_generator,
    ).compile()

    provider_config = ProviderConfig(
        provider="anthropic",
        model="claude-3-opus",
        api_key="test-key",
        temperature=0.7,
    )

    state = create_knowledge_generate_initial_state(
        run_id="test-run",
        thread_id="test-thread",
        identity_id="test-identity",
        topic="Test",
        provider_config=provider_config,
    )

    graph.invoke(state, config={"configurable": {"thread_id": "test-thread"}})

    # Provider config should be passed
    assert captured_config["provider_config"] is not None
    assert captured_config["provider_config"].provider == "anthropic"
    assert captured_config["provider_config"].model == "claude-3-opus"
    assert captured_config["provider_config"].temperature == 0.7
