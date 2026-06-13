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

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
)
from ai_service.agent_runtime.checkpoint_factory import (
    build_checkpointer,
    build_run_history_store,
)
from ai_service.api.error_handlers import register_exception_handlers
from ai_service.api.routes import agents, chat, health, workflows
from ai_service.config import get_settings
from ai_service.infrastructure.http_client import create_shared_async_client
from ai_service.logging_utils import compact_log, configure_logging
from ai_service.middleware import RequestContextMiddleware, ServiceAuthMiddleware
from ai_service.orchestrator.handlers.analytics_handler import AnalyticsWorkflowHandler
from ai_service.orchestrator.handlers.goal_automation_handler import (
    GoalAutomationWorkflowHandler,
)
from ai_service.orchestrator.handlers.goal_handler import GoalWorkflowHandler
from ai_service.orchestrator.handlers.knowledge_expand_handler import (
    KnowledgeExpandWorkflowHandler,
)
from ai_service.orchestrator.handlers.knowledge_handler import KnowledgeWorkflowHandler
from ai_service.orchestrator.handlers.knowledge_index_handler import (
    KnowledgeIndexWorkflowHandler,
)
from ai_service.orchestrator.handlers.knowledge_note_handler import (
    KnowledgeNoteWorkflowHandler,
)
from ai_service.orchestrator.orchestrator import AIWorkflowOrchestrator
from ai_service.services import (
    AnalyticsQueryService,
    GoalPlanningService,
    KnowledgeExpansionService,
    KnowledgeIndexingService,
    KnowledgeNoteService,
    KnowledgeQueryService,
    create_chat_service,
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
    knowledge_note_service = KnowledgeNoteService(chat_service)
    knowledge_indexing_service = KnowledgeIndexingService(chat_service)
    knowledge_query_service = KnowledgeQueryService(
        chat_service,
        knowledge_indexing_service,
    )
    analytics_query_service = AnalyticsQueryService(chat_service)
    goal_planning_service = GoalPlanningService(
        chat_service,
        knowledge_indexing_service,
        knowledge_query_service,
        analytics_query_service,
    )
    knowledge_expansion_service = KnowledgeExpansionService(
        chat_service,
        knowledge_indexing_service,
    )

    # Agent runtime checkpoint strategy:
    # - local (default): file-backed, suitable for single-instance development
    # - ts: HTTP + database, suitable for production multi-instance deployment
    #
    # Set via environment variable:
    #   AGENT_CHECKPOINT_STRATEGY=local  (default)
    #   AGENT_CHECKPOINT_STRATEGY=ts     (requires TS_API_BASE_URL)
    #
    # Note: 'ts' strategy requires identity_id at runtime. For simplicity, we pass
    # None here (which works for 'local'). When 'ts' is enabled, the runtime will
    # lazily construct the run_history_store per request with the actual identity_id.

    goal_create_agent_runtime = GoalCreateAgentRuntime(
        checkpointer=build_checkpointer(
            settings=settings,
            name="goal-create",
        ),
        run_history=build_run_history_store(
            settings=settings,
            name="goal-create",
            identity_id=None,  # Lazily constructed per-request for 'ts' strategy
        ),
        goal_planning_service=goal_planning_service,
    )
    knowledge_qa_agent_runtime = KnowledgeQaAgentRuntime(
        checkpointer=build_checkpointer(
            settings=settings,
            name="knowledge-qa",
        ),
        run_history=build_run_history_store(
            settings=settings,
            name="knowledge-qa",
            identity_id=None,
        ),
    )
    knowledge_generate_agent_runtime = KnowledgeGenerateAgentRuntime(
        checkpointer=build_checkpointer(
            settings=settings,
            name="knowledge-generate",
        ),
        run_history=build_run_history_store(
            settings=settings,
            name="knowledge-generate",
            identity_id=None,
        ),
        knowledge_note_service=knowledge_note_service,
        knowledge_query_service=knowledge_query_service,
    )

    orchestrator = AIWorkflowOrchestrator()
    goal_handler = GoalWorkflowHandler(goal_planning_service)
    goal_automation_handler = GoalAutomationWorkflowHandler(goal_planning_service)
    analytics_handler = AnalyticsWorkflowHandler(analytics_query_service)
    knowledge_handler = KnowledgeWorkflowHandler(knowledge_query_service)
    knowledge_note_handler = KnowledgeNoteWorkflowHandler(knowledge_note_service)
    knowledge_index_handler = KnowledgeIndexWorkflowHandler(knowledge_indexing_service)
    knowledge_expand_handler = KnowledgeExpandWorkflowHandler(
        knowledge_expansion_service
    )
    orchestrator.register_handler(goal_handler)
    orchestrator.register_handler(goal_automation_handler)
    orchestrator.register_handler(analytics_handler)
    orchestrator.register_handler(knowledge_handler)
    orchestrator.register_handler(knowledge_note_handler)
    orchestrator.register_handler(knowledge_index_handler)
    orchestrator.register_handler(knowledge_expand_handler)

    app.state.settings = settings
    app.state.http_client = http_client
    app.state.chat_service = chat_service
    app.state.goal_planning_service = goal_planning_service
    app.state.knowledge_note_service = knowledge_note_service
    app.state.knowledge_indexing_service = knowledge_indexing_service
    app.state.knowledge_query_service = knowledge_query_service
    app.state.knowledge_expansion_service = knowledge_expansion_service
    app.state.analytics_query_service = analytics_query_service
    app.state.orchestrator = orchestrator
    app.state.goal_create_agent_runtime = goal_create_agent_runtime
    app.state.knowledge_qa_agent_runtime = knowledge_qa_agent_runtime
    app.state.knowledge_generate_agent_runtime = knowledge_generate_agent_runtime

    logger.info(
        "AI service resources initialized | %s",
        compact_log(
            service_name=settings.service_name,
            version=settings.app_version,
            debug=settings.debug,
        ),
    )

    try:
        yield
    finally:
        await http_client.aclose()
        logger.info("AI service resources released")


def create_app() -> FastAPI:
    """Build a configured FastAPI application instance."""

    settings = get_settings()
    log_dir = configure_logging(settings)

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
    app.include_router(workflows.router)
    app.include_router(agents.router)
    register_exception_handlers(app)

    logger.info(
        "AI service application created | %s",
        compact_log(
            service_name=settings.service_name,
            version=settings.app_version,
            log_level=settings.log_level,
            log_dir=str(log_dir),
        ),
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
        "orchestrator": app.state.orchestrator,
        "goal_create_agent_runtime": app.state.goal_create_agent_runtime,
        "knowledge_qa_agent_runtime": app.state.knowledge_qa_agent_runtime,
        "knowledge_generate_agent_runtime": (
            app.state.knowledge_generate_agent_runtime
        ),
    }
