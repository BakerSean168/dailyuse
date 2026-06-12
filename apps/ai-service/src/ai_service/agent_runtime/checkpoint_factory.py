"""Factory functions for Agent checkpoint persistence strategies."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from langgraph.checkpoint.memory import InMemorySaver

from ai_service.agent_runtime.checkpoints import (
    AgentRunHistoryPort,
    AgentRunHistoryStore,
    FileBackedInMemorySaver,
)
from ai_service.agent_runtime.ts_checkpoint_adapter import TSCheckpointAdapter
from ai_service.agent_runtime.ts_checkpoint_client import TSCheckpointClient
from ai_service.config import Settings


def build_checkpointer(
    *,
    settings: Settings,
    name: str,
) -> InMemorySaver:
    """Create the configured Agent runtime checkpointer.

    Strategy:
    - "local": file-backed in-memory saver (for local development and spike)
    - "ts": delegates to TS checkpoint port via HTTP (production strategy)

    Note: The "ts" strategy still uses LangGraph's in-memory checkpointer for
    graph execution, but the run history store delegates to TS persistence.
    """
    strategy = settings.agent_checkpoint_strategy.lower()

    if strategy == "ts":
        # Production strategy: LangGraph uses in-memory checkpointer for execution,
        # and the runtime explicitly persists snapshots to TS checkpoint port.
        # This keeps graph execution fast while enabling cross-service recovery.
        return InMemorySaver()

    # Default strategy: file-backed for local development
    checkpoint_dir = settings.agent_checkpoint_dir
    if checkpoint_dir is None:
        return InMemorySaver()
    return FileBackedInMemorySaver(Path(checkpoint_dir) / f"{name}.pkl")


def build_run_history_store(
    *,
    settings: Settings,
    name: str,
    identity_id: str | None = None,
) -> AgentRunHistoryPort:
    """Create the configured Agent run history store.

    Strategy:
    - "local": file-backed JSON store (for local development and spike)
    - "ts": delegates to TS checkpoint port via HTTP (production strategy)

    When using "ts" strategy, identity_id must be provided at runtime.
    """
    strategy = settings.agent_checkpoint_strategy.lower()

    if strategy == "ts":
        if identity_id is None:
            raise ValueError(
                "identity_id is required when using 'ts' checkpoint strategy."
            )
        client = TSCheckpointClient(
            base_url=settings.ts_api_base_url,
            service_secret=settings.service_secret,
            identity_id=identity_id,
        )
        return TSCheckpointAdapter(client)

    # Default strategy: file-backed for local development
    checkpoint_dir = settings.agent_checkpoint_dir
    if checkpoint_dir is None:
        return AgentRunHistoryStore()
    return AgentRunHistoryStore(Path(checkpoint_dir) / f"{name}-runs.json")


def build_file_backed_saver(
    *,
    checkpoint_dir: str | Path | None,
    name: str,
) -> InMemorySaver:
    """Legacy factory for file-backed checkpointer.

    This function is kept for compatibility with existing code that doesn't
    yet use the settings-based factory. New code should use build_checkpointer.
    """
    if checkpoint_dir is None:
        return InMemorySaver()
    return FileBackedInMemorySaver(Path(checkpoint_dir) / f"{name}.pkl")


def build_file_backed_run_history_store(
    *,
    checkpoint_dir: str | Path | None,
    name: str,
) -> AgentRunHistoryStore:
    """Legacy factory for file-backed run history store.

    This function is kept for compatibility with existing code that doesn't
    yet use the settings-based factory. New code should use build_run_history_store.
    """
    if checkpoint_dir is None:
        return AgentRunHistoryStore()
    return AgentRunHistoryStore(Path(checkpoint_dir) / f"{name}-runs.json")
