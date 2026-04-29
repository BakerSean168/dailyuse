from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas import (
    IndexedKnowledgeResource,
    KnowledgeQueryResponse,
)
from ai_service.schemas.chat import ProviderConfig
from ai_service.services.knowledge_query_service import KnowledgeQueryService


class KnowledgeWorkflowHandler(WorkflowHandler):
    def __init__(self, knowledge_query_service: KnowledgeQueryService) -> None:
        self.knowledge_query_service = knowledge_query_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "knowledge"

    async def handle(self, context: WorkflowContext) -> KnowledgeQueryResponse:
        question = context.input_data.get("question", "")
        indexed_resources_data = context.input_data.get("indexed_resources", [])
        provider_config_data = context.input_data.get("provider_config")
        max_citations = int(context.input_data.get("max_citations", 3))

        provider_config = (
            ProviderConfig(**provider_config_data)
            if isinstance(provider_config_data, dict)
            else provider_config_data
        )
        indexed_resources = [
            IndexedKnowledgeResource(**item)
            if isinstance(item, dict)
            else item
            for item in indexed_resources_data
        ]

        return await self.knowledge_query_service.query(
            question=question,
            indexed_resources=indexed_resources,
            provider_config=provider_config,
            max_citations=max_citations,
        )
