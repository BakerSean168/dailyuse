"""FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_service.api.routes import chat, health
from ai_service.config import get_settings
from ai_service.middleware import ServiceAuthMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    # Set logging level based on settings
    logging.getLogger().setLevel(settings.log_level)

    app = FastAPI(
        title="AI Service",
        description="Python service for AI/LLM operations",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add service auth middleware
    app.add_middleware(ServiceAuthMiddleware)

    # Include routers
    app.include_router(health.router)
    app.include_router(chat.router)

    logger.info(
        "AI Service started",
        extra={
            "debug": settings.debug,
            "log_level": settings.log_level,
        },
    )

    return app


# Create the app instance
app = create_app()
