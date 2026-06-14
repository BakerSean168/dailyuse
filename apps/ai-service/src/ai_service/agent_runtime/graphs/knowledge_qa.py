"""Minimal LangGraph spike for the knowledge.qa Agent."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any, TypedDict, cast

from langgraph.graph import END, START, StateGraph

from ai_service.agent_runtime.events import (
    append_agent_event,
    append_node_lifecycle_events,
    append_tool_lifecycle_events,
)
from ai_service.schemas import AgentArtifact, AgentCitation, AgentMessage, AgentUsage

Clock = Callable[[], int]
GraphUpdate = dict[str, Any]


class KnowledgeQaGraphState(TypedDict, total=False):
    """Serializable state used by the experimental knowledge.qa graph."""

    run_id: str
    thread_id: str
    conversation_id: str | None
    identity_id: str
    created_at: int
    updated_at: int
    status: str
    intent: str | None
    stage: str
    question: str
    answer: str | None
    provider_id: str | None
    processing_time_ms: int | None
    matched_resource_count: int | None
    messages: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    citations: list[dict[str, Any]]
    retrieved_context: list[dict[str, Any]]
    pending_actions: list[dict[str, Any]]
    approved_actions: list[dict[str, Any]]
    executed_actions: list[dict[str, Any]]
    usage: dict[str, Any]
    errors: list[str]
    events: list[dict[str, Any]]


def _required(state: KnowledgeQaGraphState, key: str) -> Any:
    return cast(dict[str, Any], state)[key]


def _run_id(state: KnowledgeQaGraphState) -> str:
    return str(_required(state, "run_id"))


def _question(state: KnowledgeQaGraphState) -> str:
    return str(_required(state, "question"))


def _default_clock_ms() -> int:
    return int(time.time() * 1000)


def _node_event(
    state: KnowledgeQaGraphState,
    node: str,
    clock: Clock,
    *,
    started_at: int | None = None,
) -> list[dict[str, Any]]:
    started_at = started_at if started_at is not None else clock()
    return append_node_lifecycle_events(
        state.get("events", []),
        run_id=_run_id(state),
        node=node,
        created_at=started_at,
        completed_at=clock(),
    )


def _default_answer(question: str, citations: list[dict[str, Any]]) -> str:
    if citations:
        return (
            "Repository evidence is available for this question. Review the "
            "attached citations before saving or acting on the answer."
        )
    return (
        "Current knowledge base evidence is insufficient to answer this "
        f"question: {question}"
    )


def _related_notes_from_citations(
    citations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    notes_by_resource_id: dict[str, dict[str, Any]] = {}
    for citation in citations:
        resource_id = str(citation.get("resourceId", "")).strip()
        if not resource_id or resource_id in notes_by_resource_id:
            continue
        notes_by_resource_id[resource_id] = {
            "resourceId": resource_id,
            "resourcePath": citation["resourcePath"],
            "title": citation.get("title"),
            "excerpt": citation["excerpt"],
            "score": citation["score"],
        }
    return list(notes_by_resource_id.values())


def _normalize_usage(usage: dict[str, Any] | None) -> dict[str, Any]:
    if not usage:
        return {}
    return AgentUsage.model_validate(usage).model_dump(
        by_alias=True,
        exclude_none=True,
    )


def create_knowledge_qa_initial_state(
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
    clock: Clock = _default_clock_ms,
) -> KnowledgeQaGraphState:
    """Build the initial state for one knowledge.qa Agent run."""

    now = clock()
    user_message = AgentMessage(
        role="user",
        content=question,
        createdAt=now,
    )
    validated_citations = [
        AgentCitation.model_validate(citation).model_dump(by_alias=True)
        for citation in (citations or [])
    ]
    return {
        "run_id": run_id,
        "thread_id": thread_id,
        "conversation_id": conversation_id,
        "identity_id": identity_id,
        "created_at": now,
        "updated_at": now,
        "status": "pending",
        "intent": "knowledge-qa",
        "stage": "intake",
        "question": question,
        "answer": answer,
        "provider_id": provider_id,
        "processing_time_ms": processing_time_ms,
        "matched_resource_count": matched_resource_count,
        "messages": [user_message.model_dump(by_alias=True, exclude_none=True)],
        "artifacts": [],
        "citations": validated_citations,
        "retrieved_context": [],
        "pending_actions": [],
        "approved_actions": [],
        "executed_actions": [],
        "usage": _normalize_usage(token_usage),
        "errors": [],
        "events": [],
    }


def build_knowledge_qa_graph(
    *,
    clock: Clock = _default_clock_ms,
) -> Any:
    """Compile a minimal knowledge.qa graph that completes without side effects."""

    def intake(state: KnowledgeQaGraphState) -> GraphUpdate:
        started_at = clock()
        events = append_agent_event(
            state.get("events", []),
            run_id=_run_id(state),
            event_type="run.started",
            created_at=started_at,
            data={"agentType": "knowledge.qa"},
        )
        return {
            "status": "running",
            "stage": "intake",
            "updated_at": clock(),
            "events": append_node_lifecycle_events(
                events,
                run_id=_run_id(state),
                node="intake",
                created_at=started_at,
                completed_at=clock(),
            ),
        }

    def retrieve_context(state: KnowledgeQaGraphState) -> GraphUpdate:
        started_at = clock()
        completed_at = clock()
        matches = state.get("citations", [])
        return {
            "stage": "retrieve_context",
            "updated_at": completed_at,
            "retrieved_context": [
                {
                    "tool": "search_knowledge",
                    "query": _question(state),
                    "matches": matches,
                }
            ],
            "events": append_tool_lifecycle_events(
                append_node_lifecycle_events(
                    state.get("events", []),
                    run_id=_run_id(state),
                    node="retrieve_context",
                    created_at=started_at,
                    completed_at=completed_at,
                ),
                run_id=_run_id(state),
                tool="search_knowledge",
                created_at=started_at,
                completed_at=completed_at,
                started_data={"query": _question(state)},
                completed_data={
                    "status": "completed",
                    "query": _question(state),
                    "matchCount": len(matches),
                },
            ),
        }

    def answer(state: KnowledgeQaGraphState) -> GraphUpdate:
        now = clock()
        citations = state.get("citations", [])
        evidence_status = "grounded" if citations else "insufficient"
        answer_text = (state.get("answer") or "").strip() or _default_answer(
            _question(state),
            citations,
        )
        matched_resource_count = state.get("matched_resource_count")
        if not isinstance(matched_resource_count, int):
            matched_resource_count = len(citations)
        artifact_data = {
            "question": _question(state),
            "answer": answer_text,
            "citations": citations,
            "relatedNotes": _related_notes_from_citations(citations),
            "evidenceStatus": evidence_status,
            "matchedResourceCount": matched_resource_count,
        }
        provider_id = state.get("provider_id")
        if provider_id:
            artifact_data["providerId"] = provider_id
        usage = state.get("usage") or {}
        if usage:
            artifact_data["tokenUsage"] = usage
        processing_time_ms = state.get("processing_time_ms")
        if isinstance(processing_time_ms, int):
            artifact_data["processingTimeMs"] = processing_time_ms
        artifact = AgentArtifact(
            artifactId=f"{_run_id(state)}:knowledge-answer",
            kind="knowledge_answer",
            title="Knowledge answer",
            data=artifact_data,
            updatedAt=now,
        )
        events = append_agent_event(
            _node_event(state, "answer", clock),
            run_id=_run_id(state),
            event_type="artifact.updated",
            created_at=now,
            data={"artifactId": artifact.artifact_id, "kind": artifact.kind},
        )
        for citation in citations:
            events = append_agent_event(
                events,
                run_id=_run_id(state),
                event_type="citation.selected",
                created_at=now,
                data=citation,
            )
        return {
            "stage": "answer",
            "status": "running",
            "updated_at": now,
            "artifacts": [artifact.model_dump(by_alias=True)],
            "events": events,
        }

    def result(state: KnowledgeQaGraphState) -> GraphUpdate:
        now = clock()
        return {
            "stage": "result",
            "status": "completed",
            "updated_at": now,
            "events": append_agent_event(
                _node_event(state, "result", clock),
                run_id=_run_id(state),
                event_type="run.completed",
                created_at=now,
                data={"status": "completed"},
            ),
        }

    graph = StateGraph(KnowledgeQaGraphState)
    graph.add_node("intake", intake)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("answer", answer)
    graph.add_node("result", result)

    graph.add_edge(START, "intake")
    graph.add_edge("intake", "retrieve_context")
    graph.add_edge("retrieve_context", "answer")
    graph.add_edge("answer", "result")
    graph.add_edge("result", END)
    return graph
