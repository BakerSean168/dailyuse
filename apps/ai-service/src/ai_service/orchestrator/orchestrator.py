import logging
from typing import Any, Protocol

from ai_service.logging_utils import compact_log
from ai_service.orchestrator.models import WorkflowContext

logger = logging.getLogger(__name__)

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
        logger.info(
            "workflow handler registered | %s",
            compact_log(
                handler_class=handler.__class__.__name__,
                total_handlers=len(self._handlers),
            ),
        )
        
    async def execute(self, context: WorkflowContext) -> Any:
        logger.info(
            "workflow execution started | %s",
            compact_log(
                request_id=context.request_id,
                workflow_type=context.workflow_type,
                handler_count=len(self._handlers),
            ),
        )
        for handler in self._handlers:
            if handler.can_handle(context.workflow_type):
                logger.info(
                    "workflow handler selected | %s",
                    compact_log(
                        request_id=context.request_id,
                        workflow_type=context.workflow_type,
                        handler_class=handler.__class__.__name__,
                    ),
                )
                result = await handler.handle(context)
                logger.info(
                    "workflow execution completed | %s",
                    compact_log(
                        request_id=context.request_id,
                        workflow_type=context.workflow_type,
                        handler_class=handler.__class__.__name__,
                        result_type=type(result).__name__,
                    ),
                )
                return result
                
        raise ValueError(f"No handler found for workflow type: {context.workflow_type}")
