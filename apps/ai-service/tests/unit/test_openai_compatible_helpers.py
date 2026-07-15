"""Unit tests for OpenAI-compatible provider helpers and request contracts."""

import json
import logging

import httpx
import pytest

from ai_service.providers.openai_provider import (
    OPENAI_COMPATIBLE_MIN_MAX_TOKENS,
    OpenAIProvider,
    extract_openai_compatible_message_content,
    normalize_openai_compatible_max_tokens,
    normalize_openai_compatible_model_id,
)
from ai_service.schemas import ChatMessage, ProviderConfig


def test_normalize_model_id_strips_models_prefix():
    assert (
        normalize_openai_compatible_model_id("models/gemini-2.5-flash")
        == "gemini-2.5-flash"
    )
    assert normalize_openai_compatible_model_id("  gpt-4o-mini  ") == "gpt-4o-mini"


def test_normalize_max_tokens_floors_tiny_values():
    assert (
        normalize_openai_compatible_max_tokens(1)
        == OPENAI_COMPATIBLE_MIN_MAX_TOKENS
    )
    assert (
        normalize_openai_compatible_max_tokens(16)
        == OPENAI_COMPATIBLE_MIN_MAX_TOKENS
    )
    assert normalize_openai_compatible_max_tokens(1024) == 1024
    assert normalize_openai_compatible_max_tokens(None) is None


def test_extract_message_content_supports_multipart_parts():
    assert extract_openai_compatible_message_content("hello") == "hello"
    assert (
        extract_openai_compatible_message_content(
            [{"type": "text", "text": "Hello "}, {"type": "text", "text": "Gemini"}]
        )
        == "Hello Gemini"
    )
    assert extract_openai_compatible_message_content(["a", "b"]) == "ab"
    assert extract_openai_compatible_message_content(None) == ""
    assert extract_openai_compatible_message_content([]) == ""


@pytest.mark.asyncio
async def test_complete_normalizes_gemini_request_and_reports_empty_content(caplog):
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        assert payload["model"] == "gemini-2.5-flash"
        assert payload["max_tokens"] == OPENAI_COMPATIBLE_MIN_MAX_TOKENS
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {"content": []},
                        "finish_reason": "length",
                    }
                ]
            },
        )

    caplog.set_level(logging.WARNING)
    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        provider = OpenAIProvider(http_client=http_client)
        result = await provider.complete(
            [ChatMessage(role="user", content="Hello")],
            ProviderConfig(
                provider="openai",
                model="models/gemini-2.5-flash",
                api_key="test-key",
                max_tokens=1,
            ),
        )

    assert result.content == ""
    assert result.finish_reason == "length"
    assert "finish_reason=length" in caplog.text
