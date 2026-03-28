"""Chat completion endpoints."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from ai_service.api.dependencies import get_chat_service
from ai_service.errors import AIServiceError
from ai_service.schemas import (
    ChatCompleteRequest,
    ChatCompleteResponse,
    ChatStreamRequest,
)
from ai_service.services import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/chat", tags=["chat"])


@router.post("/complete", response_model=ChatCompleteResponse)
async def chat_complete(
    request: ChatCompleteRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatCompleteResponse:
    """Generate a non-streaming chat completion."""

    return await chat_service.complete(
        messages=request.messages,
        config=request.provider_config,
    )


@router.post("/stream")
async def chat_stream(
    request: ChatStreamRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> EventSourceResponse:
    """Generate a streaming chat completion using SSE."""

    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        try:
            async for chunk in chat_service.stream(
                messages=request.messages,
                config=request.provider_config,
            ):
                yield {
                    "event": "message",
                    "data": json.dumps(chunk.model_dump(mode="json")),
                }

            yield {"event": "done", "data": ""}
        except AIServiceError as exc:
            yield {
                "event": "error",
                "data": json.dumps(
                    {
                        "error": exc.error,
                        "detail": exc.detail,
                    }
                ),
            }
        except Exception as exc:
            logger.exception("Error in chat stream")
            yield {
                "event": "error",
                "data": json.dumps(
                    {
                        "error": "internal_error",
                        "detail": f"Chat stream failed: {exc!s}",
                    }
                ),
            }

    return EventSourceResponse(event_generator())
