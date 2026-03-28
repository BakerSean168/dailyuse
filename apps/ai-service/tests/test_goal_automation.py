"""Tests for goal automation planning endpoints and service parsing."""

from unittest.mock import AsyncMock, patch

from ai_service.errors import StructuredOutputError
from ai_service.schemas import GoalAutomationResponse


class TestGoalAutomationRoute:
    """Tests for the goal automation HTTP endpoint."""

    def test_plan_goal_actions_success(self, client):
        """A valid automation request returns tool calls for TS-side execution."""

        with patch(
            "ai_service.services.goal_planning_service.GoalPlanningService.plan_automation",
            new_callable=AsyncMock,
        ) as mock_plan:
            mock_plan.return_value = GoalAutomationResponse.model_validate(
                {
                    "summary": "Create the goal first, then add supporting structure.",
                    "goal": {
                        "title": "Ship AI automation",
                        "description": "Expose a reviewable automation flow.",
                        "motivation": "Reduce repetitive setup.",
                        "category": "work",
                        "importance": "Important",
                        "tags": ["ai", "automation"],
                        "feasibilityAnalysis": "A focused implementation is enough.",
                        "aiInsights": "Keep side effects on the TS boundary.",
                        "suggestedStartDate": 1,
                        "suggestedEndDate": 2,
                    },
                    "keyResults": [
                        {
                            "title": "Add automation approval",
                            "description": "Require user confirmation.",
                            "targetValue": 1,
                            "unit": "milestone",
                        }
                    ],
                    "taskTemplates": [
                        {
                            "name": "Review AI plan",
                            "description": "Confirm actions before execution.",
                            "importance": "Important",
                            "cadence": "once",
                        }
                    ],
                    "toolCalls": [
                        {
                            "tool": "create_goal",
                            "rationale": "Create the main goal first.",
                        }
                    ],
                    "usage": {
                        "prompt_tokens": 14,
                        "completion_tokens": 9,
                        "total_tokens": 23,
                    },
                }
            )

            response = client.post(
                "/internal/goals/plan-actions",
                json={
                    "idea": "Use explicit tool calls to automate goal setup.",
                    "include_key_results": True,
                    "include_task_templates": True,
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["summary"].startswith("Create the goal first")
            assert data["toolCalls"][0]["tool"] == "create_goal"


class TestGoalAutomationService:
    """Tests for goal automation payload parsing."""

    async def test_invalid_json_raises_structured_output_error(self):
        """Malformed JSON from the provider should fail cleanly."""

        from ai_service.services.chat_service import ChatService
        from ai_service.services.goal_planning_service import GoalPlanningService

        chat_service = AsyncMock(spec=ChatService)
        chat_service.complete.return_value.content = "not json"
        chat_service.complete.return_value.usage = None
        service = GoalPlanningService(chat_service)

        try:
            await service.plan_automation(
                idea="Automate goal setup with audited tool execution.",
                category=None,
                timeframe=None,
                include_key_results=True,
                include_task_templates=True,
                provider_config={
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "api_key": "secret",
                },
            )
        except StructuredOutputError as exc:
            assert (
                exc.detail
                == "Provider returned invalid JSON for goal automation planning."
            )
        else:
            raise AssertionError("StructuredOutputError was not raised")
