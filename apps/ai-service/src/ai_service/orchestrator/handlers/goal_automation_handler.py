import logging

from ai_service.logging_utils import compact_log, preview_text, summarize_provider_config
from ai_service.orchestrator.handlers.input_parsing import parse_provider_config
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.goals import GoalAutomationResponse
from ai_service.services.goal_planning_service import GoalPlanningService

logger = logging.getLogger(__name__)

class GoalAutomationWorkflowHandler(WorkflowHandler):
    def __init__(self, goal_planning_service: GoalPlanningService) -> None:
        self.goal_planning_service = goal_planning_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "goal-automation"

    async def handle(self, context: WorkflowContext) -> GoalAutomationResponse:
        provider_config = parse_provider_config(context.input_data.get("provider_config"))

        logger.info(
            "goal automation handler dispatching request | %s",
            compact_log(
                request_id=context.request_id,
                workflow_type=context.workflow_type,
                idea_preview=preview_text(context.input_data.get("idea", "")),
                category=context.input_data.get("category"),
                timeframe=context.input_data.get("timeframe"),
                include_key_results=context.input_data.get("include_key_results", True),
                include_task_templates=context.input_data.get(
                    "include_task_templates",
                    True,
                ),
                related_resource_count=len(context.input_data.get("related_resources", [])),
                has_analytics_context=context.input_data.get("analytics_context") is not None,
                provider=summarize_provider_config(provider_config),
            ),
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
            request_id=context.request_id,
        )
