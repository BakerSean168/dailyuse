"""Factory functions for Agent checkpoint persistence strategies."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import InMemorySaver

from ai_service.agent_runtime.checkpoints import (
    AgentRunHistoryPort,
    AgentRunHistoryStore,
    FileBackedInMemorySaver,
)
from ai_service.agent_runtime.langgraph_checkpointer import TSLangGraphCheckpointSaver
from ai_service.agent_runtime.ts_checkpoint_adapter import TSCheckpointAdapter
from ai_service.agent_runtime.ts_checkpoint_client import TSCheckpointClient
from ai_service.config import Settings


def _runtime_name_to_agent_type(name: str) -> str:
    mapping = {
        "goal-create": "goal.create",
        "knowledge-qa": "knowledge.qa",
        "knowledge-generate": "knowledge.generate",
    }
    try:
        return mapping[name]
    except KeyError as exc:
        raise ValueError(
            f"Unsupported agent runtime name for checkpoints: {name}"
        ) from exc


def build_checkpointer(
    *,
    settings: Settings,
    name: str,
    identity_id: str | None = None,
) -> BaseCheckpointSaver[Any]:
    """Create the configured Agent runtime checkpointer.

    Strategy:
    - "local": file-backed in-memory saver (for local development and spike)
    - "ts": delegates to TS checkpoint port via HTTP (production strategy)

    """
    strategy = settings.agent_checkpoint_strategy.lower()

    if strategy == "ts":
        if identity_id is None:
            raise ValueError(
                "identity_id is required when using 'ts' checkpoint strategy."
            )
        return TSLangGraphCheckpointSaver(
            TSCheckpointClient(
                base_url=settings.ts_api_base_url,
                service_secret=settings.service_secret,
                identity_id=identity_id,
                agent_type=_runtime_name_to_agent_type(name),
            ),
            agent_type=_runtime_name_to_agent_type(name),
        )

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
        agent_type = _runtime_name_to_agent_type(name)
        client = TSCheckpointClient(
            base_url=settings.ts_api_base_url,
            service_secret=settings.service_secret,
            identity_id=identity_id,
            agent_type=agent_type,
        )
        return TSCheckpointAdapter(client, agent_type=agent_type)

    # Default strategy: file-backed for local development
    checkpoint_dir = settings.agent_checkpoint_dir
    if checkpoint_dir is None:
        return AgentRunHistoryStore()
    return AgentRunHistoryStore(Path(checkpoint_dir) / f"{name}-runs.json")

