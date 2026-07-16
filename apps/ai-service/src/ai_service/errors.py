"""Application-specific exceptions.

The main idea is simple:
- provider and service layers raise typed Python exceptions
- the API layer converts them into stable HTTP responses
"""

from __future__ import annotations

from ai_service.schemas import ErrorResponse


class AIServiceError(Exception):
    """Base class for exceptions that should become API responses."""

    status_code = 500
    error = "internal_error"
    default_detail = "The AI service encountered an unexpected error."

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.default_detail)
        self.detail = detail or self.default_detail

    def to_response(self, request_id: str | None = None) -> ErrorResponse:
        """Convert the exception to our shared error schema."""

        return ErrorResponse(
            error=self.error,
            detail=self.detail,
            request_id=request_id,
        )


class UnsupportedProviderError(AIServiceError):
    """Raised when the caller asks for a provider we do not support."""

    status_code = 400
    error = "unsupported_provider"
    default_detail = "The requested provider is not supported."


class UpstreamProviderError(AIServiceError):
    """Raised when an upstream LLM provider request fails."""

    status_code = 502
    error = "upstream_provider_error"
    default_detail = "The upstream LLM provider request failed."

    def __init__(
        self,
        detail: str | None = None,
        *,
        upstream_status_code: int | None = None,
    ) -> None:
        super().__init__(detail)
        self.upstream_status_code = upstream_status_code


class StructuredOutputError(AIServiceError):
    """Raised when the provider response does not match our internal contract."""

    status_code = 502
    error = "structured_output_error"
    default_detail = "The provider returned an invalid structured output."
