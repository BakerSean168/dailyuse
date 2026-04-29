from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.schemas.chat import ProviderConfig
from ai_service.schemas.knowledge import KnowledgeNoteResponse
from ai_service.services.knowledge_note_service import KnowledgeNoteService


class KnowledgeNoteWorkflowHandler(WorkflowHandler):
    def __init__(self, knowledge_note_service: KnowledgeNoteService) -> None:
        self.knowledge_note_service = knowledge_note_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "knowledge-note"

    async def handle(self, context: WorkflowContext) -> KnowledgeNoteResponse:
        provider_config_data = context.input_data.get("provider_config")
        provider_config = (
            ProviderConfig(**provider_config_data)
            if isinstance(provider_config_data, dict)
            else provider_config_data
        )

        return await self.knowledge_note_service.generate(
            topic=context.input_data.get("topic", ""),
            title=context.input_data.get("title"),
            provider_config=provider_config,
        )
