"""Central exception handling for HTTP routes."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ai_service.errors import AIServiceError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """Register project-wide exception handlers on the FastAPI app."""

    @app.exception_handler(AIServiceError)
    async def handle_ai_service_error(
        request: Request, exc: AIServiceError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_response(request_id=request_id).model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "Unhandled ai-service exception",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "detail": "The AI service encountered an unexpected error.",
                "request_id": request_id,
            },
        )
