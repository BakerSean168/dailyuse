"""Tests for analytics query endpoint."""

from unittest.mock import AsyncMock, patch

from ai_service.schemas import AnalyticsQueryResponse


class TestAnalyticsQueryRoute:
    """Tests for the analytics query HTTP endpoint."""

    def test_query_analytics_success(self, client):
        """A valid request returns a synthesized analytics answer."""

        with patch(
            "ai_service.services.analytics_query_service.AnalyticsQueryService.query",
            new_callable=AsyncMock,
        ) as mock_query:
            mock_query.return_value = AnalyticsQueryResponse(
                answer="Active goals are healthy, but overdue tasks need attention.",
                highlights=["activeGoals: 4", "task.overdue: 3"],
                usage={"total_tokens": 33},
            )

            response = client.post(
                "/internal/workflows/analytics",
                json={
                    "question": "What should I pay attention to today?",
                    "context": {
                        "dashboard": {"stats": {"activeGoals": 4, "activeTasks": 9}},
                        "task_dashboard": {
                            "summary": {"overdue": 3, "highPriority": 2}
                        },
                        "goals": [],
                        "goal_search_results": [],
                        "extra": {},
                    },
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["highlights"][0] == "activeGoals: 4"
            assert data["usage"]["total_tokens"] == 33
