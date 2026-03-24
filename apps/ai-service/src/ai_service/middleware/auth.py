"""Service authentication middleware."""

import hashlib
import hmac
import logging
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ai_service.config import get_settings

logger = logging.getLogger(__name__)


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for internal service authentication."""

    # Paths that don't require authentication
    PUBLIC_PATHS = {"/healthz", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request through authentication."""
        settings = get_settings()

        # Skip auth for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Skip auth in development if bypass is enabled
        if settings.dev_bypass_auth and settings.debug:
            logger.debug("Auth bypassed in development mode")
            return await call_next(request)

        # Check for required headers
        service_header = request.headers.get("X-Internal-Service")
        signature_header = request.headers.get("X-Internal-Signature")

        if not service_header:
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized",
                    "detail": "Missing X-Internal-Service header",
                },
            )

        if not signature_header:
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized",
                    "detail": "Missing X-Internal-Signature header",
                },
            )

        # Validate HMAC signature
        if not self._validate_signature(
            service_header, signature_header, settings.service_secret
        ):
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "Invalid signature"},
            )

        # Extract optional tracking headers and add to request state
        request.state.request_id = request.headers.get("X-Request-Id")
        request.state.identity_id = request.headers.get("X-Identity-Id")
        request.state.service_name = service_header

        return await call_next(request)

    def _validate_signature(
        self, service: str, signature: str, secret: str
    ) -> bool:
        """Validate HMAC signature.

        The signature should be HMAC-SHA256 of the service name using the shared secret.
        """
        expected = hmac.new(
            secret.encode(),
            service.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(signature, expected)
