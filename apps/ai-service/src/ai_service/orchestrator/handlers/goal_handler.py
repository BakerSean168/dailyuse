import logging

from ai_service.logging_utils import (
    compact_log,
    preview_text,
    summarize_provider_config,
)
from ai_service.orchestrator.handlers.input_parsing import parse_provider_config
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.goals import GoalPlanningResponse
from ai_service.services.goal_planning_service import GoalPlanningService

logger = logging.getLogger(__name__)


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
        provider_config = parse_provider_config(
            context.input_data.get("provider_config")
        )

        enable_clarification = context.input_data.get("enable_clarification", True)
        clarification_answers = context.input_data.get("clarification_answers")

        logger.info(
            "goal workflow handler dispatching request | %s",
            compact_log(
                request_id=context.request_id,
                workflow_type=context.workflow_type,
                idea_preview=preview_text(idea),
                category=category,
                timeframe=timeframe,
                include_key_results=include_key_results,
                enable_clarification=enable_clarification,
                clarification_answers_count=len(clarification_answers or []),
                provider=summarize_provider_config(provider_config),
            ),
        )

        return await self.goal_planning_service.plan_with_clarification(
            idea=idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            provider_config=provider_config,
            enable_clarification=enable_clarification,
            clarification_answers=clarification_answers,
            request_id=context.request_id,
        )
