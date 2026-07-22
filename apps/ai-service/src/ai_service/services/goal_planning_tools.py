"""Tool definitions and argument parsers for goal automation."""

from __future__ import annotations

import json
from typing import Any

from ai_service.errors import StructuredOutputError
from ai_service.schemas import (
    ChatToolDefinition,
    ProviderConfig,
)


def build_goal_automation_submission_tool() -> ChatToolDefinition:
    """Return the provider-native function schema for automation planning."""

    importance = ["Vital", "Important", "Moderate", "Minor", "Trivial"]
    cadence = ["daily", "weekly", "once"]
    return ChatToolDefinition.model_validate(
        {
            "type": "function",
            "function": {
                "name": "submit_goal_automation_plan",
                "description": (
                    "Submit the final goal automation plan, including draft goal, "
                    "optional key results, optional task templates, optional "
                    "reminders, and proposed tool calls."
                ),
                # Keep the tool schema within the JSON Schema subset accepted by
                # OpenAI-compatible providers such as Google AI Studio. The
                # returned arguments are still validated by
                # GoalAutomationLLMResponse after the provider call.
                "parameters": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"},
                        "goal": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "motivation": {"type": "string"},
                                "category": {
                                    "type": "string",
                                    "enum": [
                                        "work",
                                        "health",
                                        "learning",
                                        "personal",
                                        "finance",
                                        "relationship",
                                        "other",
                                    ],
                                },
                                "importance": {
                                    "type": "string",
                                    "enum": importance,
                                },
                                "tags": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "feasibilityAnalysis": {"type": "string"},
                                "aiInsights": {"type": "string"},
                                "suggestedDurationDays": {"type": "integer"},
                            },
                            "required": ["title", "description"],
                        },
                        "keyResults": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "targetValue": {"type": "integer"},
                                    "unit": {"type": "string"},
                                },
                                "required": ["title"],
                            },
                        },
                        "taskTemplates": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "importance": {
                                        "type": "string",
                                        "enum": importance,
                                    },
                                    "cadence": {
                                        "type": "string",
                                        "enum": cadence,
                                    },
                                },
                                "required": ["name"],
                            },
                        },
                        "reminders": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "importance": {
                                        "type": "string",
                                        "enum": importance,
                                    },
                                    "cadence": {
                                        "type": "string",
                                        "enum": cadence,
                                    },
                                    "timeOfDay": {"type": "string"},
                                },
                                "required": ["title"],
                            },
                        },
                        "toolCalls": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "tool": {
                                        "type": "string",
                                        "enum": [
                                            "create_goal",
                                            "create_key_result",
                                            "create_task_template",
                                            "create_reminder",
                                            "search_notes",
                                            "fetch_stats",
                                        ],
                                    },
                                    "index": {"type": "integer"},
                                    "rationale": {"type": "string"},
                                },
                                "required": ["tool"],
                            },
                        },
                    },
                    "required": ["summary", "goal", "toolCalls"],
                },
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
                    "Search the provided knowledge notes for evidence that can "
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
