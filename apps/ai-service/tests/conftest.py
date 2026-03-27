"""Pytest configuration and fixtures."""

import json
import os
import time

import pytest
from fastapi.testclient import TestClient

from ai_service.config import get_settings
from ai_service.main import create_app
from ai_service.security import (
    INTERNAL_CONTENT_HASH_HEADER,
    INTERNAL_SERVICE_HEADER,
    INTERNAL_SIGNATURE_HEADER,
    INTERNAL_TIMESTAMP_HEADER,
    compute_content_sha256,
    sign_internal_request,
)


@pytest.fixture(autouse=True)
def set_test_env():
    """Set test environment variables and restore them after each test."""

    original_env = os.environ.copy()
    os.environ["SERVICE_SECRET"] = "test-secret"
    os.environ["DEBUG"] = "true"
    os.environ["DEV_BYPASS_AUTH"] = "true"
    os.environ["LOG_LEVEL"] = "DEBUG"
    os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
    os.environ["INTERNAL_REQUEST_MAX_SKEW_SECONDS"] = "300"

    get_settings.cache_clear()

    yield

    os.environ.clear()
    os.environ.update(original_env)
    get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    """Create a fresh test client for each test."""

    test_app = create_app()
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
def signed_json_request():
    """Build a signed JSON request body plus matching auth headers.

    Returning a callable keeps tests concise while still making the exact
    signature inputs visible in one shared place.
    """

    def _build(
        *,
        path: str,
        payload: dict,
        method: str = "POST",
        service_name: str = "test-service",
        secret: str = "test-secret",
        timestamp: int | None = None,
    ) -> tuple[dict[str, str], bytes]:
        request_timestamp = timestamp if timestamp is not None else int(time.time())
        body = json.dumps(payload).encode("utf-8")
        content_sha256 = compute_content_sha256(body)
        signature = sign_internal_request(
            secret=secret,
            service_name=service_name,
            method=method,
            path=path,
            timestamp=request_timestamp,
            content_sha256=content_sha256,
        )

        headers = {
            "Content-Type": "application/json",
            INTERNAL_SERVICE_HEADER: service_name,
            INTERNAL_TIMESTAMP_HEADER: str(request_timestamp),
            INTERNAL_CONTENT_HASH_HEADER: content_sha256,
            INTERNAL_SIGNATURE_HEADER: signature,
            "X-Request-Id": "test-request-id",
            "X-Identity-Id": "test-identity-id",
        }
        return headers, body

    return _build
