"""Goal planning strategy implementations.

Contains the automation planning strategy and its read-only tool execution
layer.  Extracted from ``goal_planning_service`` to keep the service class
focused on orchestration.
"""

from __future__ import annotations

import logging
import time

from ai_service.logging_utils import (
    compact_log,
    preview_text,
    summarize_provider_config,
    summarize_tool_calls,
    summarize_usage,
)
from ai_service.schemas import (
    AnalyticsQueryContext,
    ChatMessage,
    ChatToolDefinition,
    GoalAutomationFetchStatsResult,
    GoalAutomationResponse,
    GoalAutomationSearchNotesResult,
    KnowledgeResourceDocument,
    PlannedGoal,
    ProviderConfig,
)
from ai_service.services.analytics_query_service import AnalyticsQueryService
from ai_service.services.chat_service import ChatService
from ai_service.services.goal_planning_parsers import (
    parse_goal_automation_completion,
)
from ai_service.services.goal_planning_prompts import (
    build_goal_automation_system_prompt,
    build_goal_automation_user_prompt,
)
from ai_service.services.goal_planning_tools import (
    build_goal_automation_native_tools,
    parse_fetch_stats_tool_arguments,
    parse_search_notes_tool_arguments,
    supports_native_goal_tools,
)
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)
from ai_service.services.provider_tool_runtime import (
    ToolLoopResult,
    complete_with_tool_loop,
)

logger = logging.getLogger(__name__)


async def execute_automation_strategy(
    *,
    chat_service: ChatService,
    knowledge_indexing_service: KnowledgeIndexingService | None,
    knowledge_query_service: KnowledgeQueryService | None,
    analytics_query_service: AnalyticsQueryService | None,
    idea: str,
    category: str | None,
    timeframe: str | None,
    include_key_results: bool,
    include_task_templates: bool,
    related_resources: list[KnowledgeResourceDocument] | None = None,
    analytics_context: AnalyticsQueryContext | None = None,
    provider_config: ProviderConfig,
    request_id: str | None = None,
) -> GoalAutomationResponse:
    """Generate a structured automation plan with explicit tool calls."""

    native_tool_support = supports_native_goal_tools(provider_config)
    search_notes_support = (
        native_tool_support
        and bool(related_resources)
        and knowledge_indexing_service is not None
        and knowledge_query_service is not None
    )
    fetch_stats_support = (
        native_tool_support
        and analytics_context is not None
        and analytics_query_service is not None
    )
    logger.info(
        "goal automation planning started | %s",
        compact_log(
            request_id=request_id,
            idea_preview=preview_text(idea),
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            include_task_templates=include_task_templates,
            related_resource_count=len(related_resources or []),
            has_analytics_context=analytics_context is not None,
            native_tool_support=native_tool_support,
            search_notes_support=search_notes_support,
            fetch_stats_support=fetch_stats_support,
            provider=summarize_provider_config(provider_config),
        ),
    )
    messages = [
        ChatMessage(
            role="system",
            content=build_goal_automation_system_prompt(
                use_native_tool_calling=native_tool_support,
                allow_search_notes=search_notes_support,
                allow_fetch_stats=fetch_stats_support,
            ),
        ),
        ChatMessage(
            role="user",
            content=build_goal_automation_user_prompt(
                idea=idea,
                category=category,
                timeframe=timeframe,
                include_key_results=include_key_results,
                include_task_templates=include_task_templates,
            ),
        ),
    ]
    tools = (
        build_goal_automation_native_tools(
            allow_search_notes=search_notes_support,
            allow_fetch_stats=fetch_stats_support,
        )
        if native_tool_support
        else None
    )
    completion, payload = await _complete_goal_automation_with_tools(
        chat_service=chat_service,
        knowledge_indexing_service=knowledge_indexing_service,
        knowledge_query_service=knowledge_query_service,
        analytics_query_service=analytics_query_service,
        messages=messages,
        provider_config=provider_config,
        tools=tools,
        related_resources=related_resources or [],
        analytics_context=analytics_context,
        request_id=request_id,
    )
    now_ms = int(time.time() * 1000)
    suggested_end_date = (
        now_ms + payload.goal.suggested_duration_days * 24 * 60 * 60 * 1000
    )
    response = GoalAutomationResponse(
        summary=payload.summary,
        goal=PlannedGoal(
            title=payload.goal.title,
            description=payload.goal.description,
            motivation=payload.goal.motivation,
            category=payload.goal.category,
            importance=payload.goal.importance,
            tags=payload.goal.tags,
            feasibilityAnalysis=payload.goal.feasibility_analysis,
            aiInsights=payload.goal.ai_insights,
            suggestedStartDate=now_ms,
            suggestedEndDate=suggested_end_date,
        ),
        keyResults=payload.key_results if include_key_results else None,
        taskTemplates=payload.task_templates if include_task_templates else None,
        reminders=payload.reminders,
        toolCalls=payload.tool_calls,
        usage=completion.usage,
    )
    logger.info(
        "goal automation planning completed | %s",
        compact_log(
            request_id=request_id,
            goal_title=response.goal.title,
            action_count=len(response.tool_calls),
            tool_names=[tool.tool for tool in response.tool_calls],
            reminder_count=len(response.reminders or []),
            usage=summarize_usage(response.usage),
        ),
    )
    return response


async def _complete_goal_automation_with_tools(
    *,
    chat_service: ChatService,
    knowledge_indexing_service: KnowledgeIndexingService | None,
    knowledge_query_service: KnowledgeQueryService | None,
    analytics_query_service: AnalyticsQueryService | None,
    messages: list[ChatMessage],
    provider_config: ProviderConfig,
    tools: list[ChatToolDefinition] | None,
    related_resources: list[KnowledgeResourceDocument],
    analytics_context: AnalyticsQueryContext | None,
    request_id: str | None,
):
    logger.info(
        "goal automation tool loop requested | %s",
        compact_log(
            request_id=request_id,
            tool_names=[
                tool.function.name
                for tool in tools or []
                if getattr(tool, "function", None)
            ],
            related_resource_count=len(related_resources),
            has_analytics_context=analytics_context is not None,
        ),
    )
    return await complete_with_tool_loop(
        chat_service=chat_service,
        messages=messages,
        provider_config=provider_config,
        tools=tools,
        parse_completion=parse_goal_automation_completion,
        execute_read_only_tools=lambda tool_calls: (
            _execute_goal_read_only_tool_calls(
                tool_calls,
                knowledge_indexing_service=knowledge_indexing_service,
                knowledge_query_service=knowledge_query_service,
                analytics_query_service=analytics_query_service,
                provider_config=provider_config,
                related_resources=related_resources,
                analytics_context=analytics_context,
                request_id=request_id,
            )
        ),
        unavailable_tool_detail=(
            "Provider requested goal automation tools that are not "
            "available in the current read-only runtime."
        ),
        final_submission_missing_detail=(
            "Provider did not submit a final goal automation "
            "plan after tool execution."
        ),
        request_id=request_id,
    )


async def _execute_goal_read_only_tool_calls(
    tool_calls,
    *,
    knowledge_indexing_service: KnowledgeIndexingService | None,
    knowledge_query_service: KnowledgeQueryService | None,
    analytics_query_service: AnalyticsQueryService | None,
    provider_config: ProviderConfig,
    related_resources: list[KnowledgeResourceDocument],
    analytics_context: AnalyticsQueryContext | None,
    request_id: str | None,
) -> list[ToolLoopResult]:
    results: list[ToolLoopResult] = []
    logger.info(
        "goal automation read-only tool execution started | %s",
        compact_log(
            request_id=request_id,
            tool_calls=summarize_tool_calls(tool_calls),
        ),
    )

    for index, tool_call in enumerate(tool_calls):
        if tool_call.function.name == "search_notes":
            result = await _search_notes_for_goal_planning(
                tool_call.function.arguments,
                knowledge_indexing_service=knowledge_indexing_service,
                knowledge_query_service=knowledge_query_service,
                provider_config=provider_config,
                related_resources=related_resources,
                request_id=request_id,
            )
            results.append(
                {
                    "toolCallId": tool_call.id or f"tool_call_{index}",
                    "tool": "search_notes",
                    "result": result.model_dump(mode="json"),
                }
            )
        elif tool_call.function.name == "fetch_stats":
            result = await _fetch_stats_for_goal_planning(
                tool_call.function.arguments,
                analytics_query_service=analytics_query_service,
                provider_config=provider_config,
                analytics_context=analytics_context,
                request_id=request_id,
            )
            results.append(
                {
                    "toolCallId": tool_call.id or f"tool_call_{index}",
                    "tool": "fetch_stats",
                    "result": result.model_dump(mode="json"),
                }
            )
    logger.info(
        "goal automation read-only tool execution finished | %s",
        compact_log(
            request_id=request_id,
            result_count=len(results),
            result_tools=[result["tool"] for result in results],
        ),
    )
    return results


async def _search_notes_for_goal_planning(
    arguments: str,
    *,
    knowledge_indexing_service: KnowledgeIndexingService | None,
    knowledge_query_service: KnowledgeQueryService | None,
    provider_config: ProviderConfig,
    related_resources: list[KnowledgeResourceDocument],
    request_id: str | None,
) -> GoalAutomationSearchNotesResult:
    if not related_resources:
        from ai_service.errors import StructuredOutputError

        raise StructuredOutputError(
            detail="search_notes requires related repository resources."
        )

    if (
        knowledge_indexing_service is None
        or knowledge_query_service is None
    ):
        from ai_service.errors import StructuredOutputError

        raise StructuredOutputError(
            detail="search_notes is unavailable in the current AI runtime."
        )

    query, max_citations = parse_search_notes_tool_arguments(arguments)
    logger.info(
        "goal automation search_notes executing | %s",
        compact_log(
            request_id=request_id,
            query=query,
            max_citations=max_citations,
            related_resource_count=len(related_resources),
        ),
    )
    indexed_resources = [
        knowledge_indexing_service.index_resource(resource)
        for resource in related_resources
    ]
    citations = await knowledge_query_service.select_citations(
        question=query,
        indexed_resources=indexed_resources,
        provider_config=provider_config,
        max_citations=max_citations,
    )
    result = GoalAutomationSearchNotesResult(
        query=query,
        citations=citations,
    )
    logger.info(
        "goal automation search_notes completed | %s",
        compact_log(
            request_id=request_id,
            query=query,
            citation_count=len(result.citations),
        ),
    )
    return result


async def _fetch_stats_for_goal_planning(
    arguments: str,
    *,
    analytics_query_service: AnalyticsQueryService | None,
    provider_config: ProviderConfig,
    analytics_context: AnalyticsQueryContext | None,
    request_id: str | None,
) -> GoalAutomationFetchStatsResult:
    if analytics_context is None:
        from ai_service.errors import StructuredOutputError

        raise StructuredOutputError(
            detail="fetch_stats requires analytics context."
        )

    if analytics_query_service is None:
        from ai_service.errors import StructuredOutputError

        raise StructuredOutputError(
            detail="fetch_stats is unavailable in the current AI runtime."
        )

    question = parse_fetch_stats_tool_arguments(arguments)
    logger.info(
        "goal automation fetch_stats executing | %s",
        compact_log(
            request_id=request_id,
            question=question,
            has_dashboard=analytics_context.dashboard is not None,
            has_task_dashboard=analytics_context.task_dashboard is not None,
        ),
    )
    response = await analytics_query_service.query(
        question=question,
        context=analytics_context,
        provider_config=provider_config,
    )
    result = GoalAutomationFetchStatsResult(
        question=question,
        answer=response.answer,
        highlights=response.highlights,
    )
    logger.info(
        "goal automation fetch_stats completed | %s",
        compact_log(
            request_id=request_id,
            question=question,
            highlight_count=len(result.highlights),
            answer_preview=preview_text(result.answer),
        ),
    )
    return result
