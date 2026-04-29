from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.goals import GoalAutomationResponse
from ai_service.schemas.chat import ProviderConfig
from ai_service.services.goal_planning_service import GoalPlanningService


class GoalAutomationWorkflowHandler(WorkflowHandler):
    def __init__(self, goal_planning_service: GoalPlanningService) -> None:
        self.goal_planning_service = goal_planning_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "goal-automation"

    async def handle(self, context: WorkflowContext) -> GoalAutomationResponse:
        provider_config_data = context.input_data.get("provider_config")
        provider_config = (
            ProviderConfig(**provider_config_data)
            if isinstance(provider_config_data, dict)
            else provider_config_data
        )

        return await self.goal_planning_service.plan_automation(
            idea=context.input_data.get("idea", ""),
            category=context.input_data.get("category"),
            timeframe=context.input_data.get("timeframe"),
            include_key_results=context.input_data.get("include_key_results", True),
            include_task_templates=context.input_data.get(
                "include_task_templates",
                True,
            ),
            related_resources=context.input_data.get("related_resources", []),
            analytics_context=context.input_data.get("analytics_context"),
            provider_config=provider_config,
        )
