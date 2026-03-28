"""Service for controlled analytics Q&A."""

from __future__ import annotations

import json

from ai_service.schemas import (
    AnalyticsQueryContext,
    AnalyticsQueryResponse,
    ChatMessage,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService


class AnalyticsQueryService:
    """Answer analytics questions from TypeScript-provided read models."""

    def __init__(self, chat_service: ChatService) -> None:
        self._chat_service = chat_service

    async def query(
        self,
        *,
        question: str,
        context: AnalyticsQueryContext,
        provider_config: ProviderConfig,
    ) -> AnalyticsQueryResponse:
        serialized_context = json.dumps(
            context.model_dump(mode="json"),
            ensure_ascii=False,
            indent=2,
        )

        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(
                    role="system",
                    content=(
                        "You answer analytics questions from controlled product data. "
                        "Do not invent metrics. "
                        "If the provided data is insufficient, say what is missing."
                    ),
                ),
                ChatMessage(
                    role="user",
                    content=(
                        f"Analytics question:\n{question}\n\n"
                        f"Structured analytics context:\n{serialized_context}\n\n"
                        "Return a concise answer and focus on concrete observations."
                    ),
                ),
            ],
            config=provider_config,
        )

        return AnalyticsQueryResponse(
            answer=completion.content.strip(),
            highlights=self._build_highlights(context),
            usage=completion.usage,
        )

    def _build_highlights(self, context: AnalyticsQueryContext) -> list[str]:
        highlights: list[str] = []

        if context.dashboard:
            stats = context.dashboard.get("stats")
            if isinstance(stats, dict):
                for key in (
                    "activeGoals",
                    "activeTasks",
                    "completedToday",
                    "upcomingReminders",
                ):
                    value = stats.get(key)
                    if value is not None:
                        highlights.append(f"{key}: {value}")

        if context.task_dashboard:
            summary = context.task_dashboard.get("summary")
            if isinstance(summary, dict):
                for key in ("totalTasks", "overdue", "highPriority"):
                    value = summary.get(key)
                    if value is not None:
                        highlights.append(f"task.{key}: {value}")

        return highlights[:6]
