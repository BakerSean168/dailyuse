"""Service for structured goal planning.

This module is the public orchestration layer.  Strategy implementations
(automation planning with tool loops) live in ``goal_planning_strategies``.
"""

from __future__ import annotations

import logging
import time

from ai_service.logging_utils import (
    compact_log,
    preview_text,
    summarize_completion,
    summarize_provider_config,
    summarize_usage,
)
from ai_service.schemas import (
    AnalyticsQueryContext,
    ChatMessage,
    GoalAutomationResponse,
    GoalPlanningResponse,
    KnowledgeResourceDocument,
    PlannedGoal,
    ProviderConfig,
)
from ai_service.services.analytics_query_service import AnalyticsQueryService
from ai_service.services.chat_service import ChatService

# Re-export helpers for backward compatibility
from ai_service.services.goal_planning_parsers import (  # noqa: F401
    parse_clarification_payload,
    parse_goal_automation_payload,
    parse_goal_automation_tool_arguments,
    parse_goal_payload,
    strip_code_fence,  # noqa: F401
)
from ai_service.services.goal_planning_prompts import (
    build_goal_clarification_system_prompt,
    build_goal_clarification_user_prompt,
    build_goal_system_prompt,
    build_goal_user_prompt,
)
from ai_service.services.goal_planning_strategies import execute_automation_strategy
from ai_service.services.goal_planning_tools import (  # noqa: F401
    build_goal_automation_fetch_stats_tool,
    build_goal_automation_search_notes_tool,
    build_goal_automation_submission_tool,
)
from ai_service.services.knowledge_query_service import (
    KnowledgeIndexingService,
    KnowledgeQueryService,
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
        locale: str = "en-US",
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
                ChatMessage(
                    role="system",
                    content=build_goal_system_prompt(locale=locale),
                ),
                ChatMessage(
                    role="user",
                    content=build_goal_user_prompt(
                        idea=idea,
                        category=category,
                        timeframe=timeframe,
                        include_key_results=include_key_results,
                        locale=locale,
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
        except Exception:
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
        locale: str = "en-US",
        request_id: str | None = None,
    ) -> GoalAutomationResponse:
        """Generate a structured automation plan with explicit tool calls.

        Delegates to :func:`execute_automation_strategy` in
        ``goal_planning_strategies``.
        """

        return await execute_automation_strategy(
            chat_service=self._chat_service,
            knowledge_indexing_service=self._knowledge_indexing_service,
            knowledge_query_service=self._knowledge_query_service,
            analytics_query_service=self._analytics_query_service,
            idea=idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            include_task_templates=include_task_templates,
            related_resources=related_resources,
            analytics_context=analytics_context,
            provider_config=provider_config,
            locale=locale,
            request_id=request_id,
        )

    async def clarify(
        self,
        *,
        idea: str,
        category: str | None,
        provider_config: ProviderConfig,
        timeframe: str | None = None,
        locale: str = "en-US",
        request_id: str | None = None,
    ) -> GoalPlanningResponse:
        """Check if a goal idea needs clarification before planning.

        Args:
            idea: The goal idea to check
            category: Optional category for context
            provider_config: Configuration for the provider
            timeframe: Optional timeframe already supplied by the user

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
                timeframe=timeframe,
                provider=summarize_provider_config(provider_config),
            ),
        )
        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(
                    role="system",
                    content=build_goal_clarification_system_prompt(locale=locale),
                ),
                ChatMessage(
                    role="user",
                    content=build_goal_clarification_user_prompt(
                        idea=idea,
                        category=category,
                        timeframe=timeframe,
                        locale=locale,
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
        except Exception:
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
        locale: str = "en-US",
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
                timeframe=timeframe,
                locale=locale,
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
            answer_prefix = "补充信息" if locale == "zh-CN" else "Additional context"
            answers_text = "\n".join(
                f"- {answer}" for answer in clarification_answers if answer.strip()
            )
            augmented_idea = f"{idea}\n\n{answer_prefix}:\n{answers_text}"
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
            locale=locale,
            request_id=request_id,
        )
