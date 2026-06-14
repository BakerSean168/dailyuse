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

    def __init__(self, client: TSCheckpointClient, *, agent_type: str) -> None:
        self.client = client
        self.agent_type = agent_type

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
                    events=result.events,
                    interrupts=result.interrupts,
                )
            )
        else:
            loop.create_task(
                self.client.upsert_checkpoint(
                    run=result.run,
                    state=result.state,
                    thread_id=result.run.thread_id,
                    events=result.events,
                    interrupts=result.interrupts,
                )
            )

    def list_runs(self) -> list[AgentRun]:
        """List all runs for the current identity.

        This method works in both sync and async contexts. When called from an
        async context (e.g., FastAPI route), it delegates to a thread pool to
        avoid blocking the event loop.
        """
        import asyncio

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            # No event loop: directly use asyncio.run
            return asyncio.run(self.client.list_checkpoints(agent_type=self.agent_type))
        else:
            # Event loop running: run in thread pool to avoid blocking
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    self.client.list_checkpoints(agent_type=self.agent_type),
                )
                return future.result()

    async def alist_runs(self) -> list[AgentRun]:
        """Async variant of list_runs."""
        return await self.client.list_checkpoints(agent_type=self.agent_type)

    def get_result_by_thread_id(self, *, thread_id: str) -> AgentRunResult | None:
        """Retrieve a checkpoint by thread ID.

        Note: This requires fetching all runs and filtering client-side,
        as the TS checkpoint API doesn't expose a thread_id filter yet.
        For production, consider extending the API if this becomes a bottleneck.

        This method works in both sync and async contexts.
        """
        import asyncio

        async def _fetch() -> AgentRunResult | None:
            runs = await self.client.list_checkpoints(agent_type=self.agent_type)
            for run in runs:
                if run.thread_id == thread_id:
                    return await self.client.get_checkpoint(run_id=run.run_id)
            return None

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            # No event loop: directly use asyncio.run
            return asyncio.run(_fetch())
        else:
            # Event loop running: run in thread pool
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _fetch())
                return future.result()

    async def aget_result_by_thread_id(
        self, *, thread_id: str
    ) -> AgentRunResult | None:
        """Async variant of get_result_by_thread_id."""
        runs = await self.client.list_checkpoints(agent_type=self.agent_type)
        for run in runs:
            if run.thread_id == thread_id:
                return await self.client.get_checkpoint(run_id=run.run_id)
        return None

    def thread_index(self) -> dict[str, str]:
        """Retrieve the runId -> threadId index.

        This method works in both sync and async contexts.
        """
        import asyncio

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            # No event loop: directly use asyncio.run
            return asyncio.run(self.client.get_thread_index(agent_type=self.agent_type))
        else:
            # Event loop running: run in thread pool
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    self.client.get_thread_index(agent_type=self.agent_type),
                )
                return future.result()

    async def athread_index(self) -> dict[str, str]:
        """Async variant of thread_index."""
        return await self.client.get_thread_index(agent_type=self.agent_type)
