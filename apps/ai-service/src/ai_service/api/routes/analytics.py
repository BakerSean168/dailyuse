"""Analytics query endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import get_analytics_query_service
from ai_service.schemas import AnalyticsQueryRequest, AnalyticsQueryResponse
from ai_service.services import AnalyticsQueryService

router = APIRouter(prefix="/internal/analytics", tags=["analytics"])


@router.post("/query", response_model=AnalyticsQueryResponse)
async def query_analytics(
    request: AnalyticsQueryRequest,
    analytics_query_service: AnalyticsQueryService = Depends(
        get_analytics_query_service
    ),
) -> AnalyticsQueryResponse:
    """Answer a question from controlled analytics read models."""

    return await analytics_query_service.query(
        question=request.question,
        context=request.context,
        provider_config=request.provider_config,
    )
