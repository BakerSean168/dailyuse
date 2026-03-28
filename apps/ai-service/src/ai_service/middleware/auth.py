"""Service authentication middleware.

This middleware protects internal endpoints from being called directly by random
clients. The current contract signs:
- the caller service name
- the HTTP method
- the request path
- a timestamp
- the SHA-256 digest of the exact request body
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ai_service.config import get_settings
from ai_service.security import (
    INTERNAL_CONTENT_HASH_HEADER,
    INTERNAL_SERVICE_HEADER,
    INTERNAL_SIGNATURE_HEADER,
    INTERNAL_TIMESTAMP_HEADER,
    compute_content_sha256,
    is_timestamp_fresh,
    validate_internal_request_signature,
)

logger = logging.getLogger(__name__)


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for internal service authentication."""

    PUBLIC_PATHS = {"/healthz", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Allow public routes and validate auth for internal routes."""

        settings = get_settings()

        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        if settings.dev_bypass_auth and settings.debug:
            logger.debug("Auth bypassed in development mode")
            return await call_next(request)

        service_name = request.headers.get(INTERNAL_SERVICE_HEADER)
        timestamp_header = request.headers.get(INTERNAL_TIMESTAMP_HEADER)
        content_hash_header = request.headers.get(INTERNAL_CONTENT_HASH_HEADER)
        signature = request.headers.get(INTERNAL_SIGNATURE_HEADER)

        if not service_name:
            return self._unauthorized(
                request, f"Missing {INTERNAL_SERVICE_HEADER} header"
            )

        if not timestamp_header:
            return self._unauthorized(
                request, f"Missing {INTERNAL_TIMESTAMP_HEADER} header"
            )

        if not content_hash_header:
            return self._unauthorized(
                request, f"Missing {INTERNAL_CONTENT_HASH_HEADER} header"
            )

        if not signature:
            return self._unauthorized(
                request, f"Missing {INTERNAL_SIGNATURE_HEADER} header"
            )

        try:
            timestamp = int(timestamp_header)
        except ValueError:
            return self._unauthorized(
                request,
                f"{INTERNAL_TIMESTAMP_HEADER} must be a Unix timestamp in seconds",
            )

        if not is_timestamp_fresh(
            timestamp=timestamp,
            max_skew_seconds=settings.internal_request_max_skew_seconds,
        ):
            return self._unauthorized(
                request, "Request timestamp is outside the allowed window"
            )

        body = await request.body()
        actual_content_hash = compute_content_sha256(body)
        if not self._validate_content_hash(
            expected_content_hash=content_hash_header,
            actual_content_hash=actual_content_hash,
        ):
            return self._unauthorized(request, "Request body hash does not match")

        if not validate_internal_request_signature(
            secret=settings.service_secret,
            service_name=service_name,
            method=request.method,
            path=request.url.path,
            timestamp=timestamp,
            content_sha256=actual_content_hash,
            signature=signature,
        ):
            return self._unauthorized(request, "Invalid signature")

        # `request.state` is FastAPI/Starlette's standard place to stash
        # per-request metadata after middleware has inspected the request.
        request.state.request_id = getattr(
            request.state, "request_id", request.headers.get("X-Request-Id")
        )
        request.state.identity_id = request.headers.get("X-Identity-Id")
        request.state.service_name = service_name
        request.state.auth_timestamp = datetime.fromtimestamp(timestamp, tz=UTC)
        request.state.content_sha256 = actual_content_hash

        return await call_next(request)

    def _validate_content_hash(
        self,
        *,
        expected_content_hash: str,
        actual_content_hash: str,
    ) -> bool:
        """Check whether the caller's body digest matches the actual request body."""

        return expected_content_hash == actual_content_hash

    def _unauthorized(self, request: Request, detail: str) -> JSONResponse:
        """Return a consistent unauthorized response body."""

        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=401,
            content={
                "error": "unauthorized",
                "detail": detail,
                "request_id": request_id,
            },
        )
