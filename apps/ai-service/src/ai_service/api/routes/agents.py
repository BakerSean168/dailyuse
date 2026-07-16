"""Experimental Agent runtime endpoints."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import ValidationError

from ai_service.agent_runtime import (
    GoalCreateAgentRuntime,
    KnowledgeGenerateAgentRuntime,
    KnowledgeQaAgentRuntime,
)
from ai_service.api.dependencies import (
    get_goal_create_agent_runtime,
    get_knowledge_generate_agent_runtime,
    get_knowledge_qa_agent_runtime,
)
from ai_service.schemas import (
    AgentEvent,
    AgentResumePayload,
    AgentRun,
    AgentRunResult,
    AgentRunStatus,
    AgentStartRunRequest,
    AgentUsage,
    AnalyticsQueryContext,
    KnowledgeResourceDocument,
    ProviderConfig,
)

router = APIRouter(prefix="/internal/agents", tags=["agents"])


def _runtime_thread(
    *,
    run_id: str,
    goal_runtime: GoalCreateAgentRuntime,
    knowledge_runtime: KnowledgeQaAgentRuntime,
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime,
) -> tuple[str, str]:
    goal_thread_id = goal_runtime.get_thread_id(run_id=run_id)
    if goal_thread_id is not None:
        return "goal.create", goal_thread_id

    knowledge_thread_id = knowledge_runtime.get_thread_id(run_id=run_id)
    if knowledge_thread_id is not None:
        return "knowledge.qa", knowledge_thread_id

    knowledge_generate_thread_id = knowledge_generate_runtime.get_thread_id(
        run_id=run_id,
    )
    if knowledge_generate_thread_id is not None:
        return "knowledge.generate", knowledge_generate_thread_id

    raise HTTPException(status_code=404, detail="Agent run not found.")


def _string_input(data: dict[str, Any], key: str) -> str | None:
    value = data.get(key)
    return value if isinstance(value, str) and value.strip() else None


def _nonnegative_int_input(data: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
            return value
    return None


def _citation_input(data: dict[str, Any]) -> list[dict[str, Any]]:
    value = data.get("citations")
    return value if isinstance(value, list) else []


def _token_usage_input(data: dict[str, Any]) -> dict[str, Any] | None:
    raw = data.get("tokenUsage") or data.get("token_usage")
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise HTTPException(
            status_code=422,
            detail='"tokenUsage" must be an object when provided.',
        )

    try:
        return AgentUsage.model_validate(raw).model_dump(
            by_alias=True,
            exclude_none=True,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid tokenUsage: {exc}",
        ) from exc


def _provider_config_input(data: dict[str, Any]) -> ProviderConfig | None:
    raw = data.get("provider_config") or data.get("providerConfig")
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise HTTPException(
            status_code=422,
            detail='"provider_config" must be an object when provided.',
        )

    normalized = dict(raw)
    alias_pairs = {
        "apiKey": "api_key",
        "baseUrl": "base_url",
        "maxTokens": "max_tokens",
        "embeddingModel": "embedding_model",
    }
    for source_key, target_key in alias_pairs.items():
        if source_key in normalized:
            normalized.setdefault(target_key, normalized[source_key])
            normalized.pop(source_key, None)

    try:
        return ProviderConfig.model_validate(normalized)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid provider_config: {exc}",
        ) from exc


def _related_resources_input(data: dict[str, Any]) -> list[dict[str, Any]]:
    raw = data.get("related_resources") or data.get("relatedResources")
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise HTTPException(
            status_code=422,
            detail='"related_resources" must be an array when provided.',
        )

    try:
        return [
            KnowledgeResourceDocument.model_validate(item).model_dump(mode="json")
            for item in raw
            if isinstance(item, dict)
        ]
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid related_resources: {exc}",
        ) from exc


def _indexed_resources_input(data: dict[str, Any]) -> list[Any]:
    raw = data.get("indexed_resources") or data.get("indexedResources")
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise HTTPException(
            status_code=422,
            detail='"indexed_resources" must be an array when provided.',
        )

    try:
        from ai_service.schemas import IndexedKnowledgeResource

        return [
            IndexedKnowledgeResource.model_validate(item)
            for item in raw
            if isinstance(item, dict)
        ]
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid indexed_resources: {exc}",
        ) from exc


def _analytics_context_input(data: dict[str, Any]) -> dict[str, Any] | None:
    raw = data.get("analytics_context") or data.get("analyticsContext")
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise HTTPException(
            status_code=422,
            detail='"analytics_context" must be an object when provided.',
        )

    normalized = dict(raw)
    if "taskDashboard" in normalized:
        normalized.setdefault("task_dashboard", normalized["taskDashboard"])
        normalized.pop("taskDashboard", None)
    if "goalSearchResults" in normalized:
        normalized.setdefault("goal_search_results", normalized["goalSearchResults"])
        normalized.pop("goalSearchResults", None)

    try:
        return AnalyticsQueryContext.model_validate(normalized).model_dump(mode="json")
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid analytics_context: {exc}",
        ) from exc


def _context_errors_input(data: dict[str, Any]) -> list[dict[str, str]]:
    raw = data.get("context_errors") or data.get("contextErrors")
    if not isinstance(raw, list):
        return []
    errors: list[dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        tool = item.get("tool")
        message = item.get("message")
        if isinstance(tool, str) and isinstance(message, str):
            errors.append({"tool": tool, "message": message})
    return errors


@router.post("/runs", response_model=AgentRunResult)
async def start_agent_run(
    http_request: Request,
    request: AgentStartRunRequest,
    goal_runtime: GoalCreateAgentRuntime = Depends(get_goal_create_agent_runtime),
    knowledge_runtime: KnowledgeQaAgentRuntime = Depends(
        get_knowledge_qa_agent_runtime,
    ),
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime = Depends(
        get_knowledge_generate_agent_runtime,
    ),
) -> AgentRunResult:
    """Start an experimental Agent run."""

    if request.agent_type == "knowledge.qa":
        question = _string_input(request.input, "question") or _string_input(
            request.input,
            "message",
        )
        if question is None:
            raise HTTPException(
                status_code=422,
                detail='Agent input must include a non-empty "question" or "message".',
            )

        result = await asyncio.to_thread(
            knowledge_runtime.start_knowledge_qa,
            run_id=request.run_id,
            thread_id=request.thread_id,
            conversation_id=request.conversation_id,
            identity_id=request.identity_id,
            question=question,
            answer=_string_input(request.input, "answer"),
            citations=_citation_input(request.input),
            provider_id=_string_input(request.input, "providerId")
            or _string_input(request.input, "provider_id"),
            token_usage=_token_usage_input(request.input),
            processing_time_ms=_nonnegative_int_input(
                request.input,
                "processingTimeMs",
                "processing_time_ms",
            ),
            matched_resource_count=_nonnegative_int_input(
                request.input,
                "matchedResourceCount",
                "matched_resource_count",
            ),
        )
        return result.to_response()

    if request.agent_type == "knowledge.generate":
        topic = _string_input(request.input, "topic") or _string_input(
            request.input,
            "message",
        )
        if topic is None:
            raise HTTPException(
                status_code=422,
                detail='Agent input must include a non-empty "topic" or "message".',
            )

        result = await asyncio.to_thread(
            knowledge_generate_runtime.start_knowledge_generate,
            run_id=request.run_id,
            thread_id=request.thread_id,
            conversation_id=request.conversation_id,
            identity_id=request.identity_id,
            topic=topic,
            title=_string_input(request.input, "title"),
            source=_string_input(request.input, "source"),
            target_subpath=_string_input(request.input, "targetSubpath"),
            provider_id=_string_input(request.input, "providerId")
            or _string_input(request.input, "provider_id"),
            model=_string_input(request.input, "model"),
            provider_config=_provider_config_input(request.input),
            indexed_resources=_indexed_resources_input(request.input),
        )
        return result.to_response()

    if request.agent_type != "goal.create":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported experimental agent type: {request.agent_type}",
        )

    idea = _string_input(request.input, "idea") or _string_input(
        request.input,
        "message",
    )
    if idea is None:
        raise HTTPException(
            status_code=422,
            detail='Agent input must include a non-empty "idea" or "message".',
        )

    result = await goal_runtime.astart_goal_create(
        run_id=request.run_id,
        thread_id=request.thread_id,
        conversation_id=request.conversation_id,
        identity_id=request.identity_id,
        idea=idea,
        locale=request.locale,
        category=_string_input(request.input, "category"),
        timeframe=_string_input(request.input, "timeframe"),
        provider_config=_provider_config_input(request.input),
        related_resources=_related_resources_input(request.input),
        analytics_context=_analytics_context_input(request.input),
        context_errors=_context_errors_input(request.input),
        request_id=http_request.headers.get("X-Request-Id")
        or _string_input(request.input, "requestId"),
    )
    return result.to_response()


@router.get("/runs", response_model=list[AgentRun])
async def list_agent_runs(
    http_request: Request,
    identity_id: str | None = Query(default=None, alias="identityId"),
    conversation_id: str | None = Query(default=None, alias="conversationId"),
    status: list[AgentRunStatus] | None = Query(default=None),
    active_only: bool = Query(default=False, alias="activeOnly"),
    limit: int = Query(default=20, ge=1, le=100),
    goal_runtime: GoalCreateAgentRuntime = Depends(get_goal_create_agent_runtime),
    knowledge_runtime: KnowledgeQaAgentRuntime = Depends(
        get_knowledge_qa_agent_runtime,
    ),
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime = Depends(
        get_knowledge_generate_agent_runtime,
    ),
) -> list[AgentRun]:
    """Return recent Agent runs visible to one identity."""

    resolved_identity_id = identity_id or http_request.headers.get("X-Identity-Id")
    if resolved_identity_id is None:
        raise HTTPException(
            status_code=422,
            detail="Agent run list requires an identityId query parameter or header.",
        )

    statuses: set[str] | None = None
    if status:
        statuses = {str(item) for item in status}
    runs = [
        *(
            await asyncio.to_thread(
                goal_runtime.list_runs,
                identity_id=resolved_identity_id,
                conversation_id=conversation_id,
                statuses=statuses,
                active_only=active_only,
                limit=limit,
            )
        ),
        *(
            await asyncio.to_thread(
                knowledge_runtime.list_runs,
                identity_id=resolved_identity_id,
                conversation_id=conversation_id,
                statuses=statuses,
                active_only=active_only,
                limit=limit,
            )
        ),
        *(
            await asyncio.to_thread(
                knowledge_generate_runtime.list_runs,
                identity_id=resolved_identity_id,
                conversation_id=conversation_id,
                statuses=statuses,
                active_only=active_only,
                limit=limit,
            )
        ),
    ]
    runs.sort(key=lambda run: run.updated_at, reverse=True)
    return runs[:limit]


@router.post("/runs/{run_id}/resume", response_model=AgentRunResult)
async def resume_agent_run(
    run_id: str,
    request: AgentResumePayload,
    goal_runtime: GoalCreateAgentRuntime = Depends(get_goal_create_agent_runtime),
    knowledge_runtime: KnowledgeQaAgentRuntime = Depends(
        get_knowledge_qa_agent_runtime,
    ),
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime = Depends(
        get_knowledge_generate_agent_runtime,
    ),
) -> AgentRunResult:
    """Resume an interrupted experimental Agent run."""

    agent_type, thread_id = _runtime_thread(
        run_id=run_id,
        goal_runtime=goal_runtime,
        knowledge_runtime=knowledge_runtime,
        knowledge_generate_runtime=knowledge_generate_runtime,
    )
    if agent_type == "knowledge.generate":
        try:
            result = await asyncio.to_thread(
                knowledge_generate_runtime.resume_knowledge_generate,
                thread_id=thread_id,
                payload=request,
            )
        except ValueError as exc:
            error_message = str(exc)
            # Check for checkpoint missing error (durable resume not available)
            if "LangGraph checkpoint missing" in error_message:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "runtime_checkpoint_missing",
                        "message": error_message,
                    },
                ) from exc
            # Check for validation errors
            if error_message in {
                (
                    "Knowledge Generation approval can only resume with confirm, "
                    "edit, or cancel decisions."
                ),
                (
                    "Executed actions are required to finish Knowledge Generation "
                    "execution."
                ),
            }:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            raise
        return result.to_response()

    if agent_type != "goal.create":
        raise HTTPException(
            status_code=400,
            detail=f"Agent type {agent_type} does not support resume.",
        )

    try:
        result = await goal_runtime.aresume_goal_create(
            thread_id=thread_id,
            payload=request,
        )
    except ValueError as exc:
        error_message = str(exc)
        # Check for checkpoint missing error (durable resume not available)
        if "LangGraph checkpoint missing" in error_message:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "runtime_checkpoint_missing",
                    "message": error_message,
                },
            ) from exc
        # Check for validation errors
        if error_message in {
            "Executed actions are required to finish Agent execution.",
            (
                "Clarification answers are required to continue Goal Agent "
                "clarification."
            ),
            "Goal Agent clarification can only resume with a clarify decision.",
            (
                "Goal Agent approval can only resume with confirm, edit, cancel, "
                "or regenerate decisions."
            ),
        }:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        raise
    return result.to_response()


@router.get("/runs/{run_id}", response_model=AgentRunResult)
async def get_agent_run(
    run_id: str,
    goal_runtime: GoalCreateAgentRuntime = Depends(get_goal_create_agent_runtime),
    knowledge_runtime: KnowledgeQaAgentRuntime = Depends(
        get_knowledge_qa_agent_runtime,
    ),
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime = Depends(
        get_knowledge_generate_agent_runtime,
    ),
) -> AgentRunResult:
    """Return the current experimental Agent state snapshot."""

    agent_type, thread_id = _runtime_thread(
        run_id=run_id,
        goal_runtime=goal_runtime,
        knowledge_runtime=knowledge_runtime,
        knowledge_generate_runtime=knowledge_generate_runtime,
    )
    if agent_type == "knowledge.qa":
        return (
            await asyncio.to_thread(
                knowledge_runtime.get_snapshot,
                thread_id=thread_id,
            )
        ).to_response()
    if agent_type == "knowledge.generate":
        return (
            await asyncio.to_thread(
                knowledge_generate_runtime.get_snapshot,
                thread_id=thread_id,
            )
        ).to_response()
    return (
        await asyncio.to_thread(
            goal_runtime.get_snapshot,
            thread_id=thread_id,
        )
    ).to_response()


@router.get("/runs/{run_id}/events", response_model=list[AgentEvent])
async def get_agent_run_events(
    run_id: str,
    goal_runtime: GoalCreateAgentRuntime = Depends(get_goal_create_agent_runtime),
    knowledge_runtime: KnowledgeQaAgentRuntime = Depends(
        get_knowledge_qa_agent_runtime,
    ),
    knowledge_generate_runtime: KnowledgeGenerateAgentRuntime = Depends(
        get_knowledge_generate_agent_runtime,
    ),
) -> list[AgentEvent]:
    """Return events emitted by an experimental Agent run."""

    agent_type, thread_id = _runtime_thread(
        run_id=run_id,
        goal_runtime=goal_runtime,
        knowledge_runtime=knowledge_runtime,
        knowledge_generate_runtime=knowledge_generate_runtime,
    )
    if agent_type == "knowledge.qa":
        return (
            await asyncio.to_thread(
                knowledge_runtime.get_snapshot,
                thread_id=thread_id,
            )
        ).events
    if agent_type == "knowledge.generate":
        return (
            await asyncio.to_thread(
                knowledge_generate_runtime.get_snapshot,
                thread_id=thread_id,
            )
        ).events
    return (
        await asyncio.to_thread(
            goal_runtime.get_snapshot,
            thread_id=thread_id,
        )
    ).events
