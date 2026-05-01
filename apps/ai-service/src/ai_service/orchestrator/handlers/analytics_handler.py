from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.orchestrator.handlers.input_parsing import (
    parse_provider_config,
    parse_required_model,
)
from ai_service.schemas.analytics import (
    AnalyticsQueryContext,
    AnalyticsQueryResponse,
)
from ai_service.services.analytics_query_service import AnalyticsQueryService


class AnalyticsWorkflowHandler(WorkflowHandler):
    def __init__(self, analytics_query_service: AnalyticsQueryService) -> None:
        self.analytics_query_service = analytics_query_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "analytics"

    async def handle(self, context: WorkflowContext) -> AnalyticsQueryResponse:
        question = context.input_data.get("question", "")
        context_data = context.input_data.get("context", {})
        provider_config_data = context.input_data.get("provider_config")

        provider_config = parse_provider_config(provider_config_data)
        analytics_context = parse_required_model(
            context_data, AnalyticsQueryContext, "context"
        )

        return await self.analytics_query_service.query(
            question=question,
            context=analytics_context,
            provider_config=provider_config,
        )
