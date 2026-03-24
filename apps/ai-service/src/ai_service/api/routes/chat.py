"""Chat completion endpoints."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse

from ai_service.schemas import (
    ChatCompleteRequest,
    ChatCompleteResponse,
    ChatStreamRequest,
)
from ai_service.services import ChatService, get_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/chat", tags=["chat"])


@router.post("/complete", response_model=ChatCompleteResponse)
async def chat_complete(
    request: ChatCompleteRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatCompleteResponse:
    """Generate a non-streaming chat completion."""
    try:
        return await chat_service.complete(
            messages=request.messages,
            config=request.provider_config,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("Error in chat completion")
        raise HTTPException(
            status_code=500, detail=f"Chat completion failed: {e!s}"
        ) from e


@router.post("/stream")
async def chat_stream(
    request: ChatStreamRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> EventSourceResponse:
    """Generate a streaming chat completion using SSE."""

    async def event_generator():
        try:
            async for chunk in chat_service.stream(
                messages=request.messages,
                config=request.provider_config,
            ):
                # Yield each chunk as SSE data
                yield {
                    "event": "message",
                    "data": json.dumps(chunk.model_dump()),
                }

            # Send done event
            yield {"event": "done", "data": ""}

        except ValueError as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }
        except Exception as e:
            logger.exception("Error in chat stream")
            yield {
                "event": "error",
                "data": json.dumps({"error": f"Chat stream failed: {e!s}"}),
            }

    return EventSourceResponse(event_generator())
