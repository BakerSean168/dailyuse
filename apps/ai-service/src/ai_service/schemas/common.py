"""Common schemas used across the application."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    service: str
    version: str


class ErrorResponse(BaseModel):
    """Error response schema."""

    error: str
    detail: str | None = None
    request_id: str | None = None
