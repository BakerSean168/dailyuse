from ai_service.orchestrator.handlers.input_parsing import (
    parse_knowledge_resource_list,
    parse_provider_config,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.knowledge import (
    KnowledgeExpansionResponse,
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
        provider_config = parse_provider_config(
            context.input_data.get("provider_config")
        )
        related_resources = parse_knowledge_resource_list(
            context.input_data.get("related_resources")
        )

        return await self.knowledge_expansion_service.expand(
            instruction=context.input_data.get("instruction", ""),
            current_content=context.input_data.get("current_content"),
            related_resources=related_resources,
            provider_config=provider_config,
            max_citations=int(context.input_data.get("max_citations", 4)),
        )
