from typing import Any, Literal

from pydantic import BaseModel

WorkflowState = Literal[
    "clarification", "draft", "plan", "confirm", "execute", "result"
]


class WorkflowContext(BaseModel):
    request_id: str
    workflow_type: str
    input_data: dict[str, Any]
    state: WorkflowState | None = None
