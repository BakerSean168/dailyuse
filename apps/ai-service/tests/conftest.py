"""Pytest configuration and fixtures."""

import os

import pytest
from fastapi.testclient import TestClient

from ai_service.config import get_settings
from ai_service.main import create_app


@pytest.fixture(autouse=True)
def set_test_env():
    """Set test environment variables."""
    original_env = os.environ.copy()
    # Set test environment
    os.environ["SERVICE_SECRET"] = "test-secret"
    os.environ["DEBUG"] = "true"
    os.environ["DEV_BYPASS_AUTH"] = "true"
    os.environ["LOG_LEVEL"] = "DEBUG"
    os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

    # Clear the settings cache
    get_settings.cache_clear()

    yield

    # Restore environment
    os.environ.clear()
    os.environ.update(original_env)
    get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    """Create a test client with auth bypassed."""
    # Create a fresh app instance for testing
    test_app = create_app()
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Create valid auth headers for testing."""
    import hashlib
    import hmac

    service = "test-service"
    secret = "test-secret"
    signature = hmac.new(secret.encode(), service.encode(), hashlib.sha256).hexdigest()

    return {
        "X-Internal-Service": service,
        "X-Internal-Signature": signature,
        "X-Request-Id": "test-request-id",
        "X-Identity-Id": "test-identity-id",
    }
