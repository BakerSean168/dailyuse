"""Shared FastAPI dependency helpers.

FastAPI dependency functions are a convenient way to access request-scoped or
app-scoped objects without manually threading them through every function call.
"""

from __future__ import annotations

from typing import cast

from fastapi import HTTPException, Request

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
)
from ai_service.agent_runtime.checkpoint_factory import (
    build_checkpointer,
    build_run_history_store,
)
from ai_service.config import Settings
from ai_service.orchestrator.orchestrator import AIWorkflowOrchestrator
from ai_service.services import (
    AnalyticsQueryService,
    ChatService,
    GoalPlanningService,
    KnowledgeExpansionService,
    KnowledgeIndexingService,
    KnowledgeNoteService,
    KnowledgeQueryService,
)


def get_settings_dependency(request: Request) -> Settings:
    """Read the already-initialized settings object from app state."""

    return cast(Settings, request.app.state.settings)


def get_chat_service(request: Request) -> ChatService:
    """Read the shared chat service from app state."""

    return cast(ChatService, request.app.state.chat_service)


def get_goal_planning_service(request: Request) -> GoalPlanningService:
    """Read the shared goal planning service from app state."""

    return cast(GoalPlanningService, request.app.state.goal_planning_service)


def get_knowledge_note_service(request: Request) -> KnowledgeNoteService:
    """Read the shared knowledge note service from app state."""

    return cast(KnowledgeNoteService, request.app.state.knowledge_note_service)


def get_knowledge_indexing_service(request: Request) -> KnowledgeIndexingService:
    """Read the shared knowledge indexing service from app state."""

    return cast(KnowledgeIndexingService, request.app.state.knowledge_indexing_service)


def get_knowledge_query_service(request: Request) -> KnowledgeQueryService:
    """Read the shared knowledge query service from app state."""

    return cast(KnowledgeQueryService, request.app.state.knowledge_query_service)


def get_knowledge_expansion_service(request: Request) -> KnowledgeExpansionService:
    """Read the shared knowledge expansion service from app state."""

    return cast(
        KnowledgeExpansionService,
        request.app.state.knowledge_expansion_service,
    )


def get_analytics_query_service(request: Request) -> AnalyticsQueryService:
    """Read the shared analytics query service from app state."""

    return cast(AnalyticsQueryService, request.app.state.analytics_query_service)


def get_goal_create_agent_runtime(request: Request) -> GoalCreateAgentRuntime:
    """Get the goal.create Agent runtime.

    For 'local' strategy: returns the app-scoped singleton runtime.
    For 'ts' strategy: constructs an identity-aware runtime per request.
    """
    settings = get_settings_dependency(request)

    if settings.agent_checkpoint_strategy.lower() == "ts":
        # ts strategy: construct identity-aware runtime per request
        identity_id = request.headers.get("X-Identity-Id")
        if not identity_id:
            raise HTTPException(
                status_code=400,
                detail="X-Identity-Id header is required for ts checkpoint strategy",
            )

        goal_planning_service = get_goal_planning_service(request)

        return GoalCreateAgentRuntime(
            checkpointer=build_checkpointer(
                settings=settings,
                name="goal-create",
                identity_id=identity_id,
            ),
            run_history=build_run_history_store(
                settings=settings,
                name="goal-create",
                identity_id=identity_id,
            ),
            goal_planning_service=goal_planning_service,
        )

    # local strategy: use app-scoped singleton
    return cast(GoalCreateAgentRuntime, request.app.state.goal_create_agent_runtime)


def get_knowledge_qa_agent_runtime(request: Request) -> KnowledgeQaAgentRuntime:
    """Get the knowledge.qa Agent runtime.

    For 'local' strategy: returns the app-scoped singleton runtime.
    For 'ts' strategy: constructs an identity-aware runtime per request.
    """
    settings = get_settings_dependency(request)

    if settings.agent_checkpoint_strategy.lower() == "ts":
        # ts strategy: construct identity-aware runtime per request
        identity_id = request.headers.get("X-Identity-Id")
        if not identity_id:
            raise HTTPException(
                status_code=400,
                detail="X-Identity-Id header is required for ts checkpoint strategy",
            )

        return KnowledgeQaAgentRuntime(
            checkpointer=build_checkpointer(
                settings=settings,
                name="knowledge-qa",
                identity_id=identity_id,
            ),
            run_history=build_run_history_store(
                settings=settings,
                name="knowledge-qa",
                identity_id=identity_id,
            ),
        )

    # local strategy: use app-scoped singleton
    return cast(KnowledgeQaAgentRuntime, request.app.state.knowledge_qa_agent_runtime)


def get_knowledge_generate_agent_runtime(
    request: Request,
) -> KnowledgeGenerateAgentRuntime:
    """Get the knowledge.generate Agent runtime.

    For 'local' strategy: returns the app-scoped singleton runtime.
    For 'ts' strategy: constructs an identity-aware runtime per request.
    """
    settings = get_settings_dependency(request)

    if settings.agent_checkpoint_strategy.lower() == "ts":
        # ts strategy: construct identity-aware runtime per request
        identity_id = request.headers.get("X-Identity-Id")
        if not identity_id:
            raise HTTPException(
                status_code=400,
                detail="X-Identity-Id header is required for ts checkpoint strategy",
            )

        knowledge_note_service = get_knowledge_note_service(request)
        knowledge_query_service = get_knowledge_query_service(request)

        return KnowledgeGenerateAgentRuntime(
            checkpointer=build_checkpointer(
                settings=settings,
                name="knowledge-generate",
                identity_id=identity_id,
            ),
            run_history=build_run_history_store(
                settings=settings,
                name="knowledge-generate",
                identity_id=identity_id,
            ),
            knowledge_note_service=knowledge_note_service,
            knowledge_query_service=knowledge_query_service,
        )

    # local strategy: use app-scoped singleton
    return cast(
        KnowledgeGenerateAgentRuntime,
        request.app.state.knowledge_generate_agent_runtime,
    )


def get_workflow_orchestrator(request: Request) -> AIWorkflowOrchestrator:
    """Read the shared workflow orchestrator from app state."""
    return cast(AIWorkflowOrchestrator, request.app.state.orchestrator)
