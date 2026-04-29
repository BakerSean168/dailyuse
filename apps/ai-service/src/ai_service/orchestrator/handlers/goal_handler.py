from typing import Any
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.goals import GoalPlanningResponse
from ai_service.services.goal_planning_service import GoalPlanningService

class GoalWorkflowHandler(WorkflowHandler):
    def __init__(self, goal_planning_service: GoalPlanningService) -> None:
        self.goal_planning_service = goal_planning_service
        
    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "goal"
        
    async def handle(self, context: WorkflowContext) -> GoalPlanningResponse:
        idea = context.input_data.get("idea", "")
        category = context.input_data.get("category")
        timeframe = context.input_data.get("timeframe")
        include_key_results = context.input_data.get("include_key_results", True)
        provider_config_data = context.input_data.get("provider_config")
        
        if isinstance(provider_config_data, dict):
            from ai_service.schemas.chat import ProviderConfig
            provider_config = ProviderConfig(**provider_config_data)
        else:
            provider_config = provider_config_data
            
        enable_clarification = context.input_data.get("enable_clarification", True)
        clarification_answers = context.input_data.get("clarification_answers")

        return await self.goal_planning_service.plan_with_clarification(
            idea=idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            provider_config=provider_config,
            enable_clarification=enable_clarification,
            clarification_answers=clarification_answers
        )
