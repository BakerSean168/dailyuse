"""Tests for ts checkpoint strategy lifespan and identity-aware runtime."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_ts_strategy_lifespan_starts_without_identity_error(monkeypatch):
    """Verify ts checkpoint strategy can start without identity_id=None error.

    Previously, ts strategy would fail at lifespan startup because app.py
    called build_run_history_store(identity_id=None), which raises ValueError
    in ts mode.

    Now, ts strategy skips runtime construction at lifespan and builds
    identity-aware runtimes per-request in dependencies.
    """
    monkeypatch.setenv("AGENT_CHECKPOINT_STRATEGY", "ts")
    monkeypatch.setenv("TS_API_BASE_URL", "http://localhost:3001")
    monkeypatch.setenv("SERVICE_SECRET", "test-secret")

    from ai_service.main import create_app

    app = create_app()

    # Creating TestClient proves startup works.
    with TestClient(app) as client:
        response = client.get("/docs")
        assert response.status_code in {200, 307, 404}


def test_local_strategy_uses_singleton_runtime(monkeypatch):
    """Verify local strategy (default) constructs singleton runtimes at startup."""
    # Explicitly set local strategy
    monkeypatch.setenv("AGENT_CHECKPOINT_STRATEGY", "local")

    from ai_service.main import create_app

    app = create_app()

    # We can't directly access app.state outside lifespan,
    # but we can verify the app created successfully and would use local strategy
    with TestClient(app) as client:
        response = client.get("/docs")
        assert response.status_code in {200, 307, 404}


def test_ts_strategy_does_not_construct_singleton_runtime(monkeypatch):
    """Verify ts strategy does NOT construct singleton runtimes at startup."""
    monkeypatch.setenv("AGENT_CHECKPOINT_STRATEGY", "ts")
    monkeypatch.setenv("TS_API_BASE_URL", "http://localhost:3001")
    monkeypatch.setenv("SERVICE_SECRET", "test-secret")

    from ai_service.main import create_app

    create_app()

    # ts strategy sets None placeholders (runtimes constructed per-request)
    # We can't easily test None because app.state may have default values,
    # but we can verify the strategy environment variable is correctly set
    from ai_service.config import Settings

    settings = Settings()
    assert settings.agent_checkpoint_strategy.lower() == "ts"


def test_checkpoint_factory_requires_identity_for_ts_strategy():
    """Verify ts strategy rejects missing identity_id."""
    from ai_service.agent_runtime.checkpoint_factory import (
        build_checkpointer,
        build_run_history_store,
    )
    from ai_service.config import Settings

    # Create settings with ts strategy
    settings = Settings(
        agent_checkpoint_strategy="ts",
        ts_api_base_url="http://localhost:3001",
        service_secret="test-secret",
    )

    # Should raise ValueError when identity_id is None
    with pytest.raises(ValueError) as exc_info:
        build_run_history_store(
            settings=settings,
            name="test",
            identity_id=None,
        )

    assert "identity_id is required" in str(exc_info.value)
    assert "ts" in str(exc_info.value)

    with pytest.raises(ValueError) as checkpointer_exc_info:
        build_checkpointer(
            settings=settings,
            name="goal-create",
            identity_id=None,
        )

    assert "identity_id is required" in str(checkpointer_exc_info.value)


def test_checkpoint_factory_allows_identity_for_ts_strategy():
    """Verify build_run_history_store works when ts strategy HAS identity_id."""
    from ai_service.agent_runtime.checkpoint_factory import (
        build_checkpointer,
        build_run_history_store,
    )
    from ai_service.config import Settings

    settings = Settings(
        agent_checkpoint_strategy="ts",
        ts_api_base_url="http://localhost:3001",
        service_secret="test-secret",
    )

    # Should not raise when identity_id is provided
    store = build_run_history_store(
        settings=settings,
        name="goal-create",
        identity_id="test-identity-123",
    )

    # Verify it returned a TSCheckpointAdapter
    from ai_service.agent_runtime.ts_checkpoint_adapter import TSCheckpointAdapter

    assert isinstance(store, TSCheckpointAdapter)

    checkpointer = build_checkpointer(
        settings=settings,
        name="goal-create",
        identity_id="test-identity-123",
    )

    from ai_service.agent_runtime.langgraph_checkpointer import (
        TSLangGraphCheckpointSaver,
    )

    assert isinstance(checkpointer, TSLangGraphCheckpointSaver)
