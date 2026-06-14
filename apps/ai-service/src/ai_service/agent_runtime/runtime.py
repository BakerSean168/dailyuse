"""Runtime facade for experimental Agent graphs."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

from ai_service.agent_runtime.checkpoints import (
    AgentRunHistoryPort,
    AgentRunHistoryStore,
)
from ai_service.agent_runtime.graphs import (
    build_goal_create_graph,
    build_knowledge_generate_graph,
    build_knowledge_qa_graph,
    create_goal_create_initial_state,
    create_knowledge_generate_initial_state,
    create_knowledge_qa_initial_state,
)
from ai_service.schemas import (
    AgentAction,
    AgentEvent,
    AgentResumePayload,
    AgentRun,
    AgentRunResult,
    AgentState,
    ProviderConfig,
)

ACTIVE_RUN_STATUSES = {
    "pending",
    "running",
    "waiting_clarification",
    "waiting_approval",
    "waiting_execution",
}


@dataclass(frozen=True)
class AgentRuntimeResult:
    """Projected result from one Agent runtime invocation."""

    run: AgentRun
    state: AgentState
    events: list[AgentEvent]
    interrupts: list[dict[str, Any]]

    @property
    def waiting_for_clarification(self) -> bool:
        return self.run.status == "waiting_clarification" and bool(self.interrupts)

    @property
    def waiting_for_approval(self) -> bool:
        return self.run.status == "waiting_approval" and bool(self.interrupts)

    @property
    def waiting_for_execution(self) -> bool:
        return self.run.status == "waiting_execution" and bool(self.interrupts)

    def to_response(self) -> AgentRunResult:
        return AgentRunResult(
            run=self.run,
            state=self.state,
            events=self.events,
            interrupts=self.interrupts,
        )


def _filter_runtime_runs(
    runs: list[AgentRun],
    *,
    identity_id: str,
    conversation_id: str | None = None,
    statuses: set[str] | None = None,
    active_only: bool = False,
    limit: int | None = None,
) -> list[AgentRun]:
    filtered = [
        run
        for run in runs
        if run.identity_id == identity_id
        and (conversation_id is None or run.conversation_id == conversation_id)
        and (statuses is None or run.status in statuses)
        and (not active_only or run.status in ACTIVE_RUN_STATUSES)
    ]
    filtered.sort(key=lambda run: run.updated_at, reverse=True)
    return filtered[:limit] if limit is not None else filtered


def _restore_thread_index_from_checkpointer(checkpointer: Any) -> dict[str, str]:
    """Rebuild runId -> threadId from latest checkpoint channel values."""

    restored: dict[str, str] = {}
    try:
        checkpoint_tuples = list(checkpointer.list(None))
    except Exception:
        return restored

    for item in checkpoint_tuples:
        values = item.checkpoint.get("channel_values", {})
        if not isinstance(values, dict):
            continue
        run_id = values.get("run_id")
        thread_id = values.get("thread_id")
        if isinstance(run_id, str) and isinstance(thread_id, str):
            restored.setdefault(run_id, thread_id)
    return restored


def _restore_thread_index(
    *,
    checkpointer: Any,
    run_history: AgentRunHistoryPort,
) -> dict[str, str]:
    restored = _restore_thread_index_from_checkpointer(checkpointer)
    restored.update(run_history.thread_index())
    return restored


def _list_history_runs(
    *,
    run_history: AgentRunHistoryPort,
    thread_by_run_id: dict[str, str],
    snapshot_getter: Any,
) -> list[AgentRun]:
    runs_by_id = {run.run_id: run for run in run_history.list_runs()}
    for run_id, thread_id in thread_by_run_id.items():
        if run_id in runs_by_id:
            continue
        try:
            runs_by_id[run_id] = snapshot_getter(thread_id=thread_id).run
        except Exception:
            continue
    return list(runs_by_id.values())


def _stored_result_to_runtime(result: AgentRunResult) -> AgentRuntimeResult:
    return AgentRuntimeResult(
        run=result.run,
        state=result.state,
        events=result.events,
        interrupts=result.interrupts,
    )


class GoalCreateAgentRuntime:
    """Experimental in-memory LangGraph runtime for the goal.create Agent."""

    def __init__(
        self,
        *,
        checkpointer: BaseCheckpointSaver[Any] | None = None,
        run_history: AgentRunHistoryPort | None = None,
        clock: Any | None = None,
        goal_planning_service: Any | None = None,
    ) -> None:
        self._checkpointer = checkpointer or InMemorySaver()
        self._run_history = run_history or AgentRunHistoryStore()
        self._clock = clock
        self._goal_planning_service = goal_planning_service
        self._thread_by_run_id = _restore_thread_index(
            checkpointer=self._checkpointer,
            run_history=self._run_history,
        )
        clock_arg = clock if clock is not None else None
        graph_kwargs: dict[str, Any] = {}
        if clock_arg is not None:
            graph_kwargs["clock"] = clock_arg
        if goal_planning_service is not None:
            graph_kwargs["goal_planner"] = self._plan_goal
        self._graph = build_goal_create_graph(**graph_kwargs).compile(
            checkpointer=self._checkpointer
        )

    async def _plan_goal(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        provider_config: ProviderConfig,
        request_id: str | None = None,
    ) -> Any:
        if self._goal_planning_service is None:
            raise RuntimeError("Goal planning service is not configured.")
        return await self._goal_planning_service.plan(
            idea=idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            provider_config=provider_config,
            request_id=request_id,
        )

    def _run_async(self, awaitable: Any) -> Any:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(awaitable)
        raise RuntimeError(
            "Use the async GoalCreateAgentRuntime methods inside an event loop."
        )

    def start_goal_create(
        self,
        **kwargs: Any,
    ) -> AgentRuntimeResult:
        return self._run_async(self.astart_goal_create(**kwargs))

    async def astart_goal_create(
        self,
        *,
        run_id: str,
        thread_id: str,
        identity_id: str,
        idea: str,
        conversation_id: str | None = None,
        category: str | None = None,
        timeframe: str | None = None,
        provider_config: ProviderConfig | None = None,
        related_resources: list[dict[str, Any]] | None = None,
        analytics_context: dict[str, Any] | None = None,
        context_errors: list[dict[str, str]] | None = None,
        request_id: str | None = None,
    ) -> AgentRuntimeResult:
        self._thread_by_run_id[run_id] = thread_id
        initial_state = create_goal_create_initial_state(
            run_id=run_id,
            thread_id=thread_id,
            identity_id=identity_id,
            idea=idea,
            conversation_id=conversation_id,
            category=category,
            timeframe=timeframe,
            provider_config=provider_config,
            related_resources=related_resources,
            analytics_context=analytics_context,
            context_errors=context_errors,
            request_id=request_id,
            **({"clock": self._clock} if self._clock is not None else {}),
        )
        config = self._config(thread_id)
        raw = await self._graph.ainvoke(initial_state, config=config)
        return self._project_result(thread_id, raw)

    def get_thread_id(self, *, run_id: str) -> str | None:
        return self._thread_by_run_id.get(run_id)

    def list_runs(
        self,
        *,
        identity_id: str,
        conversation_id: str | None = None,
        statuses: set[str] | None = None,
        active_only: bool = False,
        limit: int | None = None,
    ) -> list[AgentRun]:
        runs = _list_history_runs(
            run_history=self._run_history,
            thread_by_run_id=self._thread_by_run_id,
            snapshot_getter=self.get_snapshot,
        )
        return _filter_runtime_runs(
            runs,
            identity_id=identity_id,
            conversation_id=conversation_id,
            statuses=statuses,
            active_only=active_only,
            limit=limit,
        )

    def resume_goal_create(
        self,
        **kwargs: Any,
    ) -> AgentRuntimeResult:
        return self._run_async(self.aresume_goal_create(**kwargs))

    async def aresume_goal_create(
        self,
        *,
        thread_id: str,
        payload: AgentResumePayload,
    ) -> AgentRuntimeResult:
        # Check if graph checkpoint exists
        snapshot = self._graph.get_state(self._config(thread_id))
        if not snapshot.values:
            # Graph checkpoint missing - cannot resume execution
            # (We only have persisted snapshot, not executable graph state)
            raise ValueError(
                "Cannot resume run: LangGraph checkpoint missing for "
                f"thread {thread_id}. "
                "The run snapshot is available but execution state was lost "
                "(likely due to "
                "service restart). This run can be viewed but not resumed."
            )

        retry_command = self._retry_execution_command(
            thread_id=thread_id,
            payload=payload,
        )
        if retry_command is not None:
            raw = await self._graph.ainvoke(
                retry_command,
                config=self._config(thread_id),
            )
            return self._project_result(thread_id, raw)

        raw = await self._graph.ainvoke(
            Command(resume=payload.model_dump(by_alias=True, exclude_none=True)),
            config=self._config(thread_id),
        )
        return self._project_result(thread_id, raw)

    def get_snapshot(self, *, thread_id: str) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        if not snapshot.values:
            stored = self._run_history.get_result_by_thread_id(thread_id=thread_id)
            if stored is not None:
                return _stored_result_to_runtime(stored)
        return self._project_result(
            thread_id,
            {
                **snapshot.values,
                "__interrupt__": list(snapshot.interrupts),
            },
        )

    def _config(self, thread_id: str) -> dict[str, dict[str, str]]:
        return {"configurable": {"thread_id": thread_id}}

    def _retry_execution_command(
        self,
        *,
        thread_id: str,
        payload: AgentResumePayload,
    ) -> Command | None:
        if payload.user_decision != "confirm" or payload.executed_actions is not None:
            return None

        snapshot = self._graph.get_state(self._config(thread_id))
        values = snapshot.values or {}
        if values.get("status") != "completed" or values.get("stage") != "result":
            return None

        retry_actions = payload.approved_actions
        if retry_actions is None:
            retry_actions = self._retry_approved_actions(values)
        if not retry_actions:
            raise ValueError(
                "Goal Agent retry requires approved actions from a retryable "
                "execution result."
            )

        return Command(
            update={
                "status": "running",
                "stage": "execute",
                "approved_actions": [
                    action.model_dump(by_alias=True) for action in retry_actions
                ],
                "executed_actions": [],
                "resume_decision": payload.user_decision,
            },
            goto="prepare_execution",
        )

    def _retry_approved_actions(
        self,
        values: dict[str, Any],
    ) -> list[AgentAction]:
        execution_timeline = next(
            (
                artifact
                for artifact in values.get("artifacts", [])
                if artifact.get("kind") == "execution_timeline"
            ),
            None,
        )
        recovery = (
            execution_timeline.get("data", {}).get("recovery")
            if isinstance(execution_timeline, dict)
            else None
        )
        if not isinstance(recovery, dict) or recovery.get("canRetry") is not True:
            return []
        retry_actions = recovery.get("retryApprovedActions")
        if not isinstance(retry_actions, list):
            return []
        return [
            AgentAction.model_validate(action)
            for action in retry_actions
            if isinstance(action, dict)
        ]

    def _project_result(
        self,
        thread_id: str,
        raw: dict[str, Any],
    ) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        values = snapshot.values or {
            key: value for key, value in raw.items() if key != "__interrupt__"
        }
        run = AgentRun(
            runId=values["run_id"],
            threadId=values["thread_id"],
            conversationId=values.get("conversation_id"),
            identityId=values["identity_id"],
            agentType="goal.create",
            status=values["status"],
            createdAt=values["created_at"],
            updatedAt=values["updated_at"],
        )
        state = AgentState(
            messages=values.get("messages", []),
            intent=values.get("intent"),
            stage=values["stage"],
            artifacts=values.get("artifacts", []),
            citations=values.get("citations", []),
            retrievedContext=values.get("retrieved_context", []),
            pendingActions=values.get("pending_actions", []),
            approvedActions=values.get("approved_actions", []),
            executedActions=values.get("executed_actions", []),
            usage=values.get("usage", {}),
            errors=values.get("errors", []),
        )
        events = [
            AgentEvent.model_validate(event)
            for event in values.get("events", [])
        ]
        interrupts = [
            item.value if hasattr(item, "value") else item
            for item in raw.get("__interrupt__", [])
        ]
        result = AgentRuntimeResult(
            run=run,
            state=state,
            events=events,
            interrupts=interrupts,
        )
        self._thread_by_run_id[run.run_id] = run.thread_id
        self._run_history.upsert_result(result.to_response())
        return result


class KnowledgeQaAgentRuntime:
    """Experimental in-memory LangGraph runtime for the knowledge.qa Agent."""

    def __init__(
        self,
        *,
        checkpointer: BaseCheckpointSaver[Any] | None = None,
        run_history: AgentRunHistoryPort | None = None,
        clock: Any | None = None,
    ) -> None:
        self._checkpointer = checkpointer or InMemorySaver()
        self._run_history = run_history or AgentRunHistoryStore()
        self._clock = clock
        self._thread_by_run_id = _restore_thread_index(
            checkpointer=self._checkpointer,
            run_history=self._run_history,
        )
        clock_arg = clock if clock is not None else None
        self._graph = build_knowledge_qa_graph(
            **({"clock": clock_arg} if clock_arg is not None else {}),
        ).compile(checkpointer=self._checkpointer)

    def start_knowledge_qa(
        self,
        *,
        run_id: str,
        thread_id: str,
        identity_id: str,
        question: str,
        conversation_id: str | None = None,
        answer: str | None = None,
        citations: list[dict[str, Any]] | None = None,
        provider_id: str | None = None,
        token_usage: dict[str, Any] | None = None,
        processing_time_ms: int | None = None,
        matched_resource_count: int | None = None,
    ) -> AgentRuntimeResult:
        self._thread_by_run_id[run_id] = thread_id
        initial_state = create_knowledge_qa_initial_state(
            run_id=run_id,
            thread_id=thread_id,
            identity_id=identity_id,
            conversation_id=conversation_id,
            question=question,
            answer=answer,
            citations=citations,
            provider_id=provider_id,
            token_usage=token_usage,
            processing_time_ms=processing_time_ms,
            matched_resource_count=matched_resource_count,
            **({"clock": self._clock} if self._clock is not None else {}),
        )
        config = self._config(thread_id)
        raw = self._graph.invoke(initial_state, config=config)
        return self._project_result(thread_id, raw)

    def get_thread_id(self, *, run_id: str) -> str | None:
        return self._thread_by_run_id.get(run_id)

    def list_runs(
        self,
        *,
        identity_id: str,
        conversation_id: str | None = None,
        statuses: set[str] | None = None,
        active_only: bool = False,
        limit: int | None = None,
    ) -> list[AgentRun]:
        runs = _list_history_runs(
            run_history=self._run_history,
            thread_by_run_id=self._thread_by_run_id,
            snapshot_getter=self.get_snapshot,
        )
        return _filter_runtime_runs(
            runs,
            identity_id=identity_id,
            conversation_id=conversation_id,
            statuses=statuses,
            active_only=active_only,
            limit=limit,
        )

    def get_snapshot(self, *, thread_id: str) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        if not snapshot.values:
            stored = self._run_history.get_result_by_thread_id(thread_id=thread_id)
            if stored is not None:
                return _stored_result_to_runtime(stored)
        return self._project_result(
            thread_id,
            {
                **snapshot.values,
                "__interrupt__": list(snapshot.interrupts),
            },
        )

    def _config(self, thread_id: str) -> dict[str, dict[str, str]]:
        return {"configurable": {"thread_id": thread_id}}

    def _project_result(
        self,
        thread_id: str,
        raw: dict[str, Any],
    ) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        values = snapshot.values or {
            key: value for key, value in raw.items() if key != "__interrupt__"
        }
        run = AgentRun(
            runId=values["run_id"],
            threadId=values["thread_id"],
            conversationId=values.get("conversation_id"),
            identityId=values["identity_id"],
            agentType="knowledge.qa",
            status=values["status"],
            createdAt=values["created_at"],
            updatedAt=values["updated_at"],
        )
        state = AgentState(
            messages=values.get("messages", []),
            intent=values.get("intent"),
            stage=values["stage"],
            artifacts=values.get("artifacts", []),
            citations=values.get("citations", []),
            retrievedContext=values.get("retrieved_context", []),
            pendingActions=values.get("pending_actions", []),
            approvedActions=values.get("approved_actions", []),
            executedActions=values.get("executed_actions", []),
            usage=values.get("usage", {}),
            errors=values.get("errors", []),
        )
        events = [
            AgentEvent.model_validate(event)
            for event in values.get("events", [])
        ]
        interrupts = [
            item.value if hasattr(item, "value") else item
            for item in raw.get("__interrupt__", [])
        ]
        result = AgentRuntimeResult(
            run=run,
            state=state,
            events=events,
            interrupts=interrupts,
        )
        self._thread_by_run_id[run.run_id] = run.thread_id
        self._run_history.upsert_result(result.to_response())
        return result


class KnowledgeGenerateAgentRuntime:
    """Experimental in-memory LangGraph runtime for knowledge.generate."""

    def __init__(
        self,
        *,
        checkpointer: BaseCheckpointSaver[Any] | None = None,
        run_history: AgentRunHistoryPort | None = None,
        clock: Any | None = None,
        knowledge_note_service: Any | None = None,
        knowledge_query_service: Any | None = None,
    ) -> None:
        self._checkpointer = checkpointer or InMemorySaver()
        self._run_history = run_history or AgentRunHistoryStore()
        self._clock = clock
        self._knowledge_note_service = knowledge_note_service
        self._knowledge_query_service = knowledge_query_service
        self._thread_by_run_id = _restore_thread_index(
            checkpointer=self._checkpointer,
            run_history=self._run_history,
        )
        clock_arg = clock if clock is not None else None
        graph_kwargs: dict[str, Any] = {}
        if clock_arg is not None:
            graph_kwargs["clock"] = clock_arg
        if knowledge_note_service is not None:
            graph_kwargs["knowledge_note_generator"] = self._generate_note_sync
        if knowledge_query_service is not None:
            graph_kwargs["knowledge_citation_selector"] = self._select_citations_sync
        self._graph = build_knowledge_generate_graph(**graph_kwargs).compile(
            checkpointer=self._checkpointer
        )

    def _generate_note_sync(
        self,
        *,
        topic: str,
        title: str | None,
        provider_config: Any,
    ) -> dict[str, Any]:
        """Synchronous wrapper for async knowledge note generation.

        This is called from within the LangGraph node, which must be synchronous.
        We use asyncio.run() to execute the async service call.
        """
        if self._knowledge_note_service is None:
            raise RuntimeError("Knowledge note service is not configured.")

        import asyncio

        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an event loop, return empty to trigger fallback
                return {"content": "", "usage": {}}
        except RuntimeError:
            pass

        # Run the async function in a new event loop
        response = asyncio.run(
            self._knowledge_note_service.generate(
                topic=topic,
                title=title,
                provider_config=provider_config,
            )
        )

        return {
            "content": response.content,
            "usage": response.usage if hasattr(response, "usage") else {},
        }

    def _select_citations_sync(
        self,
        *,
        question: str,
        indexed_resources: list[Any],
        provider_config: Any,
        max_citations: int = 10,
    ) -> list[Any]:
        """Synchronous wrapper for async citation selection.

        This is called from within the LangGraph node, which must be synchronous.
        We use asyncio.run() to execute the async service call.
        """
        if self._knowledge_query_service is None:
            raise RuntimeError("Knowledge query service is not configured.")

        import asyncio

        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an event loop, return empty to trigger fallback
                return []
        except RuntimeError:
            pass

        # Run the async function in a new event loop
        citations = asyncio.run(
            self._knowledge_query_service.select_citations(
                question=question,
                indexed_resources=indexed_resources,
                provider_config=provider_config,
                max_citations=max_citations,
            )
        )

        return citations

    def start_knowledge_generate(
        self,
        *,
        run_id: str,
        thread_id: str,
        identity_id: str,
        topic: str,
        conversation_id: str | None = None,
        title: str | None = None,
        source: str | None = None,
        target_subpath: str | None = None,
        provider_id: str | None = None,
        model: str | None = None,
        provider_config: ProviderConfig | None = None,
        indexed_resources: list[Any] | None = None,
    ) -> AgentRuntimeResult:
        self._thread_by_run_id[run_id] = thread_id
        initial_state = create_knowledge_generate_initial_state(
            run_id=run_id,
            thread_id=thread_id,
            identity_id=identity_id,
            conversation_id=conversation_id,
            topic=topic,
            title=title,
            source=source,
            target_subpath=target_subpath,
            provider_id=provider_id,
            model=model,
            provider_config=provider_config,
            indexed_resources=indexed_resources,
            **({"clock": self._clock} if self._clock is not None else {}),
        )
        config = self._config(thread_id)
        raw = self._graph.invoke(initial_state, config=config)
        return self._project_result(thread_id, raw)

    def resume_knowledge_generate(
        self,
        *,
        thread_id: str,
        payload: AgentResumePayload,
    ) -> AgentRuntimeResult:
        # Check if graph checkpoint exists
        snapshot = self._graph.get_state(self._config(thread_id))
        if not snapshot.values:
            # Graph checkpoint missing - cannot resume execution
            raise ValueError(
                "Cannot resume run: LangGraph checkpoint missing for "
                f"thread {thread_id}. "
                "The run snapshot is available but execution state was lost "
                "(likely due to "
                "service restart). This run can be viewed but not resumed."
            )

        retry_command = self._retry_execution_command(
            thread_id=thread_id,
            payload=payload,
        )
        if retry_command is not None:
            raw = self._graph.invoke(
                retry_command,
                config=self._config(thread_id),
            )
            return self._project_result(thread_id, raw)

        raw = self._graph.invoke(
            Command(resume=payload.model_dump(by_alias=True, exclude_none=True)),
            config=self._config(thread_id),
        )
        return self._project_result(thread_id, raw)

    def _retry_execution_command(
        self,
        *,
        thread_id: str,
        payload: AgentResumePayload,
    ) -> Command | None:
        if payload.user_decision != "confirm" or payload.executed_actions is not None:
            return None

        snapshot = self._graph.get_state(self._config(thread_id))
        values = snapshot.values or {}
        if values.get("status") != "completed" or values.get("stage") != "result":
            return None

        retry_actions = payload.approved_actions
        if retry_actions is None:
            retry_actions = self._retry_approved_actions(values)
        if not retry_actions:
            raise ValueError(
                "Knowledge Generation retry requires approved actions from a "
                "retryable execution result."
            )

        return Command(
            update={
                "status": "running",
                "stage": "execute",
                "approved_actions": [
                    action.model_dump(by_alias=True) for action in retry_actions
                ],
                "executed_actions": [],
            },
            goto="prepare_execution",
        )

    def _retry_approved_actions(
        self,
        values: dict[str, Any],
    ) -> list[AgentAction]:
        execution_timeline = next(
            (
                artifact
                for artifact in values.get("artifacts", [])
                if artifact.get("kind") == "execution_timeline"
            ),
            None,
        )
        recovery = (
            execution_timeline.get("data", {}).get("recovery")
            if isinstance(execution_timeline, dict)
            else None
        )
        if not isinstance(recovery, dict) or recovery.get("canRetry") is not True:
            return []
        retry_actions = recovery.get("retryApprovedActions")
        if not isinstance(retry_actions, list):
            return []
        return [
            AgentAction.model_validate(action)
            for action in retry_actions
            if isinstance(action, dict)
        ]

    def get_thread_id(self, *, run_id: str) -> str | None:
        return self._thread_by_run_id.get(run_id)

    def list_runs(
        self,
        *,
        identity_id: str,
        conversation_id: str | None = None,
        statuses: set[str] | None = None,
        active_only: bool = False,
        limit: int | None = None,
    ) -> list[AgentRun]:
        runs = _list_history_runs(
            run_history=self._run_history,
            thread_by_run_id=self._thread_by_run_id,
            snapshot_getter=self.get_snapshot,
        )
        return _filter_runtime_runs(
            runs,
            identity_id=identity_id,
            conversation_id=conversation_id,
            statuses=statuses,
            active_only=active_only,
            limit=limit,
        )

    def get_snapshot(self, *, thread_id: str) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        if not snapshot.values:
            stored = self._run_history.get_result_by_thread_id(thread_id=thread_id)
            if stored is not None:
                return _stored_result_to_runtime(stored)
        return self._project_result(
            thread_id,
            {
                **snapshot.values,
                "__interrupt__": list(snapshot.interrupts),
            },
        )

    def _config(self, thread_id: str) -> dict[str, dict[str, str]]:
        return {"configurable": {"thread_id": thread_id}}

    def _project_result(
        self,
        thread_id: str,
        raw: dict[str, Any],
    ) -> AgentRuntimeResult:
        snapshot = self._graph.get_state(self._config(thread_id))
        values = snapshot.values or {
            key: value for key, value in raw.items() if key != "__interrupt__"
        }
        run = AgentRun(
            runId=values["run_id"],
            threadId=values["thread_id"],
            conversationId=values.get("conversation_id"),
            identityId=values["identity_id"],
            agentType="knowledge.generate",
            status=values["status"],
            createdAt=values["created_at"],
            updatedAt=values["updated_at"],
        )
        state = AgentState(
            messages=values.get("messages", []),
            intent=values.get("intent"),
            stage=values["stage"],
            artifacts=values.get("artifacts", []),
            citations=values.get("citations", []),
            retrievedContext=values.get("retrieved_context", []),
            pendingActions=values.get("pending_actions", []),
            approvedActions=values.get("approved_actions", []),
            executedActions=values.get("executed_actions", []),
            usage=values.get("usage", {}),
            errors=values.get("errors", []),
        )
        events = [
            AgentEvent.model_validate(event)
            for event in values.get("events", [])
        ]
        interrupts = [
            item.value if hasattr(item, "value") else item
            for item in raw.get("__interrupt__", [])
        ]
        result = AgentRuntimeResult(
            run=run,
            state=state,
            events=events,
            interrupts=interrupts,
        )
        self._thread_by_run_id[run.run_id] = run.thread_id
        self._run_history.upsert_result(result.to_response())
        return result
