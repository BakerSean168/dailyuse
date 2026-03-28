"""Health check endpoint."""

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import get_settings_dependency
from ai_service.config import Settings
from ai_service.schemas import HealthResponse

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def health_check(
    settings: Settings = Depends(get_settings_dependency),
) -> HealthResponse:
    """Return service health status."""

    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.app_version,
    )
