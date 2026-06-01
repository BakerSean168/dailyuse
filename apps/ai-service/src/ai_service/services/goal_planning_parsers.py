"""Payload parsers for goal planning LLM responses."""

from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from ai_service.errors import StructuredOutputError
from ai_service.schemas import (
    GoalAutomationLLMResponse,
    GoalClarificationLLMResponse,
    GoalPlanningLLMResponse,
)
from ai_service.services.provider_tool_runtime import extract_completion_tool_calls


def strip_code_fence(content: str) -> str:
    """Handle models that wrap JSON in markdown fences despite instructions."""

    trimmed = content.strip()
    if not trimmed.startswith("```"):
        return trimmed

    without_opening = trimmed.split("\n", 1)[1] if "\n" in trimmed else ""
    return without_opening.rsplit("```", 1)[0].strip()


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
