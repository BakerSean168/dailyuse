"""Tests for knowledge-note generation endpoint."""

from unittest.mock import AsyncMock, patch

from ai_service.schemas import KnowledgeNoteResponse


class TestKnowledgeNoteRoute:
    """Tests for the knowledge note HTTP endpoint."""

    def test_generate_note_success(self, client):
        """A valid request returns generated markdown content."""

        with patch(
            "ai_service.services.knowledge_note_service.KnowledgeNoteService.generate",
            new_callable=AsyncMock,
        ) as mock_generate:
            mock_generate.return_value = KnowledgeNoteResponse(
                content="# Python Tooling\n\nA concise note.",
                usage={
                    "prompt_tokens": 10,
                    "completion_tokens": 7,
                    "total_tokens": 17,
                },
            )

            response = client.post(
                "/internal/workflows/knowledge-note",
                json={
                    "topic": "Python tooling",
                    "title": "Python Tooling",
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "api_key": "test-key",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["content"].startswith("# Python Tooling")
            assert data["usage"]["total_tokens"] == 17
