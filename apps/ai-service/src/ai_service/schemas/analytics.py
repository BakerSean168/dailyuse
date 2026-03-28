"""Schemas for analytics query execution."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from ai_service.schemas.chat import ProviderConfig


class AnalyticsQueryContext(BaseModel):
    """Structured, read-only analytics context supplied by TypeScript."""

    model_config = ConfigDict(extra="forbid")

    dashboard: dict[str, Any] | None = None
    task_dashboard: dict[str, Any] | None = None
    goals: list[dict[str, Any]] = Field(default_factory=list)
    goal_search_results: list[dict[str, Any]] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)


class AnalyticsQueryRequest(BaseModel):
    """Request for answering an analytics question from controlled data."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=3, max_length=2000)
    context: AnalyticsQueryContext
    provider_config: ProviderConfig
    request_id: str | None = None


class AnalyticsQueryResponse(BaseModel):
    """Answer and concise highlights derived from analytics context."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(..., min_length=1)
    highlights: list[str] = Field(default_factory=list)
    usage: dict[str, Any] | None = None
