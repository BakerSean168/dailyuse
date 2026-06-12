"""Agent event projection helpers."""

from __future__ import annotations

from typing import Any

from ai_service.schemas import AgentEvent
from ai_service.schemas.agent import AgentEventType


def append_agent_event(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    event_type: AgentEventType,
    created_at: int,
    data: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Append one validated AgentEvent to a graph state event list."""

    sequence = len(events)
    event = AgentEvent(
        eventId=f"{run_id}:{sequence}",
        runId=run_id,
        sequence=sequence,
        type=event_type,
        createdAt=created_at,
        data=data or {},
    )
    return [*events, event.model_dump(by_alias=True)]


def append_node_started_event(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    node: str,
    created_at: int,
) -> list[dict[str, Any]]:
    """Append a node.started AgentEvent."""

    return append_agent_event(
        events,
        run_id=run_id,
        event_type="node.started",
        created_at=created_at,
        data={"node": node},
    )


def append_node_completed_event(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    node: str,
    created_at: int,
    started_at: int | None = None,
) -> list[dict[str, Any]]:
    """Append a node.completed AgentEvent."""

    data: dict[str, Any] = {"node": node}
    if started_at is not None:
        data["durationMs"] = max(0, created_at - started_at)

    return append_agent_event(
        events,
        run_id=run_id,
        event_type="node.completed",
        created_at=created_at,
        data=data,
    )


def append_tool_started_event(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    tool: str,
    created_at: int,
    data: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Append a tool.started AgentEvent."""

    return append_agent_event(
        events,
        run_id=run_id,
        event_type="tool.started",
        created_at=created_at,
        data={"tool": tool, **(data or {})},
    )


def append_tool_completed_event(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    tool: str,
    created_at: int,
    started_at: int | None = None,
    data: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Append a tool.completed AgentEvent."""

    event_data: dict[str, Any] = {"tool": tool, **(data or {})}
    if started_at is not None:
        event_data["durationMs"] = max(0, created_at - started_at)
    return append_agent_event(
        events,
        run_id=run_id,
        event_type="tool.completed",
        created_at=created_at,
        data=event_data,
    )


def append_tool_lifecycle_events(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    tool: str,
    created_at: int,
    completed_at: int | None = None,
    started_data: dict[str, Any] | None = None,
    completed_data: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Append the basic started/completed lifecycle pair for one tool call."""

    completed_at = completed_at if completed_at is not None else created_at
    return append_tool_completed_event(
        append_tool_started_event(
            events,
            run_id=run_id,
            tool=tool,
            created_at=created_at,
            data=started_data,
        ),
        run_id=run_id,
        tool=tool,
        created_at=completed_at,
        started_at=created_at,
        data=completed_data,
    )


def append_node_lifecycle_events(
    events: list[dict[str, Any]],
    *,
    run_id: str,
    node: str,
    created_at: int,
    completed_at: int | None = None,
) -> list[dict[str, Any]]:
    """Append the basic started/completed lifecycle pair for one graph node."""

    completed_at = completed_at if completed_at is not None else created_at
    return append_node_completed_event(
        append_node_started_event(
            events,
            run_id=run_id,
            node=node,
            created_at=created_at,
        ),
        run_id=run_id,
        node=node,
        created_at=completed_at,
        started_at=created_at,
    )
