from typing import Any, Protocol
from ai_service.orchestrator.models import WorkflowContext

class WorkflowHandler(Protocol):
    def can_handle(self, workflow_type: str) -> bool:
        ...
        
    async def handle(self, context: WorkflowContext) -> Any:
        ...

class AIWorkflowOrchestrator:
    def __init__(self) -> None:
        self._handlers: list[WorkflowHandler] = []
        
    def register_handler(self, handler: WorkflowHandler) -> None:
        self._handlers.append(handler)
        
    async def execute(self, context: WorkflowContext) -> Any:
        for handler in self._handlers:
            if handler.can_handle(context.workflow_type):
                return await handler.handle(context)
                
        raise ValueError(f"No handler found for workflow type: {context.workflow_type}")
