"""Tests for chat endpoints."""

import asyncio
import json
import os
import time
from unittest.mock import AsyncMock, patch

import httpx
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
            assert response.headers["X-Request-Id"]
            assert response.json()["request_id"] == response.headers["X-Request-Id"]

        # Restore
        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        get_settings.cache_clear()

    def test_chat_complete_invalid_provider(self, client):
        """Test that invalid provider returns 400."""
        from ai_service.errors import UnsupportedProviderError

        with patch(
            "ai_service.services.chat_service.ChatService.complete",
            new_callable=AsyncMock,
        ) as mock_complete:
            mock_complete.side_effect = UnsupportedProviderError(
                detail="Unknown provider: invalid"
            )

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
            assert response.headers["X-Request-Id"]
            assert response.json()["request_id"] == response.headers["X-Request-Id"]

    def test_chat_complete_rejects_stale_timestamp(self, signed_json_request):
        """Test that strict auth rejects old signed requests."""
        from fastapi.testclient import TestClient

        from ai_service.config import get_settings
        from ai_service.main import create_app

        os.environ["DEBUG"] = "false"
        os.environ["DEV_BYPASS_AUTH"] = "false"
        os.environ["INTERNAL_REQUEST_MAX_SKEW_SECONDS"] = "60"
        get_settings.cache_clear()

        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4",
                "api_key": "test-key",
            },
        }
        headers, body = signed_json_request(
            path="/internal/chat/complete",
            payload=payload,
            timestamp=int(time.time()) - 3600,
        )

        test_app = create_app()
        with TestClient(test_app) as strict_client:
            response = strict_client.post(
                "/internal/chat/complete",
                content=body,
                headers=headers,
            )
            assert response.status_code == 401
            assert (
                response.json()["detail"]
                == "Request timestamp is outside the allowed window"
            )
            assert response.json()["request_id"] == "test-request-id"

        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        os.environ["INTERNAL_REQUEST_MAX_SKEW_SECONDS"] = "300"
        get_settings.cache_clear()

    def test_chat_complete_rejects_body_hash_mismatch(self, signed_json_request):
        """Test that the signature is tied to the exact body bytes."""
        from fastapi.testclient import TestClient

        from ai_service.config import get_settings
        from ai_service.main import create_app

        os.environ["DEBUG"] = "false"
        os.environ["DEV_BYPASS_AUTH"] = "false"
        get_settings.cache_clear()

        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4",
                "api_key": "test-key",
            },
        }
        headers, _ = signed_json_request(
            path="/internal/chat/complete",
            payload=payload,
        )
        tampered_body = json.dumps(
            {
                "messages": [{"role": "user", "content": "Tampered"}],
                "provider_config": payload["provider_config"],
            }
        ).encode("utf-8")

        test_app = create_app()
        with TestClient(test_app) as strict_client:
            response = strict_client.post(
                "/internal/chat/complete",
                content=tampered_body,
                headers=headers,
            )
            assert response.status_code == 401
            assert response.json()["detail"] == "Request body hash does not match"
            assert response.json()["request_id"] == "test-request-id"

        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        get_settings.cache_clear()

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
            assert response.headers["X-Request-Id"]

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

    def test_chat_stream_with_auth_headers(self, signed_json_request):
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
        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "provider_config": {
                "provider": "openai",
                "model": "gpt-4",
                "api_key": "test-key",
            },
        }
        headers, body = signed_json_request(
            path="/internal/chat/stream",
            payload=payload,
        )

        async def mock_stream(*args, **kwargs):
            yield ChatStreamChunk(content="Test", finish_reason="stop")

        with TestClient(test_app) as client:
            with patch(
                "ai_service.services.chat_service.ChatService.stream",
                return_value=mock_stream(),
            ):
                response = client.post(
                    "/internal/chat/stream",
                    content=body,
                    headers=headers,
                )
                assert response.status_code == 200
                assert response.headers["X-Request-Id"] == "test-request-id"

        # Restore
        os.environ["DEBUG"] = "true"
        os.environ["DEV_BYPASS_AUTH"] = "true"
        get_settings.cache_clear()


class TestChatService:
    """Tests for the chat service."""

    @staticmethod
    def _build_service():
        """Create a real ChatService instance for provider registry tests."""

        from ai_service.providers import AnthropicProvider, OpenAIProvider
        from ai_service.services.chat_service import ChatService

        http_client = httpx.AsyncClient()
        service = ChatService(
            providers={
                "openai": OpenAIProvider(http_client=http_client),
                "anthropic": AnthropicProvider(http_client=http_client),
            }
        )
        return service, http_client

    def test_get_provider_openai(self):
        """Test getting OpenAI provider."""
        from ai_service.providers import OpenAIProvider

        service, http_client = self._build_service()
        try:
            provider = service.get_provider("openai")
            assert isinstance(provider, OpenAIProvider)
        finally:
            asyncio.run(http_client.aclose())

    def test_get_provider_anthropic(self):
        """Test getting Anthropic provider."""
        from ai_service.providers import AnthropicProvider

        service, http_client = self._build_service()
        try:
            provider = service.get_provider("anthropic")
            assert isinstance(provider, AnthropicProvider)
        finally:
            asyncio.run(http_client.aclose())

    def test_get_provider_case_insensitive(self):
        """Test provider lookup is case insensitive."""
        from ai_service.providers import OpenAIProvider

        service, http_client = self._build_service()
        try:
            provider = service.get_provider("OpenAI")
            assert isinstance(provider, OpenAIProvider)
        finally:
            asyncio.run(http_client.aclose())

    def test_get_provider_unknown_raises(self):
        """Test unknown provider raises UnsupportedProviderError."""
        from ai_service.errors import UnsupportedProviderError

        service, http_client = self._build_service()
        try:
            with pytest.raises(UnsupportedProviderError, match="Unknown provider"):
                service.get_provider("unknown")
        finally:
            asyncio.run(http_client.aclose())

    @pytest.mark.asyncio
    async def test_complete_passes_native_tool_call_options_to_provider(self):
        """Tool-capable calls should be forwarded to the selected provider."""

        from ai_service.schemas import (
            ChatCompleteResponse,
            ChatMessage,
            ChatToolDefinition,
            ChatToolFunction,
            ProviderConfig,
        )
        from ai_service.services.chat_service import ChatService

        provider = AsyncMock()
        provider.complete.return_value = ChatCompleteResponse(
            content="",
            finish_reason="tool_calls",
            usage=None,
        )
        service = ChatService(providers={"openai": provider})

        tool = ChatToolDefinition(
            function=ChatToolFunction(
                name="submit_goal_automation_plan",
                description="Submit the final plan.",
                parameters={"type": "object", "properties": {}},
            )
        )

        await service.complete(
            messages=[ChatMessage(role="user", content="Plan this goal.")],
            config=ProviderConfig(
                provider="openai",
                model="gpt-4o-mini",
                api_key="secret",
            ),
            tools=[tool],
            tool_choice="required",
        )

        provider.complete.assert_awaited_once_with(
            [ChatMessage(role="user", content="Plan this goal.")],
            ProviderConfig(
                provider="openai",
                model="gpt-4o-mini",
                api_key="secret",
            ),
            tools=[tool],
            tool_choice="required",
        )


class TestOpenAIProvider:
    """Tests for the OpenAI-compatible provider adapter."""

    @pytest.mark.asyncio
    async def test_complete_parses_native_tool_calls(self):
        """Provider responses with tool_calls should be exposed structurally."""

        from ai_service.providers import OpenAIProvider
        from ai_service.schemas import (
            ChatMessage,
            ChatToolDefinition,
            ChatToolFunction,
            ProviderConfig,
        )

        def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content.decode("utf-8"))
            assert payload["tool_choice"] == "required"
            assert payload["tools"][0]["function"]["name"] == "submit_goal_automation_plan"
            return httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {
                                "content": None,
                                "tool_calls": [
                                    {
                                        "id": "call_1",
                                        "type": "function",
                                        "function": {
                                            "name": "submit_goal_automation_plan",
                                            "arguments": "{\"summary\":\"ok\"}",
                                        },
                                    }
                                ],
                            },
                            "finish_reason": "tool_calls",
                        }
                    ],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
                },
            )

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            provider = OpenAIProvider(http_client=http_client)
            result = await provider.complete(
                [ChatMessage(role="user", content="Plan this goal.")],
                ProviderConfig(
                    provider="openai",
                    model="gpt-4o-mini",
                    api_key="secret",
                ),
                tools=[
                    ChatToolDefinition(
                        function=ChatToolFunction(
                            name="submit_goal_automation_plan",
                            description="Submit the final plan.",
                            parameters={"type": "object", "properties": {}},
                        )
                    )
                ],
                tool_choice="required",
            )

        assert result.finish_reason == "tool_calls"
        assert result.tool_calls is not None
        assert result.tool_calls[0].function.name == "submit_goal_automation_plan"
        assert result.tool_calls[0].function.arguments == "{\"summary\":\"ok\"}"

    @pytest.mark.asyncio
    async def test_complete_serializes_structured_tool_loop_messages(self):
        """Assistant tool calls and tool results should be serialized for OpenAI."""

        from ai_service.providers import OpenAIProvider
        from ai_service.schemas import (
            ChatMessage,
            ChatToolCall,
            ChatToolCallFunction,
            ProviderConfig,
        )

        def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content.decode("utf-8"))
            assert payload["messages"][0] == {"role": "system", "content": "You are planning."}
            assert payload["messages"][1]["role"] == "assistant"
            assert payload["messages"][1]["tool_calls"][0]["id"] == "call_1"
            assert payload["messages"][1]["tool_calls"][0]["function"]["name"] == "search_notes"
            assert payload["messages"][2] == {
                "role": "tool",
                "content": "{\"query\": \"approval workflow\"}",
                "tool_call_id": "call_1",
            }
            return httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {"content": "ok"},
                            "finish_reason": "stop",
                        }
                    ],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
                },
            )

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            provider = OpenAIProvider(http_client=http_client)
            result = await provider.complete(
                [
                    ChatMessage(role="system", content="You are planning."),
                    ChatMessage(
                        role="assistant",
                        content="",
                        tool_calls=[
                            ChatToolCall(
                                id="call_1",
                                function=ChatToolCallFunction(
                                    name="search_notes",
                                    arguments='{"query":"approval workflow"}',
                                ),
                            )
                        ],
                    ),
                    ChatMessage(
                        role="tool",
                        content='{"query": "approval workflow"}',
                        tool_call_id="call_1",
                    ),
                ],
                ProviderConfig(
                    provider="openai",
                    model="gpt-4o-mini",
                    api_key="secret",
                ),
            )

        assert result.content == "ok"
