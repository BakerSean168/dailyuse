"""Prompt builders for goal planning, automation, and clarification."""

from __future__ import annotations


def _output_language_instruction(locale: str) -> str:
    if locale == "zh-CN":
        return (
            "Write every user-facing title, description, question, rationale, "
            "unit, task, and reminder in Simplified Chinese. Keep JSON keys and "
            "enum values exactly as specified."
        )
    return (
        "Write every user-facing title, description, question, rationale, unit, "
        "task, and reminder in English. Keep JSON keys and enum values exactly "
        "as specified."
    )


def build_goal_system_prompt(*, locale: str = "en-US") -> str:
    """Return the structured output contract for goal generation."""

    return "\n".join(
        [
            (
                "You are an assistant that turns a rough idea into a practical "
                "personal goal draft."
            ),
            "Respond with JSON only.",
            "Do not include markdown code fences.",
            _output_language_instruction(locale),
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
    locale: str = "en-US",
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
                f"UI locale: {locale}",
            ],
        )
    )


def build_goal_automation_system_prompt(
    *,
    use_native_tool_calling: bool = False,
    allow_search_notes: bool = False,
    allow_fetch_stats: bool = False,
    locale: str = "en-US",
) -> str:
    """Return the structured output contract for goal automation planning."""

    lines = [
        (
            "You are an assistant that converts a rough goal idea into an "
            "execution plan with explicit tool calls."
        ),
        (
            "Allowed tools: create_goal, create_key_result, "
            "create_task_template, create_reminder, search_notes, fetch_stats."
        ),
        "Use create_goal exactly once.",
        (
            "For create_key_result and create_task_template, set index "
            "to the matching array item index."
        ),
        _output_language_instruction(locale),
    ]

    if use_native_tool_calling:
        lines.extend(
            [
                "When the submit_goal_automation_plan tool is available, "
                "call it exactly once.",
                "Do not answer with free-form JSON when you can call the tool.",
                (
                    "Use search_notes only when knowledge notes are available "
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
                    "Do not request fetch_stats unless analytics context is available."
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
                '      "cadence": "daily" | "weekly" | "once",',
                '      "timeOfDay": "HH:mm"',
                "    }",
                "  ],",
                '  "reminders": [',
                "    {",
                '      "title": string,',
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
                    '"create_task_template" | "create_reminder" | '
                    '"search_notes" | "fetch_stats",'
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
    locale: str = "en-US",
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
                f"UI locale: {locale}",
            ],
        )
    )


def build_goal_clarification_system_prompt(*, locale: str = "en-US") -> str:
    """System prompt for determining if a goal needs clarification."""

    return "\n".join(
        [
            (
                "You are an assistant that determines whether a goal idea "
                "is clear enough for structured planning."
            ),
            "Respond with JSON only.",
            "Do not include markdown code fences.",
            _output_language_instruction(locale),
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
            "- Ask only about information that is genuinely missing.",
            "- Generate 1-3 high-value clarification questions.",
            "- Focus on: motivation, success criteria, timeline, scope, constraints.",
            "- Keep each question concise (< 15 words).",
            "- Provide context for each question explaining why it matters.",
            "- Do not draft a goal, key result, task, or reminder in this response.",
            "- If the idea is already clear and specific, "
            "set needsClarification to false.",
            "- Always explain rationale when clarification is needed.",
        ]
    )


def build_goal_clarification_user_prompt(
    *,
    idea: str,
    category: str | None = None,
    timeframe: str | None = None,
    locale: str = "en-US",
) -> str:
    """Build user prompt for clarification check.

    Args:
        idea: The goal idea to evaluate
        category: Optional category hint for context
        timeframe: Optional timeframe already supplied by the user

    Returns:
        User prompt string
    """
    return "\n".join(
        filter(
            None,
            [
                f"Goal idea: {idea}",
                f"Category: {category}" if category else None,
                f"Timeframe: {timeframe}" if timeframe else None,
                f"UI locale: {locale}",
                "",
                (
                    "Determine if this goal idea is clear enough for planning, "
                    "or if it needs clarification. If clarification is needed, "
                    "suggest no more than three high-value clarification questions."
                ),
            ],
        )
    )
