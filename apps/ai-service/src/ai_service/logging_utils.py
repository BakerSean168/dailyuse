"""Logging setup and helper utilities for ai-service."""

from __future__ import annotations

import json
import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from typing import Any

from ai_service.config import Settings

_LOG_FORMAT = "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
_MAX_PREVIEW_LENGTH = 240


def _service_root() -> Path:
    """Return the ai-service project root."""

    return Path(__file__).resolve().parents[2]


def resolve_log_dir(settings: Settings) -> Path:
    """Resolve the effective log directory for the current process."""

    if settings.log_dir:
        candidate = Path(settings.log_dir).expanduser()
        return candidate if candidate.is_absolute() else (_service_root() / candidate)
    return _service_root() / "logs"


def configure_logging(settings: Settings) -> Path:
    """Configure root and uvicorn loggers for console and file persistence."""

    log_dir = resolve_log_dir(settings)
    log_dir.mkdir(parents=True, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(settings.log_level)

    formatter = logging.Formatter(_LOG_FORMAT)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(settings.log_level)
    console_handler.setFormatter(formatter)

    app_file_handler = TimedRotatingFileHandler(
        filename=log_dir / "app.log",
        when="midnight",
        backupCount=14,
        encoding="utf-8",
    )
    app_file_handler.setLevel(settings.log_level)
    app_file_handler.setFormatter(formatter)

    error_file_handler = TimedRotatingFileHandler(
        filename=log_dir / "error.log",
        when="midnight",
        backupCount=14,
        encoding="utf-8",
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)
    root_logger.addHandler(app_file_handler)
    root_logger.addHandler(error_file_handler)

    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.propagate = True
        logger.setLevel(settings.log_level)

    logging.captureWarnings(True)
    return log_dir


def preview_text(value: str | None, *, max_length: int = _MAX_PREVIEW_LENGTH) -> str | None:
    """Return one-line truncated text preview for logs."""

    if value is None:
        return None

    normalized = " ".join(value.split())
    if len(normalized) <= max_length:
        return normalized
    return f"{normalized[: max_length - 3]}..."


def compact_log(**fields: Any) -> str:
    """Serialize structured log fields into one grep-friendly JSON string."""

    payload = {
        key: value
        for key, value in fields.items()
        if value is not None
    }
    return json.dumps(payload, ensure_ascii=False, default=str, sort_keys=True)


def summarize_provider_config(provider_config: Any) -> dict[str, Any]:
    """Return a safe provider summary without secrets."""

    if isinstance(provider_config, dict):
        return {
            "provider": provider_config.get("provider"),
            "model": provider_config.get("model"),
            "base_url": provider_config.get("base_url"),
            "temperature": provider_config.get("temperature"),
            "max_tokens": provider_config.get("max_tokens"),
        }

    return {
        "provider": getattr(provider_config, "provider", None),
        "model": getattr(provider_config, "model", None),
        "base_url": getattr(provider_config, "base_url", None),
        "temperature": getattr(provider_config, "temperature", None),
        "max_tokens": getattr(provider_config, "max_tokens", None),
    }


def summarize_usage(usage: dict[str, Any] | None) -> dict[str, Any] | None:
    """Return a compact usage payload for logs."""

    if usage is None:
        return None
    if not isinstance(usage, dict):
        return None

    return {
        "prompt_tokens": int(usage.get("prompt_tokens", 0) or 0),
        "completion_tokens": int(usage.get("completion_tokens", 0) or 0),
        "total_tokens": int(usage.get("total_tokens", 0) or 0),
    }


def summarize_tool_calls(tool_calls: list[Any] | None) -> list[dict[str, Any]]:
    """Return safe summaries for provider-native tool calls."""

    summaries: list[dict[str, Any]] = []
    for tool_call in tool_calls or []:
        function = getattr(tool_call, "function", None)
        summaries.append(
            {
                "id": getattr(tool_call, "id", None),
                "name": getattr(function, "name", None),
                "arguments_preview": preview_text(
                    getattr(function, "arguments", None),
                    max_length=160,
                ),
            }
        )
    return summaries


def summarize_completion(completion: Any) -> dict[str, Any]:
    """Return a compact completion summary for logging."""

    content = getattr(completion, "content", None)
    tool_calls = getattr(completion, "tool_calls", None)

    return {
        "finish_reason": getattr(completion, "finish_reason", None),
        "content_length": len(content) if isinstance(content, str) else None,
        "content_preview": preview_text(content) if isinstance(content, str) else None,
        "tool_calls": summarize_tool_calls(tool_calls if isinstance(tool_calls, list) else []),
        "usage": summarize_usage(getattr(completion, "usage", None)),
    }
