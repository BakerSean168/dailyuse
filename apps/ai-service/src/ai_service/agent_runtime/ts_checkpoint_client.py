"""HTTP client adapter for TS-side Agent checkpoint persistence."""

from __future__ import annotations

from base64 import b64decode, b64encode
from typing import Any

import httpx

from ai_service.schemas import AgentEvent, AgentRun, AgentRunResult, AgentState


class TSCheckpointClient:
    """Call the TS AI module checkpoint port via HTTP.

    This allows the Python Agent runtime to persist checkpoints to the
    production database through the TS application layer boundary.
    """

    def __init__(
        self,
        *,
        base_url: str,
        service_secret: str,
        identity_id: str,
        agent_type: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_secret = service_secret
        self.identity_id = identity_id
        self.agent_type = agent_type
        self.timeout = timeout

    def _headers(self, *, request_id: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_secret}",
            "X-Identity-Id": self.identity_id,
        }
        if request_id:
            headers["X-Request-Id"] = request_id
        return headers

    def _agent_type(self, agent_type: str | None = None) -> str:
        resolved = agent_type or self.agent_type
        if resolved is None:
            raise ValueError("agent_type is required for this checkpoint client call.")
        return resolved

    @staticmethod
    def encode_typed_value(value: tuple[str, bytes]) -> dict[str, str]:
        return {
            "type": value[0],
            "data": b64encode(value[1]).decode("ascii"),
        }

    @staticmethod
    def decode_typed_value(payload: dict[str, Any]) -> tuple[str, bytes]:
        return (
            str(payload["type"]),
            b64decode(str(payload["data"]).encode("ascii")),
        )

    @staticmethod
    def _response_data(response: httpx.Response) -> Any:
        payload = response.json()
        if isinstance(payload, dict) and "ok" in payload:
            return payload.get("data")
        return payload

    async def upsert_checkpoint(
        self,
        *,
        run: AgentRun,
        state: AgentState | None = None,
        thread_id: str | None = None,
        events: list[AgentEvent] | None = None,
        interrupts: list[dict] | None = None,
        request_id: str | None = None,
    ) -> None:
        """Persist an Agent run checkpoint."""
        url = f"{self.base_url}/internal/agents/checkpoints"
        payload = {
            "run": run.model_dump(by_alias=True),
            "state": state.model_dump(by_alias=True) if state else None,
            "threadId": thread_id,
            "events": [e.model_dump(by_alias=True) for e in events] if events else [],
            "interrupts": interrupts if interrupts else [],
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    async def get_checkpoint(
        self,
        *,
        run_id: str,
        request_id: str | None = None,
    ) -> AgentRunResult | None:
        """Retrieve a checkpoint by run ID."""
        url = f"{self.base_url}/internal/agents/checkpoints/{run_id}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                headers=self._headers(request_id=request_id),
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return AgentRunResult.model_validate(self._response_data(response))

    async def list_checkpoints(
        self,
        *,
        conversation_id: str | None = None,
        statuses: list[str] | None = None,
        agent_type: str | None = None,
        active_only: bool = False,
        limit: int | None = None,
        request_id: str | None = None,
    ) -> list[AgentRun]:
        """List checkpoints for the current identity."""
        url = f"{self.base_url}/internal/agents/checkpoints"
        params: dict[str, str | int | bool] = {}
        if conversation_id:
            params["conversationId"] = conversation_id
        if statuses:
            params["status"] = ",".join(statuses)
        resolved_agent_type = agent_type or self.agent_type
        if resolved_agent_type:
            params["agentType"] = resolved_agent_type
        if active_only:
            params["activeOnly"] = True
        if limit:
            params["limit"] = limit

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
            payload = self._response_data(response) or []
            return [AgentRun.model_validate(item) for item in payload]

    async def delete_checkpoint(
        self,
        *,
        run_id: str,
        request_id: str | None = None,
    ) -> None:
        """Delete a checkpoint by run ID."""
        url = f"{self.base_url}/internal/agents/checkpoints/{run_id}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                url,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    async def get_thread_index(
        self,
        *,
        agent_type: str | None = None,
        request_id: str | None = None,
    ) -> dict[str, str]:
        """Retrieve the runId -> threadId index."""
        url = f"{self.base_url}/internal/agents/checkpoints/thread-index"
        params: dict[str, str] = {}
        resolved_agent_type = agent_type or self.agent_type
        if resolved_agent_type:
            params["agentType"] = resolved_agent_type
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
            payload = self._response_data(response)
            return payload if isinstance(payload, dict) else {}

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
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints"
        payload = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
            "checkpointId": checkpoint_id,
            "parentCheckpointId": parent_checkpoint_id,
            "checkpoint": self.encode_typed_value(checkpoint),
            "metadata": self.encode_typed_value(metadata),
        }
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                url,
                json=payload,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    async def aput_langgraph_checkpoint(
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
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints"
        payload = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
            "checkpointId": checkpoint_id,
            "parentCheckpointId": parent_checkpoint_id,
            "checkpoint": self.encode_typed_value(checkpoint),
            "metadata": self.encode_typed_value(metadata),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    def get_langgraph_checkpoint(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        checkpoint_id: str | None,
        request_id: str | None = None,
    ) -> dict[str, Any] | None:
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/head"
        params = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        if checkpoint_id is not None:
            params["checkpointId"] = checkpoint_id
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = self._response_data(response)
            return payload if isinstance(payload, dict) else None

    async def aget_langgraph_checkpoint(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        checkpoint_id: str | None,
        request_id: str | None = None,
    ) -> dict[str, Any] | None:
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/head"
        params = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        if checkpoint_id is not None:
            params["checkpointId"] = checkpoint_id
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = self._response_data(response)
            return payload if isinstance(payload, dict) else None

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
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints"
        params: dict[str, str | int] = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        if before_checkpoint_id is not None:
            params["beforeCheckpointId"] = before_checkpoint_id
        if limit is not None:
            params["limit"] = limit
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
            payload = self._response_data(response) or []
            return payload if isinstance(payload, list) else []

    async def alist_langgraph_checkpoints(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        before_checkpoint_id: str | None = None,
        limit: int | None = None,
        request_id: str | None = None,
    ) -> list[dict[str, Any]]:
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints"
        params: dict[str, str | int] = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        if before_checkpoint_id is not None:
            params["beforeCheckpointId"] = before_checkpoint_id
        if limit is not None:
            params["limit"] = limit
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
            payload = self._response_data(response) or []
            return payload if isinstance(payload, list) else []

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
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/writes"
        payload = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
            "checkpointId": checkpoint_id,
            "taskId": task_id,
            "taskPath": task_path,
            "writes": writes,
        }
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                url,
                json=payload,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    async def aput_langgraph_writes(
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
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/writes"
        payload = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
            "checkpointId": checkpoint_id,
            "taskId": task_id,
            "taskPath": task_path,
            "writes": writes,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    def delete_langgraph_thread(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        request_id: str | None = None,
    ) -> None:
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/thread"
        params = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        with httpx.Client(timeout=self.timeout) as client:
            response = client.delete(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()

    async def adelete_langgraph_thread(
        self,
        *,
        agent_type: str | None = None,
        thread_id: str,
        checkpoint_ns: str,
        request_id: str | None = None,
    ) -> None:
        url = f"{self.base_url}/internal/agents/langgraph-checkpoints/thread"
        params = {
            "agentType": self._agent_type(agent_type),
            "threadId": thread_id,
            "checkpointNs": checkpoint_ns,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                url,
                params=params,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
