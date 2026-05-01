from ai_service.orchestrator.models import WorkflowContext
from ai_service.orchestrator.orchestrator import WorkflowHandler
from ai_service.orchestrator.handlers.input_parsing import parse_provider_config
from ai_service.schemas.knowledge import KnowledgeNoteResponse
from ai_service.services.knowledge_note_service import KnowledgeNoteService


class KnowledgeNoteWorkflowHandler(WorkflowHandler):
    def __init__(self, knowledge_note_service: KnowledgeNoteService) -> None:
        self.knowledge_note_service = knowledge_note_service

    def can_handle(self, workflow_type: str) -> bool:
        return workflow_type == "knowledge-note"

    async def handle(self, context: WorkflowContext) -> KnowledgeNoteResponse:
        provider_config = parse_provider_config(context.input_data.get("provider_config"))

        return await self.knowledge_note_service.generate(
            topic=context.input_data.get("topic", ""),
            title=context.input_data.get("title"),
            provider_config=provider_config,
        )
