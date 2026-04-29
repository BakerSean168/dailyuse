from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.chat import ProviderConfig
from ai_service.schemas.knowledge import (
    KnowledgeExpansionResponse,
    KnowledgeResourceDocument,
)
from ai_service.services.knowledge_expansion_service import KnowledgeExpansionService


class KnowledgeExpandWorkflowHandler(WorkflowHandler):
    def __init__(
        self,
        knowledge_expansion_service: KnowledgeExpansionService,
    ) -> None:
        self.knowledge_expansion_service = knowledge_expansion_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "knowledge-expand"

    async def handle(self, context: WorkflowContext) -> KnowledgeExpansionResponse:
        provider_config_data = context.input_data.get("provider_config")
        provider_config = (
            ProviderConfig(**provider_config_data)
            if isinstance(provider_config_data, dict)
            else provider_config_data
        )
        related_resources = [
            KnowledgeResourceDocument(**item) if isinstance(item, dict) else item
            for item in context.input_data.get("related_resources", [])
        ]

        return await self.knowledge_expansion_service.expand(
            instruction=context.input_data.get("instruction", ""),
            current_content=context.input_data.get("current_content"),
            related_resources=related_resources,
            provider_config=provider_config,
            max_citations=int(context.input_data.get("max_citations", 4)),
        )
