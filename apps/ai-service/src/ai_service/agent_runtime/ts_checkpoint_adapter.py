"""Adapter to bridge Python AgentRunHistoryPort to TS checkpoint persistence."""

from __future__ import annotations

from ai_service.agent_runtime.ts_checkpoint_client import TSCheckpointClient
from ai_service.schemas import AgentRun, AgentRunResult


class TSCheckpointAdapter:
    """Implement AgentRunHistoryPort by delegating to TS checkpoint persistence.

    This adapter allows the Python Agent runtime to use the production database
    checkpoint storage through the TS application layer boundary, replacing the
    local file-backed checkpoint store.
    """

    def __init__(self, client: TSCheckpointClient) -> None:
        self.client = client

    def upsert_result(self, result: AgentRunResult) -> None:
        """Persist an Agent run result to TS checkpoint storage."""
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            asyncio.run(
                self.client.upsert_checkpoint(
                    run=result.run,
                    state=result.state,
                    thread_id=result.run.thread_id,
                )
            )
        else:
            loop.create_task(
                self.client.upsert_checkpoint(
                    run=result.run,
                    state=result.state,
                    thread_id=result.run.thread_id,
                )
            )

    def list_runs(self) -> list[AgentRun]:
        """List all runs for the current identity."""
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self.client.list_checkpoints())
        else:
            raise RuntimeError(
                "Cannot call list_runs from within an event loop. Use alist_runs instead."
            )

    async def alist_runs(self) -> list[AgentRun]:
        """Async variant of list_runs."""
        return await self.client.list_checkpoints()

    def get_result_by_thread_id(self, *, thread_id: str) -> AgentRunResult | None:
        """Retrieve a checkpoint by thread ID.

        Note: This requires fetching all runs and filtering client-side,
        as the TS checkpoint API doesn't expose a thread_id filter yet.
        For production, consider extending the API if this becomes a bottleneck.
        """
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            runs = asyncio.run(self.client.list_checkpoints())
        else:
            raise RuntimeError(
                "Cannot call get_result_by_thread_id from within an event loop. "
                "Use aget_result_by_thread_id instead."
            )

        for run in runs:
            if run.thread_id == thread_id:
                result = asyncio.run(self.client.get_checkpoint(run_id=run.run_id))
                return result
        return None

    async def aget_result_by_thread_id(
        self, *, thread_id: str
    ) -> AgentRunResult | None:
        """Async variant of get_result_by_thread_id."""
        runs = await self.client.list_checkpoints()
        for run in runs:
            if run.thread_id == thread_id:
                return await self.client.get_checkpoint(run_id=run.run_id)
        return None

    def thread_index(self) -> dict[str, str]:
        """Retrieve the runId -> threadId index."""
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self.client.get_thread_index())
        else:
            raise RuntimeError(
                "Cannot call thread_index from within an event loop. "
                "Use athread_index instead."
            )

    async def athread_index(self) -> dict[str, str]:
        """Async variant of thread_index."""
        return await self.client.get_thread_index()
