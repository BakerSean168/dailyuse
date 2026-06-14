"""Tests for persistent LangGraph checkpoint persistence."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import pytest
from langgraph.checkpoint.base import empty_checkpoint

from ai_service.agent_runtime.langgraph_checkpointer import (
    TSLangGraphCheckpointSaver,
)
from ai_service.agent_runtime.runtime import GoalCreateAgentRuntime
from ai_service.schemas import AgentResumePayload


class FakeTSCheckpointClient:
    def __init__(self) -> None:
        self.checkpoints: dict[tuple[str, str, str], dict[str, Any]] = {}
        self.writes: defaultdict[tuple[str, str, str], list[dict[str, Any]]] = (
            defaultdict(list)
        )

    @staticmethod
    def encode_typed_value(value: tuple[str, bytes]) -> dict[str, str]:
        from base64 import b64encode

        return {
            "type": value[0],
            "data": b64encode(value[1]).decode("ascii"),
        }

    @staticmethod
    def decode_typed_value(payload: dict[str, Any]) -> tuple[str, bytes]:
        from base64 import b64decode

        return str(payload["type"]), b64decode(str(payload["data"]).encode("ascii"))

    def put_langgraph_checkpoint(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        checkpoint_id: str,
        parent_checkpoint_id: str | None,
        checkpoint: tuple[str, bytes],
        metadata: tuple[str, bytes],
        request_id: str | None = None,
    ) -> None:
        del request_id
        self.checkpoints[(thread_id, checkpoint_ns, checkpoint_id)] = {
            "identityId": "identity-1",
            "agentType": agent_type or "goal.create",
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
            "checkpointId": checkpoint_id,
            "parentCheckpointId": parent_checkpoint_id,
            "checkpoint": self.encode_typed_value(checkpoint),
            "metadata": self.encode_typed_value(metadata),
            "createdAt": "2026-06-13T00:00:00Z",
        }

    async def aput_langgraph_checkpoint(self, **kwargs: Any) -> None:
        self.put_langgraph_checkpoint(**kwargs)

    def get_langgraph_checkpoint(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        checkpoint_id: str | None,
        request_id: str | None = None,
    ) -> dict[str, Any] | None:
        del request_id, agent_type
        key = None
        if checkpoint_id is not None:
            key = (thread_id, checkpoint_ns, checkpoint_id)
        else:
            matching = [
                checkpoint_key
                for checkpoint_key in self.checkpoints
                if checkpoint_key[0] == thread_id and checkpoint_key[1] == checkpoint_ns
            ]
            if matching:
                key = max(matching, key=lambda item: item[2])
        if key is None or key not in self.checkpoints:
            return None
        payload = dict(self.checkpoints[key])
        payload["pendingWrites"] = sorted(
            self.writes[key],
            key=lambda item: (item["taskId"], item["idx"], item["createdAt"]),
        )
        return payload

    async def aget_langgraph_checkpoint(self, **kwargs: Any) -> dict[str, Any] | None:
        return self.get_langgraph_checkpoint(**kwargs)

    def list_langgraph_checkpoints(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        before_checkpoint_id: str | None = None,
        limit: int | None = None,
        request_id: str | None = None,
    ) -> list[dict[str, Any]]:
        del agent_type, request_id
        rows = []
        for key, value in self.checkpoints.items():
            if key[0] != thread_id or key[1] != checkpoint_ns:
                continue
            if before_checkpoint_id is not None and key[2] >= before_checkpoint_id:
                continue
            row = dict(value)
            row["pendingWrites"] = sorted(
                self.writes[key],
                key=lambda item: (item["taskId"], item["idx"], item["createdAt"]),
            )
            rows.append(row)
        rows.sort(key=lambda item: item["checkpointId"], reverse=True)
        if limit is not None:
            return rows[:limit]
        return rows

    async def alist_langgraph_checkpoints(self, **kwargs: Any) -> list[dict[str, Any]]:
        return self.list_langgraph_checkpoints(**kwargs)

    def put_langgraph_writes(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        checkpoint_id: str,
        task_id: str,
        task_path: str,
        writes: list[dict[str, Any]],
        request_id: str | None = None,
    ) -> None:
        del agent_type, request_id
        key = (thread_id, checkpoint_ns, checkpoint_id)
        existing = {
            (item["taskId"], item["idx"]): item for item in self.writes[key]
        }
        for write in writes:
            existing[(task_id, write["idx"])] = {
                "taskId": task_id,
                "taskPath": task_path,
                "idx": write["idx"],
                "channel": write["channel"],
                "value": write["value"],
                "createdAt": "2026-06-13T00:00:01Z",
            }
        self.writes[key] = list(existing.values())

    async def aput_langgraph_writes(self, **kwargs: Any) -> None:
        self.put_langgraph_writes(**kwargs)

    def delete_langgraph_thread(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        request_id: str | None = None,
    ) -> None:
        del agent_type, request_id
        keys = [
            key
            for key in self.checkpoints
            if key[0] == thread_id and key[1] == checkpoint_ns
        ]
        for key in keys:
            self.checkpoints.pop(key, None)
            self.writes.pop(key, None)

    async def adelete_langgraph_thread(self, **kwargs: Any) -> None:
        self.delete_langgraph_thread(**kwargs)


@pytest.mark.asyncio
async def test_ts_langgraph_checkpoint_saver_round_trips_pending_writes():
    client = FakeTSCheckpointClient()
    saver = TSLangGraphCheckpointSaver(client, agent_type="goal.create")
    checkpoint = empty_checkpoint()
    checkpoint["channel_values"] = {"message": "hello"}
    checkpoint["channel_versions"] = {"message": "0001"}
    checkpoint["versions_seen"] = {"planner": {"message": "0001"}}
    config = {"configurable": {"thread_id": "thread-1", "checkpoint_ns": ""}}

    next_config = await saver.aput(
        config,
        checkpoint,
        {"source": "input", "step": -1, "run_id": "run-1"},
        {"message": "0001"},
    )
    await saver.aput_writes(
        next_config,
        [("message", "delta"), ("__interrupt__", {"type": "approval"})],
        task_id="task-1",
    )

    restored = await saver.aget_tuple(next_config)

    assert restored is not None
    assert restored.checkpoint["channel_values"]["message"] == "hello"
    assert restored.metadata["run_id"] == "run-1"
    assert restored.pending_writes == [
        ("task-1", "__interrupt__", {"type": "approval"}),
        ("task-1", "message", "delta"),
    ]


@pytest.mark.asyncio
async def test_goal_runtime_resumes_after_runtime_recreation_with_persistent_saver():
    client = FakeTSCheckpointClient()
    saver_one = TSLangGraphCheckpointSaver(client, agent_type="goal.create")
    runtime_one = GoalCreateAgentRuntime(checkpointer=saver_one)

    first = await runtime_one.astart_goal_create(
        run_id="run-persistent",
        thread_id="thread-persistent",
        identity_id="identity-1",
        idea="Ship durable checkpoint persistence for goal agent approval.",
    )
    assert first.run.status == "waiting_approval"

    saver_two = TSLangGraphCheckpointSaver(client, agent_type="goal.create")
    runtime_two = GoalCreateAgentRuntime(checkpointer=saver_two)

    resumed = await runtime_two.aresume_goal_create(
        thread_id="thread-persistent",
        payload=AgentResumePayload(
            user_decision="confirm",
            approved_actions=first.state.pending_actions,
        ),
    )

    assert resumed.run.status == "waiting_execution"
    assert resumed.interrupts[0]["type"] == "execution.required"
