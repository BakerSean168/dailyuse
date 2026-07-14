"""Unit tests for OpenAI-compatible provider helpers."""

from ai_service.providers.openai_provider import (
    OPENAI_COMPATIBLE_MIN_MAX_TOKENS,
    extract_openai_compatible_message_content,
    normalize_openai_compatible_max_tokens,
    normalize_openai_compatible_model_id,
)


def test_normalize_model_id_strips_models_prefix():
    assert normalize_openai_compatible_model_id("models/gemini-2.5-flash") == "gemini-2.5-flash"
    assert normalize_openai_compatible_model_id("  gpt-4o-mini  ") == "gpt-4o-mini"


def test_normalize_max_tokens_floors_tiny_values():
    assert normalize_openai_compatible_max_tokens(1) == OPENAI_COMPATIBLE_MIN_MAX_TOKENS
    assert normalize_openai_compatible_max_tokens(16) == OPENAI_COMPATIBLE_MIN_MAX_TOKENS
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
