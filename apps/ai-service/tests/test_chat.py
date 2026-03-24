"""Tests for chat endpoints."""

import json
import os
from unittest.mock import AsyncMock, patch

import pytest


class TestChatComplete:
    """Tests for the chat complete endpoint."""

    def test_chat_complete_missing_auth_returns_401(self):
        """Test that missing auth headers return 401."""
        from fastapi.testclient import TestClient

        from ai_service.config import get_settings
        from ai_service.main import create_app

        # Set strict settings (no auth bypass)
        os.environ["DEBUG"] = "false"
        os.environ["DEV_BYPASS_AUTH"] = "false"
        get_settings.cache_clear()

        test_app = create_app()

        with TestClient(test_app) as client:
            response = client.post(
                "/internal/chat/complete",
                json={
                    "messages": [{"role": "user", "content": "Hello"}],
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4",
                        "api_key": "test-key",
                    },
                },
            )
            assert response.status_code == 401

        # Restore
        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        get_settings.cache_clear()

    def test_chat_complete_invalid_provider(self, client):
        """Test that invalid provider returns 400."""
        with patch(
            "ai_service.services.chat_service.ChatService.complete",
            new_callable=AsyncMock,
        ) as mock_complete:
            mock_complete.side_effect = ValueError("Unknown provider: invalid")

            response = client.post(
                "/internal/chat/complete",
                json={
                    "messages": [{"role": "user", "content": "Hello"}],
                    "provider_config": {
                        "provider": "invalid",
                        "model": "test-model",
                        "api_key": "test-key",
                    },
                },
            )
            assert response.status_code == 400

    def test_chat_complete_success(self, client):
        """Test successful chat completion."""
        with patch(
            "ai_service.services.chat_service.ChatService.complete",
            new_callable=AsyncMock,
        ) as mock_complete:
            from ai_service.schemas import ChatCompleteResponse

            mock_complete.return_value = ChatCompleteResponse(
                content="Hello! How can I help you?",
                finish_reason="stop",
                usage={"prompt_tokens": 10, "completion_tokens": 8, "total_tokens": 18},
            )

            response = client.post(
                "/internal/chat/complete",
                json={
                    "messages": [{"role": "user", "content": "Hello"}],
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4",
                        "api_key": "test-key",
                    },
                },
            )
            assert response.status_code == 200

            data = response.json()
            assert data["content"] == "Hello! How can I help you?"
            assert data["finish_reason"] == "stop"
            assert data["usage"]["total_tokens"] == 18


class TestChatStream:
    """Tests for the chat stream endpoint."""

    def test_chat_stream_success(self, client):
        """Test successful streaming chat completion."""
        from ai_service.schemas import ChatStreamChunk

        async def mock_stream(*args, **kwargs):
            chunks = [
                ChatStreamChunk(content="Hello", finish_reason=None),
                ChatStreamChunk(content=" world", finish_reason=None),
                ChatStreamChunk(content="!", finish_reason="stop"),
            ]
            for chunk in chunks:
                yield chunk

        with patch(
            "ai_service.services.chat_service.ChatService.stream",
            return_value=mock_stream(),
        ):
            response = client.post(
                "/internal/chat/stream",
                json={
                    "messages": [{"role": "user", "content": "Hello"}],
                    "provider_config": {
                        "provider": "openai",
                        "model": "gpt-4",
                        "api_key": "test-key",
                    },
                },
            )
            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]

            # Parse SSE events
            events = []
            for line in response.text.split("\n"):
                if line.startswith("data:"):
                    data_str = line[5:].strip()
                    if data_str:
                        events.append(json.loads(data_str))

            # Verify we got content chunks
            assert len(events) >= 1

    def test_chat_stream_with_auth_headers(self, auth_headers):
        """Test streaming with proper auth headers."""
        from fastapi.testclient import TestClient

        from ai_service.config import get_settings
        from ai_service.main import create_app
        from ai_service.schemas import ChatStreamChunk

        # Use strict settings
        os.environ["DEBUG"] = "false"
        os.environ["DEV_BYPASS_AUTH"] = "false"
        get_settings.cache_clear()

        test_app = create_app()

        async def mock_stream(*args, **kwargs):
            yield ChatStreamChunk(content="Test", finish_reason="stop")

        with TestClient(test_app) as client:
            with patch(
                "ai_service.services.chat_service.ChatService.stream",
                return_value=mock_stream(),
            ):
                response = client.post(
                    "/internal/chat/stream",
                    json={
                        "messages": [{"role": "user", "content": "Hello"}],
                        "provider_config": {
                            "provider": "openai",
                            "model": "gpt-4",
                            "api_key": "test-key",
                        },
                    },
                    headers=auth_headers,
                )
                assert response.status_code == 200

        # Restore
        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        get_settings.cache_clear()


class TestChatService:
    """Tests for the chat service."""

    def test_get_provider_openai(self):
        """Test getting OpenAI provider."""
        from ai_service.services.chat_service import ChatService, OpenAIProvider

        service = ChatService()
        provider = service.get_provider("openai")
        assert isinstance(provider, OpenAIProvider)

    def test_get_provider_anthropic(self):
        """Test getting Anthropic provider."""
        from ai_service.services.chat_service import AnthropicProvider, ChatService

        service = ChatService()
        provider = service.get_provider("anthropic")
        assert isinstance(provider, AnthropicProvider)

    def test_get_provider_case_insensitive(self):
        """Test provider lookup is case insensitive."""
        from ai_service.services.chat_service import ChatService, OpenAIProvider

        service = ChatService()
        provider = service.get_provider("OpenAI")
        assert isinstance(provider, OpenAIProvider)

    def test_get_provider_unknown_raises(self):
        """Test unknown provider raises ValueError."""
        from ai_service.services.chat_service import ChatService

        service = ChatService()
        with pytest.raises(ValueError, match="Unknown provider"):
            service.get_provider("unknown")
