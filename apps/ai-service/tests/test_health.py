"""Tests for health endpoint."""

import os


def test_health_check(client):
    """Test health endpoint returns healthy status."""
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.headers["X-Request-Id"]

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-service"
    assert data["version"] == "1.0.0"


def test_health_check_no_auth_required():
    """Test health endpoint doesn't require auth even without bypass."""
    from fastapi.testclient import TestClient

    from ai_service.config import get_settings
    from ai_service.main import create_app

    # Set strict settings via environment
    os.environ["DEBUG"] = "false"
    os.environ["DEV_BYPASS_AUTH"] = "false"
    get_settings.cache_clear()

    test_app = create_app()

    with TestClient(test_app) as client:
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.headers["X-Request-Id"]

    # Restore
    os.environ["DEBUG"] = "true"
    os.environ["DEV_BYPASS_AUTH"] = "true"
    get_settings.cache_clear()
