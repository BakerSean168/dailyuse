"""Knowledge indexing and retrieval services."""

from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter

from ai_service.schemas import (
    ChatMessage,
    IndexedKnowledgeChunk,
    IndexedKnowledgeResource,
    KnowledgeCitation,
    KnowledgeQueryResponse,
    KnowledgeResourceDocument,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "what",
    "when",
    "where",
    "which",
    "with",
    "why",
    "you",
}
EMBEDDING_DIMENSION = 48
MAX_EMBEDDING_SOURCE_CHARS = 4000


def _tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-zA-Z0-9_]+", text.lower())
        if len(token) > 1 and token not in STOP_WORDS
    ]


def _char_ngrams(token: str, *, min_size: int = 3, max_size: int = 5) -> list[str]:
    padded = f"^{token}$"
    grams: list[str] = []
    for size in range(min_size, min(max_size, len(padded)) + 1):
        for index in range(0, len(padded) - size + 1):
            grams.append(padded[index : index + size])
    return grams


def _project_feature(feature: str) -> tuple[int, float]:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
    bucket = int.from_bytes(digest[:4], "big") % EMBEDDING_DIMENSION
    sign = -1.0 if digest[4] % 2 else 1.0
    return bucket, sign


def _normalize_embedding(vector: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        return vector
    return [round(value / magnitude, 6) for value in vector]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(left[index] * right[index] for index in range(len(left)))


def _matching_query_embedding(
    target_embedding: list[float],
    *,
    local_embedding: list[float],
    provider_embedding: list[float] | None,
) -> list[float]:
    if provider_embedding and len(provider_embedding) == len(target_embedding):
        return provider_embedding
    if len(local_embedding) == len(target_embedding):
        return local_embedding
    return []


class KnowledgeIndexingService:
    """Chunk knowledge notes into a stable retrieval representation."""

    def __init__(self, chat_service: ChatService | None = None) -> None:
        self._chat_service = chat_service

    def index_resource(
        self,
        resource: KnowledgeResourceDocument,
        *,
        max_chunk_chars: int = 1200,
        overlap_chars: int = 150,
    ) -> IndexedKnowledgeResource:
        normalized_content = resource.content.strip()
        content_hash = hashlib.sha256(normalized_content.encode("utf-8")).hexdigest()
        keywords = self.extract_keywords(normalized_content)
        summary = self._build_summary(normalized_content)
        chunks = self._build_chunks(
            normalized_content,
            max_chunk_chars=max_chunk_chars,
            overlap_chars=overlap_chars,
        )

        return IndexedKnowledgeResource(
            identity_id=resource.identity_id,
            repository_id=resource.repository_id,
            resource_id=resource.resource_id,
            resource_path=resource.resource_path,
            title=resource.title,
            mime_type=resource.mime_type,
            content_hash=content_hash,
            summary=summary,
            keywords=keywords,
            embedding=self._embed_text(
                " ".join(
                    filter(
                        None,
                        [
                            resource.title,
                            summary,
                            " ".join(keywords),
                            normalized_content[:MAX_EMBEDDING_SOURCE_CHARS],
                        ],
                    )
                )
            ),
            chunks=chunks,
            metadata=resource.metadata,
        )

    async def index_resource_async(
        self,
        resource: KnowledgeResourceDocument,
        *,
        provider_config: ProviderConfig | None = None,
        max_chunk_chars: int = 1200,
        overlap_chars: int = 150,
    ) -> IndexedKnowledgeResource:
        indexed_resource = self.index_resource(
            resource,
            max_chunk_chars=max_chunk_chars,
            overlap_chars=overlap_chars,
        )

        if provider_config is None or self._chat_service is None:
            return indexed_resource

        return await self._apply_provider_embeddings(
            indexed_resource,
            provider_config,
            resource.content.strip(),
        )

    async def build_query_embeddings(
        self,
        text: str,
        *,
        provider_config: ProviderConfig | None = None,
    ) -> tuple[list[float], list[float] | None]:
        return self._embed_text(text), await self._embed_with_provider(
            text,
            provider_config,
        )

    def extract_keywords(self, content: str, *, limit: int = 8) -> list[str]:
        token_counts = Counter(_tokenize(content))
        return [token for token, _count in token_counts.most_common(limit)]

    def _build_summary(self, content: str) -> str:
        paragraphs = [
            paragraph.strip()
            for paragraph in re.split(r"\n\s*\n", content)
            if paragraph.strip()
        ]
        if not paragraphs:
            return content[:240]

        summary = " ".join(paragraphs[:2]).strip()
        return summary[:400]

    def _build_chunks(
        self,
        content: str,
        *,
        max_chunk_chars: int,
        overlap_chars: int,
    ) -> list[IndexedKnowledgeChunk]:
        paragraphs = [
            paragraph.strip()
            for paragraph in re.split(r"\n\s*\n", content)
            if paragraph.strip()
        ]
        if not paragraphs:
            paragraphs = [content]

        chunks: list[IndexedKnowledgeChunk] = []
        current_text = ""
        current_start = 0
        current_heading_path: list[str] = []
        search_cursor = 0

        for paragraph in paragraphs:
            paragraph_start = content.find(paragraph, search_cursor)
            if paragraph_start == -1:
                paragraph_start = search_cursor
            paragraph_end = paragraph_start + len(paragraph)
            search_cursor = paragraph_end

            heading_match = re.match(r"^(#+)\s+(.+)$", paragraph)
            if heading_match:
                level = len(heading_match.group(1))
                heading = heading_match.group(2).strip()
                current_heading_path = current_heading_path[: max(level - 1, 0)]
                current_heading_path.append(heading)

            candidate = (
                paragraph if not current_text else f"{current_text}\n\n{paragraph}"
            )
            if current_text and len(candidate) > max_chunk_chars:
                chunks.append(
                    self._make_chunk(
                        chunk_index=len(chunks),
                        content=current_text,
                        start_offset=current_start,
                        end_offset=current_start + len(current_text),
                        heading_path=current_heading_path,
                    )
                )
                overlap = current_text[-overlap_chars:] if overlap_chars else ""
                current_text = (
                    f"{overlap}\n\n{paragraph}".strip() if overlap else paragraph
                )
                current_start = max(paragraph_start - len(overlap), 0)
                continue

            if not current_text:
                current_start = paragraph_start
            current_text = candidate

        if current_text:
            chunks.append(
                self._make_chunk(
                    chunk_index=len(chunks),
                    content=current_text,
                    start_offset=current_start,
                    end_offset=current_start + len(current_text),
                    heading_path=current_heading_path,
                )
            )

        return chunks

    def _make_chunk(
        self,
        *,
        chunk_index: int,
        content: str,
        start_offset: int,
        end_offset: int,
        heading_path: list[str],
    ) -> IndexedKnowledgeChunk:
        normalized_content = content.strip()
        keywords = self.extract_keywords(normalized_content, limit=5)
        return IndexedKnowledgeChunk(
            chunk_index=chunk_index,
            content=normalized_content,
            content_hash=hashlib.sha256(normalized_content.encode("utf-8")).hexdigest(),
            start_offset=start_offset,
            end_offset=max(end_offset, start_offset),
            heading_path=list(heading_path),
            keywords=keywords,
            embedding=self._embed_text(
                " ".join(
                    filter(
                        None,
                        [
                            " ".join(heading_path),
                            " ".join(keywords),
                            normalized_content[:MAX_EMBEDDING_SOURCE_CHARS],
                        ],
                    )
                )
            ),
        )

    async def _apply_provider_embeddings(
        self,
        indexed_resource: IndexedKnowledgeResource,
        provider_config: ProviderConfig,
        source_content: str,
    ) -> IndexedKnowledgeResource:
        assert self._chat_service is not None

        embedding_inputs = [
            self._build_resource_embedding_text(indexed_resource, source_content),
            *[
                self._build_chunk_embedding_text(chunk)
                for chunk in indexed_resource.chunks
            ],
        ]

        try:
            embeddings = await self._chat_service.embed(
                embedding_inputs,
                provider_config,
            )
        except Exception:
            return indexed_resource

        if len(embeddings) != len(embedding_inputs) or len(embeddings) == 0:
            return indexed_resource

        resource_embedding = _normalize_embedding(
            [float(value) for value in embeddings[0] if isinstance(value, int | float)]
        )
        if len(resource_embedding) == 0:
            return indexed_resource

        chunk_embeddings = [
            _normalize_embedding(
                [float(value) for value in embedding if isinstance(value, int | float)]
            )
            for embedding in embeddings[1:]
        ]

        if any(len(embedding) == 0 for embedding in chunk_embeddings):
            return indexed_resource

        return indexed_resource.model_copy(
            update={
                "embedding": resource_embedding,
                "chunks": [
                    chunk.model_copy(update={"embedding": chunk_embeddings[index]})
                    for index, chunk in enumerate(indexed_resource.chunks)
                ],
            }
        )

    async def _embed_with_provider(
        self,
        text: str,
        provider_config: ProviderConfig | None,
    ) -> list[float] | None:
        if self._chat_service is None or provider_config is None:
            return None

        try:
            embeddings = await self._chat_service.embed([text], provider_config)
        except Exception:
            return None

        if len(embeddings) != 1:
            return None

        embedding = _normalize_embedding(
            [float(value) for value in embeddings[0] if isinstance(value, int | float)]
        )
        return embedding if embedding else None

    def _build_resource_embedding_text(
        self,
        resource: IndexedKnowledgeResource,
        source_content: str,
    ) -> str:
        return " ".join(
            filter(
                None,
                [
                    resource.title,
                    resource.summary,
                    " ".join(resource.keywords),
                    source_content[:MAX_EMBEDDING_SOURCE_CHARS],
                ],
            )
        )

    def _build_chunk_embedding_text(self, chunk: IndexedKnowledgeChunk) -> str:
        return " ".join(
            filter(
                None,
                [
                    " ".join(chunk.heading_path),
                    " ".join(chunk.keywords),
                    chunk.content[:MAX_EMBEDDING_SOURCE_CHARS],
                ],
            )
        )

    def _embed_text(self, text: str) -> list[float]:
        token_counts = Counter(_tokenize(text))
        vector = [0.0] * EMBEDDING_DIMENSION

        for token, count in token_counts.items():
            bucket, sign = _project_feature(f"tok:{token}")
            vector[bucket] += sign * (1.0 + math.log1p(count))

            for gram in _char_ngrams(token):
                gram_bucket, gram_sign = _project_feature(f"ng:{gram}")
                vector[gram_bucket] += gram_sign * (0.2 * count)

        return _normalize_embedding(vector)


class KnowledgeQueryService:
    """Answer questions using indexed repository chunks and citations."""

    def __init__(
        self,
        chat_service: ChatService,
        indexing_service: KnowledgeIndexingService,
    ) -> None:
        self._chat_service = chat_service
        self._indexing_service = indexing_service

    async def query(
        self,
        *,
        question: str,
        indexed_resources: list[IndexedKnowledgeResource],
        provider_config: ProviderConfig,
        max_citations: int = 3,
    ) -> KnowledgeQueryResponse:
        citations = await self._select_citations(
            question,
            indexed_resources,
            provider_config=provider_config,
            max_citations=max_citations,
        )
        if not citations:
            return KnowledgeQueryResponse(
                answer=(
                    "I could not find enough relevant knowledge in the "
                    "provided knowledge notes."
                ),
                citations=[],
                usage=None,
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
                        "Answer the question only from the provided repository "
                        "excerpts. "
                        "If the evidence is incomplete, say so explicitly. "
                        "Cite resource paths inline when helpful."
                    ),
                ),
                ChatMessage(
                    role="user",
                    content=(
                        f"Question:\n{question}\n\n"
                        f"Relevant excerpts:\n{prompt_context}\n\n"
                        "Provide a concise answer grounded in these excerpts."
                    ),
                ),
            ],
            config=provider_config,
        )

        return KnowledgeQueryResponse(
            answer=completion.content.strip(),
            citations=citations,
            usage=completion.usage,
        )

    async def select_citations(
        self,
        *,
        question: str,
        indexed_resources: list[IndexedKnowledgeResource],
        provider_config: ProviderConfig,
        max_citations: int = 3,
    ) -> list[KnowledgeCitation]:
        """Public wrapper for deterministic citation selection."""

        return await self._select_citations(
            question,
            indexed_resources,
            provider_config=provider_config,
            max_citations=max_citations,
        )

    async def _select_citations(
        self,
        question: str,
        indexed_resources: list[IndexedKnowledgeResource],
        *,
        provider_config: ProviderConfig,
        max_citations: int,
    ) -> list[KnowledgeCitation]:
        question_tokens = set(_tokenize(question))
        (
            local_question_embedding,
            provider_question_embedding,
        ) = await self._indexing_service.build_query_embeddings(
            question,
            provider_config=provider_config,
        )
        ranked: list[KnowledgeCitation] = []

        for resource in indexed_resources:
            resource_tokens = set(resource.keywords)
            resource_query_embedding = _matching_query_embedding(
                resource.embedding,
                local_embedding=local_question_embedding,
                provider_embedding=provider_question_embedding,
            )
            resource_similarity = max(
                0.0,
                _cosine_similarity(resource_query_embedding, resource.embedding),
            )
            for chunk in resource.chunks:
                chunk_tokens = set(chunk.keywords) | set(_tokenize(chunk.content[:400]))
                overlap = question_tokens & (chunk_tokens | resource_tokens)
                chunk_query_embedding = _matching_query_embedding(
                    chunk.embedding,
                    local_embedding=local_question_embedding,
                    provider_embedding=provider_question_embedding,
                )
                chunk_similarity = max(
                    0.0,
                    _cosine_similarity(chunk_query_embedding, chunk.embedding),
                )
                score = float(len(overlap))
                score += chunk_similarity * 4.0
                score += resource_similarity * 1.5
                if resource.title and resource.title.lower() in question.lower():
                    score += 1.5
                if any(
                    token in resource.resource_path.lower() for token in question_tokens
                ):
                    score += 1.0
                if score <= 0.35:
                    continue

                ranked.append(
                    KnowledgeCitation(
                        resource_id=resource.resource_id,
                        resource_path=resource.resource_path,
                        title=resource.title,
                        chunk_index=chunk.chunk_index,
                        excerpt=chunk.content[:320],
                        score=round(score, 3),
                    )
                )

        ranked.sort(key=lambda citation: citation.score, reverse=True)
        return ranked[:max_citations]
