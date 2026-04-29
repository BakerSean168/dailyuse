"""Unified workflow endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import get_workflow_orchestrator
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import AIWorkflowOrchestrator
from ai_service.schemas import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    GoalAutomationRequest,
    GoalAutomationResponse,
    GoalPlanningRequest,
    GoalPlanningResponse,
    KnowledgeExpansionRequest,
    KnowledgeExpansionResponse,
    KnowledgeIndexResourceRequest,
    KnowledgeIndexResourceResponse,
    KnowledgeNoteRequest,
    KnowledgeNoteResponse,
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
)

router = APIRouter(prefix="/internal/workflows", tags=["workflows"])


@router.post("/goal", response_model=GoalPlanningResponse)
async def run_goal_workflow(
    request: GoalPlanningRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> GoalPlanningResponse:
    """Run the goal workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="goal",
            input_data=request.model_dump(),
        )
    )


@router.post("/goal-automation", response_model=GoalAutomationResponse)
async def run_goal_automation_workflow(
    request: GoalAutomationRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> GoalAutomationResponse:
    """Run the goal automation workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="goal-automation",
            input_data=request.model_dump(),
        )
    )


@router.post("/analytics", response_model=AnalyticsQueryResponse)
async def run_analytics_workflow(
    request: AnalyticsQueryRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> AnalyticsQueryResponse:
    """Run the analytics workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="analytics",
            input_data=request.model_dump(),
        )
    )


@router.post("/knowledge", response_model=KnowledgeQueryResponse)
async def run_knowledge_workflow(
    request: KnowledgeQueryRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> KnowledgeQueryResponse:
    """Run the knowledge query workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="knowledge",
            input_data=request.model_dump(),
        )
    )


@router.post("/knowledge-note", response_model=KnowledgeNoteResponse)
async def run_knowledge_note_workflow(
    request: KnowledgeNoteRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> KnowledgeNoteResponse:
    """Run the knowledge note workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="knowledge-note",
            input_data=request.model_dump(),
        )
    )


@router.post("/knowledge-index", response_model=KnowledgeIndexResourceResponse)
async def run_knowledge_index_workflow(
    request: KnowledgeIndexResourceRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> KnowledgeIndexResourceResponse:
    """Run the knowledge indexing workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id="unknown",
            workflow_type="knowledge-index",
            input_data=request.model_dump(),
        )
    )


@router.post("/knowledge-expand", response_model=KnowledgeExpansionResponse)
async def run_knowledge_expand_workflow(
    request: KnowledgeExpansionRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> KnowledgeExpansionResponse:
    """Run the knowledge expansion workflow through the unified orchestrator."""

    return await orchestrator.execute(
        WorkflowContext(
            request_id=request.request_id or "unknown",
            workflow_type="knowledge-expand",
            input_data=request.model_dump(),
        )
    )
