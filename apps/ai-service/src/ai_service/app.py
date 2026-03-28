"""Application factory and process-wide wiring.

This module owns the objects that should exist once per FastAPI process:
- the settings object
- the shared HTTP client
- long-lived services that reuse that client

Using a dedicated app factory keeps route modules simple. Routes only describe
HTTP behavior; they do not decide how the application is assembled.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_service.api.error_handlers import register_exception_handlers
from ai_service.api.routes import analytics, chat, goals, health, knowledge
from ai_service.config import get_settings
from ai_service.infrastructure.http_client import create_shared_async_client
from ai_service.middleware import RequestContextMiddleware, ServiceAuthMiddleware
from ai_service.services import (
    AnalyticsQueryService,
    GoalPlanningService,
    KnowledgeExpansionService,
    KnowledgeIndexingService,
    KnowledgeNoteService,
    KnowledgeQueryService,
    create_chat_service,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create and dispose shared resources around the app lifetime."""

    settings = get_settings()

    # A single shared AsyncClient gives us connection pooling and a central
    # place to define timeouts and default headers.
    http_client = create_shared_async_client(settings)
    chat_service = create_chat_service(http_client=http_client)
    goal_planning_service = GoalPlanningService(chat_service)
    knowledge_note_service = KnowledgeNoteService(chat_service)
    knowledge_indexing_service = KnowledgeIndexingService(chat_service)
    knowledge_query_service = KnowledgeQueryService(
        chat_service,
        knowledge_indexing_service,
    )
    knowledge_expansion_service = KnowledgeExpansionService(
        chat_service,
        knowledge_indexing_service,
    )
    analytics_query_service = AnalyticsQueryService(chat_service)

    app.state.settings = settings
    app.state.http_client = http_client
    app.state.chat_service = chat_service
    app.state.goal_planning_service = goal_planning_service
    app.state.knowledge_note_service = knowledge_note_service
    app.state.knowledge_indexing_service = knowledge_indexing_service
    app.state.knowledge_query_service = knowledge_query_service
    app.state.knowledge_expansion_service = knowledge_expansion_service
    app.state.analytics_query_service = analytics_query_service

    logger.info(
        "AI service resources initialized",
        extra={
            "service_name": settings.service_name,
            "version": settings.app_version,
            "debug": settings.debug,
        },
    )

    try:
        yield
    finally:
        await http_client.aclose()
        logger.info("AI service resources released")


def create_app() -> FastAPI:
    """Build a configured FastAPI application instance."""

    settings = get_settings()
    logging.getLogger().setLevel(settings.log_level)

    app = FastAPI(
        title="AI Service",
        description="Python service for AI/LLM operations",
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS is mainly useful in local development. We keep it explicit here so
    # the allowlist stays easy to audit.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Internal endpoints still need auth because they should only be callable
    # by trusted services in our own system.
    app.add_middleware(ServiceAuthMiddleware)
    app.add_middleware(RequestContextMiddleware)

    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(goals.router)
    app.include_router(knowledge.router)
    app.include_router(analytics.router)
    register_exception_handlers(app)

    logger.info(
        "AI service application created",
        extra={
            "service_name": settings.service_name,
            "version": settings.app_version,
            "log_level": settings.log_level,
        },
    )

    return app


def get_app_state(app: FastAPI) -> dict[str, Any]:
    """Return the pieces of app state we expect to have after startup."""

    return {
        "settings": app.state.settings,
        "http_client": app.state.http_client,
        "chat_service": app.state.chat_service,
        "goal_planning_service": app.state.goal_planning_service,
        "knowledge_note_service": app.state.knowledge_note_service,
        "knowledge_indexing_service": app.state.knowledge_indexing_service,
        "knowledge_query_service": app.state.knowledge_query_service,
        "knowledge_expansion_service": app.state.knowledge_expansion_service,
        "analytics_query_service": app.state.analytics_query_service,
    }
