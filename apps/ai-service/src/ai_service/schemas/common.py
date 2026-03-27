"""Common schemas used across the application."""

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    """Health check response schema."""

    model_config = ConfigDict(extra="forbid")

    status: str
    service: str
    version: str


class ErrorResponse(BaseModel):
    """Error response schema."""

    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
    request_id: str | None = None
