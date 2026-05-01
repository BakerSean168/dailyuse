from pydantic import BaseModel, model_validator


class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: dict
    read_only: bool
    requires_confirmation: bool

    @model_validator(mode="after")
    def validate_side_effect(self) -> "ToolDefinition":
        if not self.read_only and not self.requires_confirmation:
            raise ValueError("requires_confirmation must be True for side-effect tools")
        return self


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> ToolDefinition:
        if name not in self._tools:
            raise KeyError(f"Tool {name} not found")
        return self._tools[name]

    def has_tool(self, name: str) -> bool:
        return name in self._tools
