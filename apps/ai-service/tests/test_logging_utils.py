"""Tests for ai-service logging configuration."""

from __future__ import annotations

import logging
from pathlib import Path

from ai_service.config import Settings
from ai_service.logging_utils import configure_logging, resolve_log_dir


def test_resolve_log_dir_defaults_to_service_logs():
    settings = Settings(
        debug=True,
        service_secret="development-secret",
    )

    log_dir = resolve_log_dir(settings)

    assert log_dir == Path(__file__).resolve().parents[1] / "logs"


def test_configure_logging_adds_file_handlers_for_custom_log_dir(tmp_path):
    settings = Settings(
        debug=True,
        service_secret="development-secret",
        log_dir=str(tmp_path / "custom-logs"),
    )

    original_handlers = list(logging.getLogger().handlers)
    try:
        log_dir = configure_logging(settings)
        root_logger = logging.getLogger()

        assert log_dir == tmp_path / "custom-logs"
        assert log_dir.exists()
        assert any(
            getattr(handler, "baseFilename", "").endswith("app.log")
            for handler in root_logger.handlers
        )
        assert any(
            getattr(handler, "baseFilename", "").endswith("error.log")
            for handler in root_logger.handlers
        )
    finally:
        root_logger = logging.getLogger()
        for handler in root_logger.handlers[:]:
            handler.close()
        root_logger.handlers.clear()
        for handler in original_handlers:
            root_logger.addHandler(handler)
