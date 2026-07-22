"""Service for expanding knowledge drafts from repository-backed context."""

from __future__ import annotations

import json

from ai_service.schemas import (
    ChatMessage,
    KnowledgeExpansionResponse,
    KnowledgeNoteDocument,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)


class KnowledgeExpansionService:
    """Generate grounded note expansions from existing content and related notes."""

    def __init__(
        self,
        chat_service: ChatService,
        indexing_service: KnowledgeIndexingService,
    ) -> None:
        self._chat_service = chat_service
        self._indexing_service = indexing_service
        self._knowledge_query_service = KnowledgeQueryService(
            chat_service,
            indexing_service,
        )

    async def expand(
        self,
        *,
        instruction: str,
        current_content: str | None,
        related_resources: list[KnowledgeNoteDocument],
        provider_config: ProviderConfig,
        max_citations: int = 4,
    ) -> KnowledgeExpansionResponse:
        """Expand a note draft while grounding additions in repository excerpts."""

        indexed_resources = [
            await self._indexing_service.index_note_async(
                resource,
                provider_config=provider_config,
            )
            for resource in related_resources
        ]
        retrieval_query = "\n".join(filter(None, [instruction, current_content]))
        citations = (
            await self._knowledge_query_service._select_citations(
                retrieval_query,
                indexed_resources,
                provider_config=provider_config,
                max_citations=max_citations,
            )
            if indexed_resources
            else []
        )
        prompt_context = json.dumps(
            [
                {
                    "resource_path": citation.resource_path,
                    "title": citation.title,
                    "chunk_index": citation.chunk_index,
                    "excerpt": citation.excerpt,
                    "score": citation.score,
                }
                for citation in citations
            ],
            ensure_ascii=False,
            indent=2,
        )

        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(
                    role="system",
                    content=(
                        "Expand or refine the note draft using the provided "
                        "repository excerpts. Keep the output concise, concrete, "
                        "and grounded. If the excerpts are incomplete, preserve "
                        "that uncertainty instead of inventing details."
                    ),
                ),
                ChatMessage(
                    role="user",
                    content=(
                        f"Instruction:\n{instruction}\n\n"
                        f"Current draft:\n{current_content or '(empty draft)'}\n\n"
                        f"Grounding excerpts:\n{prompt_context}\n\n"
                        "Return only the expanded markdown content."
                    ),
                ),
            ],
            config=provider_config,
        )

        return KnowledgeExpansionResponse(
            expanded_content=completion.content.strip(),
            citations=citations,
            usage=completion.usage,
        )
