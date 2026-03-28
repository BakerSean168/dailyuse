"""Service for markdown knowledge-note generation."""

from __future__ import annotations

from ai_service.schemas import (
    ChatMessage,
    KnowledgeNoteResponse,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService


class KnowledgeNoteService:
    """Generate markdown note content through the shared chat service."""

    def __init__(self, chat_service: ChatService) -> None:
        self._chat_service = chat_service

    async def generate(
        self,
        *,
        topic: str,
        title: str | None,
        provider_config: ProviderConfig,
    ) -> KnowledgeNoteResponse:
        """Generate note content for the requested topic."""

        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(role="system", content=build_note_system_prompt()),
                ChatMessage(
                    role="user",
                    content=build_note_user_prompt(topic=topic, title=title),
                ),
            ],
            config=provider_config,
        )

        return KnowledgeNoteResponse(
            content=completion.content,
            usage=completion.usage,
        )


def build_note_system_prompt() -> str:
    """Return the shared system prompt for note generation."""

    return (
        "You write concise, well-structured Markdown knowledge notes. "
        "Always respond with Markdown only. Include a title, a short introduction, "
        "clear section headings, and a short closing summary."
    )


def build_note_user_prompt(*, topic: str, title: str | None) -> str:
    """Return the user prompt for note generation."""

    return "\n".join(
        filter(
            None,
            [
                f"Topic: {topic}",
                f"Preferred title: {title}" if title else None,
                "Style requirements:",
                "- write in Markdown",
                "- make the note concise and readable",
                "- explain terms plainly for a non-expert reader",
                "- use short sections and practical examples when useful",
            ],
        )
    )
