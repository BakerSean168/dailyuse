from ai_service.orchestrator.handlers.input_parsing import (
    parse_knowledge_resource,
    parse_optional_provider_config,
)
from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.knowledge import (
    KnowledgeIndexResourceResponse,
)
from ai_service.services.knowledge_query_service import KnowledgeIndexingService


class KnowledgeIndexWorkflowHandler(WorkflowHandler):
    def __init__(self, knowledge_indexing_service: KnowledgeIndexingService) -> None:
        self.knowledge_indexing_service = knowledge_indexing_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "knowledge-index"

    async def handle(self, context: WorkflowContext) -> KnowledgeIndexResourceResponse:
        resource_data = context.input_data.get("resource")
        provider_config = parse_optional_provider_config(
            context.input_data.get("provider_config")
        )
        resource = parse_knowledge_resource(resource_data)

        indexed_resource = await self.knowledge_indexing_service.index_resource_async(
            resource,
            provider_config=provider_config,
            max_chunk_chars=int(context.input_data.get("max_chunk_chars", 1200)),
            overlap_chars=int(context.input_data.get("overlap_chars", 150)),
        )
        return KnowledgeIndexResourceResponse(indexed_resource=indexed_resource)
