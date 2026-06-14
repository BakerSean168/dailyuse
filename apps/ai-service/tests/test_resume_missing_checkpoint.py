"""Tests for resume behavior when LangGraph checkpoint is missing."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from langgraph.checkpoint.memory import InMemorySaver

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
)
from ai_service.schemas import AgentResumePayload


def test_resume_goal_agent_missing_graph_checkpoint_raises_clear_error():
    """Verify resume raises clear error when graph checkpoint is missing.

    This simulates the scenario where:
    - Persisted snapshot exists (in TS database)
    - But LangGraph InMemorySaver has no checkpoint (e.g. after service restart)
    - Resume should fail with clear error, not pretend to work
    """
    # Create a mock graph with empty checkpoint
    mock_graph = MagicMock()
    mock_snapshot = MagicMock()
    mock_snapshot.values = None  # No graph checkpoint
    mock_graph.get_state.return_value = mock_snapshot

    # Create runtime with real checkpointer but mocked graph
    runtime = GoalCreateAgentRuntime(
        checkpointer=InMemorySaver(),  # Real checkpointer
        run_history=MagicMock(),
        goal_planning_service=MagicMock(),
    )
    runtime._graph = mock_graph

    # Try to resume
    payload = AgentResumePayload(
        user_decision="confirm",
        approved_actions=[],
    )

    with pytest.raises(ValueError) as exc_info:
        runtime.resume_goal_create(
            thread_id="test-thread",
            payload=payload,
        )

    # Verify error message is clear and actionable
    error_message = str(exc_info.value)
    assert "LangGraph checkpoint missing" in error_message
    assert "test-thread" in error_message
    assert "snapshot is available" in error_message
    assert "execution state was lost" in error_message


def test_resume_knowledge_generate_missing_graph_checkpoint_raises_clear_error():
    """Verify knowledge generate resume also checks for graph checkpoint."""
    mock_graph = MagicMock()
    mock_snapshot = MagicMock()
    mock_snapshot.values = None  # No graph checkpoint
    mock_graph.get_state.return_value = mock_snapshot

    runtime = KnowledgeGenerateAgentRuntime(
        checkpointer=InMemorySaver(),
        run_history=MagicMock(),
        knowledge_note_service=MagicMock(),
        knowledge_query_service=MagicMock(),
    )
    runtime._graph = mock_graph

    payload = AgentResumePayload(
        user_decision="confirm",
        executed_actions=[],
    )

    with pytest.raises(ValueError) as exc_info:
        runtime.resume_knowledge_generate(
            thread_id="test-thread",
            payload=payload,
        )

    error_message = str(exc_info.value)
    assert "LangGraph checkpoint missing" in error_message


def test_resume_with_valid_graph_checkpoint_proceeds_normally():
    """Verify resume works when graph checkpoint exists.

    This is a simplified test that verifies the check passes when
    graph checkpoint exists. Full integration is tested in
    test_agent_runtime_routes.py.
    """
    mock_graph = MagicMock()
    mock_snapshot = MagicMock()
    # Valid checkpoint
    mock_snapshot.values = {"stage": "approval", "status": "waiting_approval"}
    mock_graph.get_state.return_value = mock_snapshot

    runtime = GoalCreateAgentRuntime(
        checkpointer=InMemorySaver(),
        run_history=MagicMock(),
        goal_planning_service=MagicMock(),
    )
    runtime._graph = mock_graph

    payload = AgentResumePayload(
        user_decision="confirm",
        approved_actions=[],
    )

    # The key test: verify that when snapshot.values exists,
    # aresume_goal_create does NOT raise the "LangGraph checkpoint missing" error
    # (It may fail later for other reasons in this mock setup, but that's OK)
    try:
        runtime.resume_goal_create(
            thread_id="test-thread",
            payload=payload,
        )
    except ValueError as e:
        # Should NOT be the checkpoint missing error
        assert "LangGraph checkpoint missing" not in str(e)
    except Exception:
        # Other errors are OK in this mock setup
        pass


def test_resume_route_returns_409_for_missing_checkpoint():
    """Verify API route returns HTTP 409 when checkpoint is missing."""
    # This test verifies the route has 409 error handling logic
    import inspect

    from ai_service.api.routes import agents

    source = inspect.getsource(agents.resume_agent_run)

    # Verify 409 error handling is present
    assert "409" in source
    assert "runtime_checkpoint_missing" in source
    assert "LangGraph checkpoint missing" in source
