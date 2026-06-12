"""HTTP client adapter for TS-side Agent checkpoint persistence."""

from __future__ import annotations

import httpx

from ai_service.schemas import AgentRun, AgentRunResult, AgentState


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
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_secret = service_secret
        self.identity_id = identity_id
        self.timeout = timeout

    def _headers(self, *, request_id: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_secret}",
            "X-Identity-Id": self.identity_id,
        }
        if request_id:
            headers["X-Request-Id"] = request_id
        return headers

    async def upsert_checkpoint(
        self,
        *,
        run: AgentRun,
        state: AgentState | None = None,
        thread_id: str | None = None,
        request_id: str | None = None,
    ) -> None:
        """Persist an Agent run checkpoint."""
        url = f"{self.base_url}/internal/agents/checkpoints"
        payload = {
            "run": run.model_dump(by_alias=True),
            "state": state.model_dump(by_alias=True) if state else None,
            "threadId": thread_id,
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
            return AgentRunResult.model_validate(response.json())

    async def list_checkpoints(
        self,
        *,
        conversation_id: str | None = None,
        statuses: list[str] | None = None,
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
            return [AgentRun.model_validate(item) for item in response.json()]

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
        request_id: str | None = None,
    ) -> dict[str, str]:
        """Retrieve the runId -> threadId index."""
        url = f"{self.base_url}/internal/agents/checkpoints/thread-index"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                url,
                headers=self._headers(request_id=request_id),
            )
            response.raise_for_status()
            return response.json()
