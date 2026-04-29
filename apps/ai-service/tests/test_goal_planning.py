"""Tests for goal planning endpoints and service."""

from unittest.mock import AsyncMock, patch

from ai_service.errors import StructuredOutputError
from ai_service.schemas import GoalPlanningResponse


class TestGoalPlanningRoute:
    """Tests for the goal planning HTTP endpoint."""

    def test_plan_goal_success(self, client):
        """A valid goal plan request returns structured JSON."""

        with patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.plan_with_clarification",
            new_callable=AsyncMock,
        ) as mock_plan:
            mock_plan.return_value = GoalPlanningResponse.model_validate(
                {
                    "goal": {
                        "title": "Build a Python AI service",
                        "description": "Ship dedicated internal endpoints.",
                        "motivation": "Reduce architectural drift.",
                        "category": "learning",
                        "importance": "Important",
                        "tags": ["python", "ai"],
                        "feasibilityAnalysis": "Fits one focused iteration.",
                        "aiInsights": "Start by separating execution ports.",
                        "suggestedStartDate": 1,
                        "suggestedEndDate": 2,
                    },
                    "keyResults": [
                        {
                            "title": "Ship goal planning endpoint",
                            "description": "Move planning into Python.",
                            "targetValue": 1,
                            "unit": "milestone",
                        }
                    ],
                    "usage": {
                        "prompt_tokens": 12,
                        "completion_tokens": 8,
                        "total_tokens": 20,
                    },
                }
            )

            response = client.post(
                "/internal/goals/plan",
                json={
                    "idea": (
                        "Use Python engineering practices to finish the "
                        "ai-service roadmap."
                    ),
                    "include_key_results": True,
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["goal"]["title"] == "Build a Python AI service"
            assert data["keyResults"][0]["unit"] == "milestone"


class TestGoalPlanningService:
    """Tests for goal planning payload parsing."""

    async def test_invalid_json_raises_structured_output_error(self):
        """Malformed JSON from the provider should fail cleanly."""

        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value.content = "not json"
        chat_service.complete.return_value.usage = None
        service = GoalPlanningService(chat_service)

        try:
            await service.plan(
                idea="Build the remaining ai-service features cleanly.",
                category=None,
                timeframe=None,
                include_key_results=True,
                provider_config={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "api_key": "secret",
                },
            )
        except StructuredOutputError as exc:
            assert exc.detail == "Provider returned invalid JSON for goal planning."
        else:
            raise AssertionError("StructuredOutputError was not raised")
