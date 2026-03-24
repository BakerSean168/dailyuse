"""Health check endpoint."""

from fastapi import APIRouter

from ai_service.schemas import HealthResponse

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(
        status="healthy",
        service="ai-service",
        version="1.0.0",
    )
