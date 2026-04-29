from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.analytics import (
    AnalyticsQueryContext,
    AnalyticsQueryResponse,
)
from ai_service.schemas.chat import ProviderConfig
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

        provider_config = (
            ProviderConfig(**provider_config_data)
            if isinstance(provider_config_data, dict)
            else provider_config_data
        )
        analytics_context = (
            AnalyticsQueryContext(**context_data)
            if isinstance(context_data, dict)
            else context_data
        )

        return await self.analytics_query_service.query(
            question=question,
            context=analytics_context,
            provider_config=provider_config,
        )
