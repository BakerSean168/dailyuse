"""Service for structured goal planning."""

from __future__ import annotations

import json
import time

from pydantic import ValidationError

from ai_service.errors import StructuredOutputError
from ai_service.schemas import (
    ChatMessage,
    ClarificationQuestion,
    GoalAutomationLLMResponse,
    GoalAutomationResponse,
    GoalClarificationLLMResponse,
    GoalPlanningLLMResponse,
    GoalPlanningResponse,
    PlannedGoal,
    ProviderConfig,
)
from ai_service.services.chat_service import ChatService


class GoalPlanningService:
    """Generate structured goal drafts through the shared chat service."""

    def __init__(self, chat_service: ChatService) -> None:
        self._chat_service = chat_service

    async def plan(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        provider_config: ProviderConfig,
    ) -> GoalPlanningResponse:
        """Generate and validate a structured goal draft."""

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

        payload = parse_goal_payload(completion.content)
        now_ms = int(time.time() * 1000)
        suggested_end_date = (
            now_ms + payload.goal.suggested_duration_days * 24 * 60 * 60 * 1000
        )

        return GoalPlanningResponse(
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

    async def plan_automation(
        self,
        *,
        idea: str,
        category: str | None,
        timeframe: str | None,
        include_key_results: bool,
        include_task_templates: bool,
        provider_config: ProviderConfig,
    ) -> GoalAutomationResponse:
        """Generate a structured automation plan with explicit tool calls."""

        completion = await self._chat_service.complete(
            messages=[
                ChatMessage(
                    role="system", content=build_goal_automation_system_prompt()
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
            ],
            config=provider_config,
        )

        payload = parse_goal_automation_payload(completion.content)
        now_ms = int(time.time() * 1000)
        suggested_end_date = (
            now_ms + payload.goal.suggested_duration_days * 24 * 60 * 60 * 1000
        )

        return GoalAutomationResponse(
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

    async def clarify(
        self,
        *,
        idea: str,
        category: str | None,
        provider_config: ProviderConfig,
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

        payload = parse_clarification_payload(completion.content)

        # If clarification is needed, return questions
        if payload.needs_clarification:
            return GoalPlanningResponse(
                state="clarification",
                clarification=payload,
                usage=completion.usage,
            )

        # If ready, return draft state (caller will continue with plan())
        return GoalPlanningResponse(
            state="draft",
            clarification=None,
            usage=completion.usage,
        )

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

        # Step 1: Check if clarification is needed (if enabled and no answers yet)
        if enable_clarification and not clarification_answers:
            clarification_response = await self.clarify(
                idea=idea,
                category=category,
                provider_config=provider_config,
            )

            # If clarification is required, return questions to caller
            if clarification_response.state == "clarification":
                return clarification_response

        # Step 2: Augment idea with clarification answers if provided
        augmented_idea = idea
        if clarification_answers:
            # Combine the original idea with the answers
            answers_text = "\n".join(
                f"Q: {answer}" for answer in clarification_answers if answer.strip()
            )
            augmented_idea = f"{idea}\n\nAdditional context:\n{answers_text}"

        # Step 3: Generate the actual goal draft
        return await self.plan(
            idea=augmented_idea,
            category=category,
            timeframe=timeframe,
            include_key_results=include_key_results,
            provider_config=provider_config,
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


def build_goal_automation_system_prompt() -> str:
    """Return the structured output contract for goal automation planning."""

    return "\n".join(
        [
            (
                "You are an assistant that converts a rough goal idea into an "
                "execution plan with explicit tool calls."
            ),
            "Respond with JSON only.",
            "Do not include markdown code fences.",
            (
                "Allowed tools: create_goal, create_key_result, "
                "create_task_template, search_notes, fetch_stats."
            ),
            "Use create_goal exactly once.",
            (
                "For create_key_result and create_task_template, set index "
                "to the matching array item index."
            ),
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
            "Keep the plan concise and execution-oriented.",
        ]
    )


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
            "- If the idea is vague, unclear, or missing key information, set needsClarification to true.",
            "- Generate 2-4 clarification questions that help fill information gaps.",
            "- Focus on: motivation, success criteria, timeline, scope, constraints.",
            "- Keep each question concise (< 15 words).",
            "- Provide context for each question explaining why it matters.",
            "- If the idea is already clear and specific, set needsClarification to false.",
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


def strip_code_fence(content: str) -> str:
    """Handle models that wrap JSON in markdown fences despite instructions."""

    trimmed = content.strip()
    if not trimmed.startswith("```"):
        return trimmed

    without_opening = trimmed.split("\n", 1)[1] if "\n" in trimmed else ""
    return without_opening.rsplit("```", 1)[0].strip()
