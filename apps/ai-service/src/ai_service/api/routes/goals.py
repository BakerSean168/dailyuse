"""Goal planning endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_service.api.dependencies import get_goal_planning_service
from ai_service.schemas import (
    GoalAutomationRequest,
    GoalAutomationResponse,
    GoalPlanningRequest,
    GoalPlanningResponse,
)
from ai_service.services import GoalPlanningService

router = APIRouter(prefix="/internal/goals", tags=["goals"])


@router.post("/plan", response_model=GoalPlanningResponse)
async def plan_goal(
    request: GoalPlanningRequest,
    goal_planning_service: GoalPlanningService = Depends(get_goal_planning_service),
) -> GoalPlanningResponse:
    """Generate a structured goal plan."""

    return await goal_planning_service.plan(
        idea=request.idea,
        category=request.category,
        timeframe=request.timeframe,
        include_key_results=request.include_key_results,
        provider_config=request.provider_config,
    )


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
