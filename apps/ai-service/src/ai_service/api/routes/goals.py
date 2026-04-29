"""Goal planning endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import get_goal_planning_service, get_workflow_orchestrator
from ai_service.schemas import (
    GoalAutomationRequest,
    GoalAutomationResponse,
    GoalPlanningRequest,
    GoalPlanningResponse,
)
from ai_service.services import GoalPlanningService
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import AIWorkflowOrchestrator

router = APIRouter(prefix="/internal/goals", tags=["goals"])


@router.post("/plan", response_model=GoalPlanningResponse)
async def plan_goal(
    request: GoalPlanningRequest,
    orchestrator: AIWorkflowOrchestrator = Depends(get_workflow_orchestrator),
) -> GoalPlanningResponse:
    """Generate a structured goal plan via the unified orchestrator."""

    context = WorkflowContext(
        request_id=request.request_id or "unknown",
        workflow_type="goal",
        input_data=request.model_dump()
    )
    return await orchestrator.execute(context)


@router.post("/plan-actions", response_model=GoalAutomationResponse)
async def plan_goal_actions(
    request: GoalAutomationRequest,
    goal_planning_service: GoalPlanningService = Depends(get_goal_planning_service),
) -> GoalAutomationResponse:
    """Generate a goal automation plan with explicit tool calls."""

    return await goal_planning_service.plan_automation(
        idea=request.idea,
        category=request.category,
        timeframe=request.timeframe,
        include_key_results=request.include_key_results,
        include_task_templates=request.include_task_templates,
        provider_config=request.provider_config,
    )
