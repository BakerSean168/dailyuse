import pytest

from ai_service.orchestrator.registry import ToolDefinition, ToolRegistry


def test_tool_registry_registration():
    registry = ToolRegistry()
    registry.register(
        ToolDefinition(
            name="search_notes",
            description="Search knowledge notes",
            input_schema={
                "type": "object",
                "properties": {"query": {"type": "string"}},
            },
            read_only=True,
            requires_confirmation=False,
        )
    )

    assert registry.has_tool("search_notes")
    tool = registry.get_tool("search_notes")
    assert tool.name == "search_notes"
    assert tool.read_only is True


def test_tool_registry_side_effect_validation():
    # Tools that are not read-only MUST require confirmation
    with pytest.raises(
        ValueError, match="requires_confirmation must be True for side-effect tools"
    ):
        ToolDefinition(
            name="create_goal",
            description="Create a goal",
            input_schema={"type": "object"},
            read_only=False,
            requires_confirmation=False,
        )


def test_get_nonexistent_tool():
    registry = ToolRegistry()
    with pytest.raises(KeyError):
        registry.get_tool("nonexistent")
