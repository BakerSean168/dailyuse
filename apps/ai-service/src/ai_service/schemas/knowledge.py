"""Schemas for knowledge-note generation and querying."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from ai_service.schemas.chat import ProviderConfig


class KnowledgeNoteRequest(BaseModel):
    """Request for generating markdown note content."""

    model_config = ConfigDict(extra="forbid")

    topic: str = Field(..., min_length=3, max_length=200)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    provider_config: ProviderConfig
    request_id: str | None = None


class KnowledgeNoteResponse(BaseModel):
    """Generated markdown note content."""

    model_config = ConfigDict(extra="forbid")

    content: str = Field(..., min_length=1)
    usage: dict[str, Any] | None = None


class KnowledgeNoteDocument(BaseModel):
    """Repository-backed knowledge note content used for indexing."""

    model_config = ConfigDict(extra="forbid")

    identity_id: str = Field(..., min_length=1)
    repository_id: str = Field(..., min_length=1)
    resource_id: str = Field(..., min_length=1)
    resource_path: str = Field(..., min_length=1)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    mime_type: str = Field(default="text/markdown", min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class IndexedKnowledgeChunk(BaseModel):
    """Single indexed content chunk."""

    model_config = ConfigDict(extra="forbid")

    chunk_index: int = Field(..., ge=0)
    content: str = Field(..., min_length=1)
    content_hash: str = Field(..., min_length=8, max_length=128)
    start_offset: int = Field(..., ge=0)
    end_offset: int = Field(..., ge=0)
    heading_path: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    embedding: list[float] = Field(default_factory=list)


class IndexedKnowledgeNote(BaseModel):
    """Indexed representation of a knowledge note."""

    model_config = ConfigDict(extra="forbid")

    identity_id: str = Field(..., min_length=1)
    repository_id: str = Field(..., min_length=1)
    resource_id: str = Field(..., min_length=1)
    resource_path: str = Field(..., min_length=1)
    title: str | None = Field(default=None)
    mime_type: str = Field(..., min_length=1)
    content_hash: str = Field(..., min_length=8, max_length=128)
    summary: str = Field(..., min_length=1)
    keywords: list[str] = Field(default_factory=list)
    embedding: list[float] = Field(default_factory=list)
    chunks: list[IndexedKnowledgeChunk] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeIndexNoteRequest(BaseModel):
    """Request for chunking and indexing one knowledge note."""

    model_config = ConfigDict(extra="forbid")

    resource: KnowledgeNoteDocument
    provider_config: ProviderConfig | None = None
    max_chunk_chars: int = Field(default=1200, ge=400, le=4000)
    overlap_chars: int = Field(default=150, ge=0, le=1000)


class KnowledgeIndexNoteResponse(BaseModel):
    """Indexed knowledge note output."""

    model_config = ConfigDict(extra="forbid")

    indexed_resource: IndexedKnowledgeNote


class KnowledgeCitation(BaseModel):
    """Citation returned with a knowledge answer."""

    model_config = ConfigDict(extra="forbid")

    resource_id: str = Field(..., min_length=1)
    resource_path: str = Field(..., min_length=1)
    title: str | None = None
    chunk_index: int = Field(..., ge=0)
    excerpt: str = Field(..., min_length=1)
    score: float = Field(..., ge=0)


class KnowledgeQueryRequest(BaseModel):
    """Request for repository-backed knowledge Q&A."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=3, max_length=2000)
    indexed_resources: list[IndexedKnowledgeNote] = Field(..., min_length=1)
    provider_config: ProviderConfig
    max_citations: int = Field(default=3, ge=1, le=8)
    request_id: str | None = None


class KnowledgeQueryResponse(BaseModel):
    """Answer grounded in indexed knowledge chunks."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(..., min_length=1)
    citations: list[KnowledgeCitation] = Field(default_factory=list)
    usage: dict[str, Any] | None = None


class KnowledgeExpansionRequest(BaseModel):
    """Request for expanding an existing note or knowledge draft."""

    model_config = ConfigDict(extra="forbid")

    instruction: str = Field(..., min_length=3, max_length=2000)
    current_content: str | None = None
    related_resources: list[KnowledgeNoteDocument] = Field(default_factory=list)
    provider_config: ProviderConfig
    max_citations: int = Field(default=4, ge=1, le=8)
    request_id: str | None = None


class KnowledgeExpansionResponse(BaseModel):
    """Expanded note draft grounded in knowledge notes."""

    model_config = ConfigDict(extra="forbid")

    expanded_content: str = Field(..., min_length=1)
    citations: list[KnowledgeCitation] = Field(default_factory=list)
    usage: dict[str, Any] | None = None
