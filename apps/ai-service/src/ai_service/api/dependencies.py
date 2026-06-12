"""Shared FastAPI dependency helpers.

FastAPI dependency functions are a convenient way to access request-scoped or
app-scoped objects without manually threading them through every function call.
"""

from __future__ import annotations

from typing import cast

from fastapi import Request

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
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
    """Read the experimental goal.create Agent runtime from app state."""

    return cast(GoalCreateAgentRuntime, request.app.state.goal_create_agent_runtime)


def get_knowledge_qa_agent_runtime(request: Request) -> KnowledgeQaAgentRuntime:
    """Read the experimental knowledge.qa Agent runtime from app state."""

    return cast(KnowledgeQaAgentRuntime, request.app.state.knowledge_qa_agent_runtime)


def get_knowledge_generate_agent_runtime(
    request: Request,
) -> KnowledgeGenerateAgentRuntime:
    """Read the experimental knowledge.generate Agent runtime from app state."""

    return cast(
        KnowledgeGenerateAgentRuntime,
        request.app.state.knowledge_generate_agent_runtime,
    )


def get_workflow_orchestrator(request: Request) -> AIWorkflowOrchestrator:
    """Read the shared workflow orchestrator from app state."""
    return cast(AIWorkflowOrchestrator, request.app.state.orchestrator)
