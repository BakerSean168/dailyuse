"""Knowledge note generation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import (
    get_knowledge_expansion_service,
    get_knowledge_indexing_service,
    get_knowledge_note_service,
    get_knowledge_query_service,
)
from ai_service.schemas import (
    KnowledgeExpansionRequest,
    KnowledgeExpansionResponse,
    KnowledgeIndexResourceRequest,
    KnowledgeIndexResourceResponse,
    KnowledgeNoteRequest,
    KnowledgeNoteResponse,
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
)
from ai_service.services import (
    KnowledgeExpansionService,
    KnowledgeIndexingService,
    KnowledgeNoteService,
    KnowledgeQueryService,
)

router = APIRouter(prefix="/internal/knowledge", tags=["knowledge"])


@router.post("/generate-note", response_model=KnowledgeNoteResponse)
async def generate_note(
    request: KnowledgeNoteRequest,
    knowledge_note_service: KnowledgeNoteService = Depends(get_knowledge_note_service),
) -> KnowledgeNoteResponse:
    """Generate markdown knowledge note content."""

    return await knowledge_note_service.generate(
        topic=request.topic,
        title=request.title,
        provider_config=request.provider_config,
    )


@router.post("/index-resource", response_model=KnowledgeIndexResourceResponse)
async def index_resource(
    request: KnowledgeIndexResourceRequest,
    knowledge_indexing_service: KnowledgeIndexingService = Depends(
        get_knowledge_indexing_service
    ),
) -> KnowledgeIndexResourceResponse:
    """Chunk and summarize one repository resource for later retrieval."""

    indexed_resource = await knowledge_indexing_service.index_resource_async(
        request.resource,
        provider_config=request.provider_config,
        max_chunk_chars=request.max_chunk_chars,
        overlap_chars=request.overlap_chars,
    )
    return KnowledgeIndexResourceResponse(indexed_resource=indexed_resource)


@router.post("/query", response_model=KnowledgeQueryResponse)
async def query_knowledge(
    request: KnowledgeQueryRequest,
    knowledge_query_service: KnowledgeQueryService = Depends(
        get_knowledge_query_service
    ),
) -> KnowledgeQueryResponse:
    """Answer a question from indexed knowledge chunks."""

    return await knowledge_query_service.query(
        question=request.question,
        indexed_resources=request.indexed_resources,
        provider_config=request.provider_config,
        max_citations=request.max_citations,
    )


@router.post("/expand", response_model=KnowledgeExpansionResponse)
async def expand_knowledge(
    request: KnowledgeExpansionRequest,
    knowledge_expansion_service: KnowledgeExpansionService = Depends(
        get_knowledge_expansion_service
    ),
) -> KnowledgeExpansionResponse:
    """Expand a note draft from current content plus related repository context."""

    return await knowledge_expansion_service.expand(
        instruction=request.instruction,
        current_content=request.current_content,
        related_resources=request.related_resources,
        provider_config=request.provider_config,
        max_citations=request.max_citations,
    )
