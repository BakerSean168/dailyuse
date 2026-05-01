"""Service for structured goal planning."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from pydantic import ValidationError

from ai_service.errors import StructuredOutputError
from ai_service.logging_utils import (
    compact_log,
    preview_text,
    summarize_completion,
    summarize_provider_config,
    summarize_tool_calls,
    summarize_usage,
)
from ai_service.schemas import (
    AnalyticsQueryContext,
    ChatMessage,
    ChatToolDefinition,
    GoalAutomationFetchStatsResult,
    GoalAutomationLLMResponse,
    GoalAutomationResponse,
    GoalAutomationSearchNotesResult,
    GoalClarificationLLMResponse,
    GoalPlanningLLMResponse,
    GoalPlanningResponse,
    KnowledgeResourceDocument,
    PlannedGoal,
    ProviderConfig,
)
from ai_service.services.analytics_query_service import AnalyticsQueryService
from ai_service.services.chat_service import ChatService
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
)
from ai_service.services.provider_tool_runtime import (
    ToolLoopResult,
    complete_with_tool_loop,
    extract_completion_tool_calls,
)

logger = logging.getLogger(__name__)


class GoalPlanningService:
    """Generate structured goal drafts through the shared chat service."""

    def __init__(
        self,
        chat_service: ChatService,
        knowledge_indexing_service: KnowledgeIndexingService | None = None,
        knowledge_query_service: KnowledgeQueryService | None = None,
        analytics_query_service: AnalyticsQueryService | None = None,
    ) -> None:
        self._chat_service = chat_service
        self._knowledge_indexing_service = knowledge_indexing_service
        self._knowledge_query_service = knowledge_query_service
        self._analytics_query_service = analytics_query_service

    async def plan(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        provider_config: ProviderConfig,
        request_id: str | None = None,
    ) -> GoalPlanningResponse:
        """Generate and validate a structured goal draft."""

        logger.info(
            "goal planning started | %s",
            compact_log(
                request_id=request_id,
                idea_preview=preview_text(idea),
                category=category,
                timeframe=timeframe,
                include_key_results=include_key_results,
                provider=summarize_provider_config(provider_config),
            ),
        )
        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(role="system", content=build_goal_system_prompt()),
                ChatMessage(
                    role="user",
                    content=build_goal_user_prompt(
                        idea=idea,
                        category=category,
                        timeframe=timeframe,
                        include_key_results=include_key_results,
                    ),
                ),
            ],
            config=provider_config,
        )
        logger.info(
            "goal planning completion received | %s",
            compact_log(
                request_id=request_id,
                completion=summarize_completion(completion),
            ),
        )

        try:
            payload = parse_goal_payload(completion.content)
        except StructuredOutputError:
            logger.exception(
                "goal planning payload parsing failed | %s",
                compact_log(
                    request_id=request_id,
                    completion=summarize_completion(completion),
                ),
            )
            raise
        now_ms = int(time.time() * 1000)
        suggested_end_date = (
            now_ms + payload.goal.suggested_duration_days * 24 * 60 * 60 * 1000
        )
        response = GoalPlanningResponse(
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
            usage=completion.usage,
        )
        logger.info(
            "goal planning completed | %s",
            compact_log(
                request_id=request_id,
                goal_title=response.goal.title if response.goal is not None else None,
                key_result_count=len(response.key_results or []),
                usage=summarize_usage(response.usage),
            ),
        )
        return response

    async def plan_automation(
        self,
        *,
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
            and self._knowledge_indexing_service is not None
            and self._knowledge_query_service is not None
        )
        fetch_stats_support = (
            native_tool_support
            and analytics_context is not None
            and self._analytics_query_service is not None
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
        completion, payload = await self._complete_goal_automation_with_tools(
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
                usage=summarize_usage(response.usage),
            ),
        )
        return response

    async def _complete_goal_automation_with_tools(
        self,
        *,
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
            chat_service=self._chat_service,
            messages=messages,
            provider_config=provider_config,
            tools=tools,
            parse_completion=parse_goal_automation_completion,
            execute_read_only_tools=lambda tool_calls: (
                self._execute_goal_read_only_tool_calls(
                    tool_calls,
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
        self,
        tool_calls,
        *,
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
                result = await self._search_notes_for_goal_planning(
                    tool_call.function.arguments,
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
                result = await self._fetch_stats_for_goal_planning(
                    tool_call.function.arguments,
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
        self,
        arguments: str,
        *,
        provider_config: ProviderConfig,
        related_resources: list[KnowledgeResourceDocument],
        request_id: str | None,
    ) -> GoalAutomationSearchNotesResult:
        if not related_resources:
            raise StructuredOutputError(
                detail="search_notes requires related repository resources."
            )

        if (
            self._knowledge_indexing_service is None
            or self._knowledge_query_service is None
        ):
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
            self._knowledge_indexing_service.index_resource(resource)
            for resource in related_resources
        ]
        citations = await self._knowledge_query_service.select_citations(
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
        self,
        arguments: str,
        *,
        provider_config: ProviderConfig,
        analytics_context: AnalyticsQueryContext | None,
        request_id: str | None,
    ) -> GoalAutomationFetchStatsResult:
        if analytics_context is None:
            raise StructuredOutputError(
                detail="fetch_stats requires analytics context."
            )

        if self._analytics_query_service is None:
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
        response = await self._analytics_query_service.query(
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

    async def clarify(
        self,
        *,
        idea: str,
        category: str | None,
        provider_config: ProviderConfig,
        request_id: str | None = None,
    ) -> GoalPlanningResponse:
        """Check if a goal idea needs clarification before planning.

        Args:
            idea: The goal idea to check
            category: Optional category for context
            provider_config: Configuration for the provider

        Returns:
            GoalPlanningResponse with state='clarification' if questions needed,
            state='draft' if ready to plan
        """
        logger.info(
            "goal clarification started | %s",
            compact_log(
                request_id=request_id,
                idea_preview=preview_text(idea),
                category=category,
                provider=summarize_provider_config(provider_config),
            ),
        )
        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(
                    role="system",
                    content=build_goal_clarification_system_prompt(),
                ),
                ChatMessage(
                    role="user",
                    content=build_goal_clarification_user_prompt(
                        idea=idea,
                        category=category,
                    ),
                ),
            ],
            config=provider_config,
        )
        logger.info(
            "goal clarification completion received | %s",
            compact_log(
                request_id=request_id,
                completion=summarize_completion(completion),
            ),
        )

        try:
            payload = parse_clarification_payload(completion.content)
        except StructuredOutputError:
            logger.exception(
                "goal clarification payload parsing failed | %s",
                compact_log(
                    request_id=request_id,
                    completion=summarize_completion(completion),
                ),
            )
            raise

        # If clarification is needed, return questions
        if payload.needs_clarification:
            response = GoalPlanningResponse(
                state="clarification",
                clarification=payload,
                usage=completion.usage,
            )
            logger.info(
                "goal clarification requested follow-up questions | %s",
                compact_log(
                    request_id=request_id,
                    question_count=len(payload.questions),
                    rationale=preview_text(payload.rationale),
                    usage=summarize_usage(response.usage),
                ),
            )
            return response

        # If ready, return draft state (caller will continue with plan())
        response = GoalPlanningResponse(
            state="draft",
            clarification=None,
            usage=completion.usage,
        )
        logger.info(
            "goal clarification determined no follow-up is needed | %s",
            compact_log(
                request_id=request_id,
                usage=summarize_usage(response.usage),
            ),
        )
        return response

    async def plan_with_clarification(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        provider_config: ProviderConfig,
        enable_clarification: bool = True,
        clarification_answers: list[str] | None = None,
        request_id: str | None = None,
    ) -> GoalPlanningResponse:
        """Generate a goal plan with optional clarification step.

        This is the main entry point that handles the two-stage workflow:
        1. If enable_clarification=True and no answers, check if clarification needed
        2. If clarification needed, return questions for user to answer
        3. If answers provided, augment idea with them
        4. Generate and return goal draft

        Args:
            idea: The goal idea
            category: Optional category
            timeframe: Optional timeframe
            include_key_results: Whether to include key results
            provider_config: Provider configuration
            enable_clarification: Whether to do clarification check
            clarification_answers: Answers to previous clarification questions

        Returns:
            GoalPlanningResponse with either clarification questions or draft
        """
        logger.info(
            "goal planning with clarification started | %s",
            compact_log(
                request_id=request_id,
                idea_preview=preview_text(idea),
                category=category,
                timeframe=timeframe,
                include_key_results=include_key_results,
                enable_clarification=enable_clarification,
                clarification_answers_count=len(clarification_answers or []),
            ),
        )
        # Step 1: Check if clarification is needed (if enabled and no answers yet)
        if enable_clarification and not clarification_answers:
            clarification_response = await self.clarify(
                idea=idea,
                category=category,
                provider_config=provider_config,
                request_id=request_id,
            )

            # If clarification is required, return questions to caller
            if clarification_response.state == "clarification":
                logger.info(
                    "goal planning stopped at clarification stage | %s",
                    compact_log(
                        request_id=request_id,
                        question_count=(
                            len(clarification_response.clarification.questions)
                            if clarification_response.clarification
                            else 0
                        ),
                    ),
                )
                return clarification_response

        # Step 2: Augment idea with clarification answers if provided
        augmented_idea = idea
        if clarification_answers:
            # Combine the original idea with the answers
            answers_text = "\n".join(
                f"Q: {answer}" for answer in clarification_answers if answer.strip()
            )
            augmented_idea = f"{idea}\n\nAdditional context:\n{answers_text}"
            logger.info(
                "goal planning augmented idea with clarification answers | %s",
                compact_log(
                    request_id=request_id,
                    clarification_answers_count=len(clarification_answers),
                    augmented_idea_preview=preview_text(augmented_idea),
                ),
            )

        # Step 3: Generate the actual goal draft
        return await self.plan(
            idea=augmented_idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            provider_config=provider_config,
            request_id=request_id,
        )


def build_goal_system_prompt() -> str:
    """Return the structured output contract for goal generation."""

    return "\n".join(
        [
            (
                "You are an assistant that turns a rough idea into a practical "
                "personal goal draft."
            ),
            "Respond with JSON only.",
            "Do not include markdown code fences.",
            "JSON shape:",
            "{",
            '  "goal": {',
            '    "title": string,',
            '    "description": string,',
            '    "motivation": string,',
            (
                '    "category": "work" | "health" | "learning" | "personal" | '
                '"finance" | "relationship" | "other",'
            ),
            (
                '    "importance": "Vital" | "Important" | "Moderate" | '
                '"Minor" | "Trivial",'
            ),
            '    "tags": string[],',
            '    "feasibilityAnalysis": string,',
            '    "aiInsights": string,',
            '    "suggestedDurationDays": number',
            "  },",
            '  "keyResults": [',
            "    {",
            '      "title": string,',
            '      "description": string,',
            '      "targetValue": number,',
            '      "unit": string',
            "    }",
            "  ]",
            "}",
            "Keep the output realistic, specific, and concise.",
        ]
    )


def build_goal_user_prompt(
    *,
    idea: str,
    category: str | None,
    timeframe: str | None,
    include_key_results: bool,
) -> str:
    """Build the goal-generation user prompt."""

    return "\n".join(
        filter(
            None,
            [
                f"Idea: {idea}",
                f"Preferred category: {category}" if category else None,
                f"Preferred timeframe: {timeframe}" if timeframe else None,
                (
                    "Include key results: yes"
                    if include_key_results
                    else "Include key results: no"
                ),
            ],
        )
    )


def build_goal_automation_system_prompt(
    *,
    use_native_tool_calling: bool = False,
    allow_search_notes: bool = False,
    allow_fetch_stats: bool = False,
) -> str:
    """Return the structured output contract for goal automation planning."""

    lines = [
        (
            "You are an assistant that converts a rough goal idea into an "
            "execution plan with explicit tool calls."
        ),
        (
            "Allowed tools: create_goal, create_key_result, "
            "create_task_template, search_notes, fetch_stats."
        ),
        "Use create_goal exactly once.",
        (
            "For create_key_result and create_task_template, set index "
            "to the matching array item index."
        ),
    ]

    if use_native_tool_calling:
        lines.extend(
            [
                "When the submit_goal_automation_plan tool is available, "
                "call it exactly once.",
                "Do not answer with free-form JSON when you can call the tool.",
                (
                    "Use search_notes only when repository resources are available "
                    "and external note evidence would materially improve the plan."
                )
                if allow_search_notes
                else "Do not request unavailable read-only tools.",
                (
                    "Use fetch_stats only when analytics context is available "
                    "and concrete product metrics would materially improve the plan."
                )
                if allow_fetch_stats
                else (
                    "Do not request fetch_stats unless analytics "
                    "context is available."
                ),
            ]
        )
    else:
        lines.extend(
            [
                "Respond with JSON only.",
                "Do not include markdown code fences.",
                "JSON shape:",
                "{",
                '  "summary": string,',
                '  "goal": {',
                '    "title": string,',
                '    "description": string,',
                '    "motivation": string,',
                (
                    '    "category": "work" | "health" | "learning" | "personal" | '
                    '"finance" | "relationship" | "other",'
                ),
                (
                    '    "importance": "Vital" | "Important" | "Moderate" | '
                    '"Minor" | "Trivial",'
                ),
                '    "tags": string[],',
                '    "feasibilityAnalysis": string,',
                '    "aiInsights": string,',
                '    "suggestedDurationDays": number',
                "  },",
                '  "keyResults": [',
                "    {",
                '      "title": string,',
                '      "description": string,',
                '      "targetValue": number,',
                '      "unit": string',
                "    }",
                "  ],",
                '  "taskTemplates": [',
                "    {",
                '      "name": string,',
                '      "description": string,',
                (
                    '      "importance": "Vital" | "Important" | "Moderate" | '
                    '"Minor" | "Trivial",'
                ),
                '      "cadence": "daily" | "weekly" | "once"',
                "    }",
                "  ],",
                '  "toolCalls": [',
                "    {",
                (
                    '      "tool": "create_goal" | "create_key_result" | '
                    '"create_task_template" | "search_notes" | "fetch_stats",'
                ),
                '      "index": number | null,',
                '      "rationale": string',
                "    }",
                "  ]",
                "}",
            ]
        )

    lines.append("Keep the plan concise and execution-oriented.")
    return "\n".join(lines)


def build_goal_automation_user_prompt(
    *,
    idea: str,
    category: str | None,
    timeframe: str | None,
    include_key_results: bool,
    include_task_templates: bool,
) -> str:
    """Build the automation-planning user prompt."""

    return "\n".join(
        filter(
            None,
            [
                f"Idea: {idea}",
                f"Preferred category: {category}" if category else None,
                f"Preferred timeframe: {timeframe}" if timeframe else None,
                (
                    "Include key results: yes"
                    if include_key_results
                    else "Include key results: no"
                ),
                (
                    "Include task templates: yes"
                    if include_task_templates
                    else "Include task templates: no"
                ),
            ],
        )
    )


def build_goal_clarification_system_prompt() -> str:
    """System prompt for determining if a goal needs clarification."""

    return "\n".join(
        [
            (
                "You are an assistant that determines whether a goal idea "
                "is clear enough for structured planning."
            ),
            "Respond with JSON only.",
            "Do not include markdown code fences.",
            "JSON shape:",
            "{",
            '  "needsClarification": boolean,',
            '  "questions": [',
            "    {",
            '      "question": string,',
            '      "context": string | null',
            "    }",
            "  ],",
            '  "rationale": string | null',
            "}",
            "",
            "Guidelines:",
            "- If the idea is vague, unclear, or missing key "
            "information, set needsClarification to true.",
            "- Generate 2-4 clarification questions that help fill information gaps.",
            "- Focus on: motivation, success criteria, timeline, scope, constraints.",
            "- Keep each question concise (< 15 words).",
            "- Provide context for each question explaining why it matters.",
            "- If the idea is already clear and specific, "
            "set needsClarification to false.",
            "- Always explain rationale when clarification is needed.",
        ]
    )


def build_goal_clarification_user_prompt(
    *,
    idea: str,
    category: str | None = None,
) -> str:
    """Build user prompt for clarification check.

    Args:
        idea: The goal idea to evaluate
        category: Optional category hint for context

    Returns:
        User prompt string
    """
    return "\n".join(
        filter(
            None,
            [
                f"Goal idea: {idea}",
                f"Category: {category}" if category else None,
                "",
                (
                    "Determine if this goal idea is clear enough for planning, "
                    "or if it needs clarification. If clarification is needed, "
                    "suggest 2-4 clarification questions."
                ),
            ],
        )
    )


def parse_clarification_payload(content: str) -> GoalClarificationLLMResponse:
    """Parse and validate clarification response from the model.

    Args:
        content: Raw model output

    Returns:
        Validated GoalClarificationLLMResponse

    Raises:
        StructuredOutputError: If parsing or validation fails
    """
    try:
        parsed = json.loads(strip_code_fence(content))
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail="Provider returned invalid JSON for goal clarification."
        ) from exc

    try:
        return GoalClarificationLLMResponse.model_validate(parsed)
    except ValidationError as exc:
        raise StructuredOutputError(
            detail="Provider returned an invalid goal clarification payload."
        ) from exc


def parse_goal_payload(content: str) -> GoalPlanningLLMResponse:
    """Parse and validate the JSON payload returned by the model."""

    try:
        parsed = json.loads(strip_code_fence(content))
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail="Provider returned invalid JSON for goal planning."
        ) from exc

    try:
        return GoalPlanningLLMResponse.model_validate(parsed)
    except ValidationError as exc:
        raise StructuredOutputError(
            detail="Provider returned an invalid goal planning payload."
        ) from exc


def parse_goal_automation_payload(content: str) -> GoalAutomationLLMResponse:
    """Parse and validate the JSON payload returned for automation planning."""

    try:
        parsed = json.loads(strip_code_fence(content))
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail="Provider returned invalid JSON for goal automation planning."
        ) from exc

    try:
        return GoalAutomationLLMResponse.model_validate(parsed)
    except ValidationError as exc:
        raise StructuredOutputError(
            detail="Provider returned an invalid goal automation payload."
        ) from exc


def parse_goal_automation_completion(completion: Any) -> GoalAutomationLLMResponse:
    """Parse automation output from either native tool calls or JSON content."""

    tool_calls = extract_completion_tool_calls(completion)
    for tool_call in tool_calls:
        if tool_call.function.name != "submit_goal_automation_plan":
            continue
        return parse_goal_automation_tool_arguments(tool_call.function.arguments)

    return parse_goal_automation_payload(completion.content)


def parse_goal_automation_tool_arguments(arguments: str) -> GoalAutomationLLMResponse:
    """Parse and validate tool-call arguments for automation planning."""

    try:
        parsed = json.loads(arguments)
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail=(
                "Provider returned invalid tool arguments "
                "for goal automation planning."
            )
        ) from exc

    try:
        return GoalAutomationLLMResponse.model_validate(parsed)
    except ValidationError as exc:
        raise StructuredOutputError(
            detail="Provider returned an invalid goal automation tool payload."
        ) from exc


def build_goal_automation_submission_tool() -> ChatToolDefinition:
    """Return the provider-native function schema for automation planning."""

    return ChatToolDefinition.model_validate(
        {
            "type": "function",
            "function": {
                "name": "submit_goal_automation_plan",
                "description": (
                    "Submit the final goal automation plan, including draft goal, "
                    "optional key results, optional task templates, "
                    "and proposed tool calls."
                ),
                "parameters": GoalAutomationLLMResponse.model_json_schema(
                    by_alias=True
                ),
            },
        }
    )


def build_goal_automation_search_notes_tool() -> ChatToolDefinition:
    """Return the provider-native read-only search tool for repository notes."""

    return ChatToolDefinition.model_validate(
        {
            "type": "function",
            "function": {
                "name": "search_notes",
                "description": (
                    "Search the provided repository resources for evidence that can "
                    "improve the goal automation plan."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": (
                                "What evidence or context "
                                "to look for in the notes."
                            ),
                        },
                        "maxCitations": {
                            "type": "integer",
                            "description": (
                                "Maximum number of supporting "
                                "excerpts to return."
                            ),
                            "minimum": 1,
                            "maximum": 6,
                            "default": 3,
                        },
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                },
            },
        }
    )


def build_goal_automation_fetch_stats_tool() -> ChatToolDefinition:
    """Return the provider-native read-only analytics tool for goal planning."""

    return ChatToolDefinition.model_validate(
        {
            "type": "function",
            "function": {
                "name": "fetch_stats",
                "description": (
                    "Answer an analytics question from the provided structured "
                    "product metrics and dashboards."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "question": {
                            "type": "string",
                            "description": (
                                "The concrete analytics question to answer from the "
                                "available read-only context."
                            ),
                        }
                    },
                    "required": ["question"],
                    "additionalProperties": False,
                },
            },
        }
    )


def build_goal_automation_native_tools(
    *, allow_search_notes: bool, allow_fetch_stats: bool
) -> list[ChatToolDefinition]:
    """Return the provider-native tools exposed during automation planning."""

    tools = [build_goal_automation_submission_tool()]
    if allow_search_notes:
        tools.append(build_goal_automation_search_notes_tool())
    if allow_fetch_stats:
        tools.append(build_goal_automation_fetch_stats_tool())
    return tools


def parse_search_notes_tool_arguments(arguments: str) -> tuple[str, int]:
    """Parse read-only note-search arguments from a provider tool call."""

    try:
        parsed = json.loads(arguments)
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail="Provider returned invalid tool arguments for search_notes."
        ) from exc

    query = parsed.get("query")
    if not isinstance(query, str) or not query.strip():
        raise StructuredOutputError(
            detail="Provider returned an invalid search_notes query."
        )

    raw_max_citations = parsed.get("maxCitations", 3)
    if not isinstance(raw_max_citations, int):
        raise StructuredOutputError(
            detail="Provider returned an invalid search_notes maxCitations value."
        )

    return query.strip(), max(1, min(raw_max_citations, 6))


def parse_fetch_stats_tool_arguments(arguments: str) -> str:
    """Parse analytics-question arguments from a provider tool call."""

    try:
        parsed = json.loads(arguments)
    except json.JSONDecodeError as exc:
        raise StructuredOutputError(
            detail="Provider returned invalid tool arguments for fetch_stats."
        ) from exc

    question = parsed.get("question")
    if not isinstance(question, str) or not question.strip():
        raise StructuredOutputError(
            detail="Provider returned an invalid fetch_stats question."
        )

    return question.strip()


def supports_native_goal_tools(
    provider_config: ProviderConfig | dict[str, Any],
) -> bool:
    """Return whether the provider can use native function calling for goal planning."""

    provider_name = (
        provider_config.provider
        if isinstance(provider_config, ProviderConfig)
        else str(provider_config.get("provider", ""))
    )
    return provider_name.lower() == "openai"


def strip_code_fence(content: str) -> str:
    """Handle models that wrap JSON in markdown fences despite instructions."""

    trimmed = content.strip()
    if not trimmed.startswith("```"):
        return trimmed

    without_opening = trimmed.split("\n", 1)[1] if "\n" in trimmed else ""
    return without_opening.rsplit("```", 1)[0].strip()
