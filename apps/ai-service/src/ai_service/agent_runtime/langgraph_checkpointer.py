"""Persistent LangGraph checkpointer backed by the TS checkpoint API."""

from __future__ import annotations

import random
from collections.abc import AsyncIterator, Iterator, Sequence
from typing import Any

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    WRITES_IDX_MAP,
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    PendingWrite,
    get_checkpoint_id,
    get_checkpoint_metadata,
)

from ai_service.agent_runtime.ts_checkpoint_client import TSCheckpointClient


def _require_configurable(config: RunnableConfig) -> dict[str, Any]:
    configurable = config.get("configurable")
    if not isinstance(configurable, dict):
        raise ValueError("LangGraph checkpoint config must include 'configurable'.")
    return configurable


def _before_checkpoint_id(before: RunnableConfig | None) -> str | None:
    return get_checkpoint_id(before) if before is not None else None


class TSLangGraphCheckpointSaver(BaseCheckpointSaver[str]):
    """Persist full LangGraph checkpoints via the TS AI module boundary."""

    def __init__(
        self,
        client: TSCheckpointClient,
        *,
        agent_type: str,
    ) -> None:
        super().__init__()
        self.client = client
        self.agent_type = agent_type

    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        configurable = _require_configurable(config)
        payload = self.client.get_langgraph_checkpoint(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            checkpoint_id=get_checkpoint_id(config),
        )
        return self._record_to_tuple(payload)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        configurable = _require_configurable(config)
        payload = await self.client.aget_langgraph_checkpoint(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            checkpoint_id=get_checkpoint_id(config),
        )
        return self._record_to_tuple(payload)

    def list(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> Iterator[CheckpointTuple]:
        if config is None:
            raise ValueError(
                "TSLangGraphCheckpointSaver.list requires a thread-scoped config."
            )
        configurable = _require_configurable(config)

        rows = self.client.list_langgraph_checkpoints(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            before_checkpoint_id=_before_checkpoint_id(before),
            limit=limit,
        )
        for row in rows:
            checkpoint_tuple = self._record_to_tuple(row)
            if checkpoint_tuple is None:
                continue
            if filter and not all(
                checkpoint_tuple.metadata.get(key) == value
                for key, value in filter.items()
            ):
                continue
            yield checkpoint_tuple

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        if config is None:
            raise ValueError(
                "TSLangGraphCheckpointSaver.alist requires a thread-scoped config."
            )
        configurable = _require_configurable(config)

        rows = await self.client.alist_langgraph_checkpoints(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            before_checkpoint_id=_before_checkpoint_id(before),
            limit=limit,
        )
        for row in rows:
            checkpoint_tuple = self._record_to_tuple(row)
            if checkpoint_tuple is None:
                continue
            if filter and not all(
                checkpoint_tuple.metadata.get(key) == value
                for key, value in filter.items()
            ):
                continue
            yield checkpoint_tuple

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        del new_versions
        configurable = _require_configurable(config)
        checkpoint_ns = str(configurable.get("checkpoint_ns", ""))
        checkpoint_payload = self.serde.dumps_typed(checkpoint)
        metadata_payload = self.serde.dumps_typed(
            get_checkpoint_metadata(config, metadata)
        )
        self.client.put_langgraph_checkpoint(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=checkpoint_ns,
            checkpoint_id=checkpoint["id"],
            parent_checkpoint_id=(
                str(configurable["checkpoint_id"])
                if "checkpoint_id" in configurable
                and configurable["checkpoint_id"] is not None
                else None
            ),
            checkpoint=checkpoint_payload,
            metadata=metadata_payload,
        )
        return {
            "configurable": {
                "thread_id": str(configurable["thread_id"]),
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint["id"],
            }
        }

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        del new_versions
        configurable = _require_configurable(config)
        checkpoint_ns = str(configurable.get("checkpoint_ns", ""))
        checkpoint_payload = self.serde.dumps_typed(checkpoint)
        metadata_payload = self.serde.dumps_typed(
            get_checkpoint_metadata(config, metadata)
        )
        await self.client.aput_langgraph_checkpoint(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=checkpoint_ns,
            checkpoint_id=checkpoint["id"],
            parent_checkpoint_id=(
                str(configurable["checkpoint_id"])
                if "checkpoint_id" in configurable
                and configurable["checkpoint_id"] is not None
                else None
            ),
            checkpoint=checkpoint_payload,
            metadata=metadata_payload,
        )
        return {
            "configurable": {
                "thread_id": str(configurable["thread_id"]),
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint["id"],
            }
        }

    def put_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        configurable = _require_configurable(config)
        payload = [
            {
                "idx": WRITES_IDX_MAP.get(channel, idx),
                "channel": channel,
                "value": self.client.encode_typed_value(self.serde.dumps_typed(value)),
            }
            for idx, (channel, value) in enumerate(writes)
        ]
        self.client.put_langgraph_writes(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            checkpoint_id=str(configurable["checkpoint_id"]),
            task_id=task_id,
            task_path=task_path,
            writes=payload,
        )

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        configurable = _require_configurable(config)
        payload = [
            {
                "idx": WRITES_IDX_MAP.get(channel, idx),
                "channel": channel,
                "value": self.client.encode_typed_value(self.serde.dumps_typed(value)),
            }
            for idx, (channel, value) in enumerate(writes)
        ]
        await self.client.aput_langgraph_writes(
            agent_type=self.agent_type,
            thread_id=str(configurable["thread_id"]),
            checkpoint_ns=str(configurable.get("checkpoint_ns", "")),
            checkpoint_id=str(configurable["checkpoint_id"]),
            task_id=task_id,
            task_path=task_path,
            writes=payload,
        )

    def delete_thread(self, thread_id: str) -> None:
        self.client.delete_langgraph_thread(
            agent_type=self.agent_type,
            thread_id=thread_id,
            checkpoint_ns="",
        )

    async def adelete_thread(self, thread_id: str) -> None:
        await self.client.adelete_langgraph_thread(
            agent_type=self.agent_type,
            thread_id=thread_id,
            checkpoint_ns="",
        )

    def get_next_version(self, current: str | None, channel: None) -> str:
        del channel
        if current is None:
            current_v = 0
        elif isinstance(current, int):
            current_v = current
        else:
            current_v = int(current.split(".")[0])
        next_v = current_v + 1
        return f"{next_v:032}.{random.random():016}"

    def _record_to_tuple(
        self, payload: dict[str, Any] | None
    ) -> CheckpointTuple | None:
        if payload is None:
            return None

        checkpoint = self.serde.loads_typed(
            self.client.decode_typed_value(payload["checkpoint"])
        )
        metadata = self.serde.loads_typed(
            self.client.decode_typed_value(payload["metadata"])
        )
        pending_writes: list[PendingWrite] = []
        for write in payload.get("pendingWrites", []):
            pending_writes.append(
                (
                    str(write["taskId"]),
                    str(write["channel"]),
                    self.serde.loads_typed(
                        self.client.decode_typed_value(write["value"])
                    ),
                )
            )

        parent_checkpoint_id = payload.get("parentCheckpointId")
        checkpoint_ns = str(payload.get("checkpointNs", ""))
        thread_id = str(payload["threadId"])
        checkpoint_id = str(payload["checkpointId"])
        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            },
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=(
                {
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": parent_checkpoint_id,
                    }
                }
                if isinstance(parent_checkpoint_id, str) and parent_checkpoint_id
                else None
            ),
            pending_writes=pending_writes,
        )
