"""Helpers for signing and validating internal service requests.

The core idea is intentionally simple and language-agnostic so TypeScript and
Python can implement the same algorithm:
1. Hash the raw HTTP body with SHA-256.
2. Build a canonical string using service name, method, path, timestamp, and
   body hash.
3. Sign that canonical string with HMAC-SHA256 using the shared secret.

Because the signature covers the method, path, time, and exact body bytes, a
captured header set is much harder to replay against another request.
"""

from __future__ import annotations

import hashlib
import hmac
import time

INTERNAL_SERVICE_HEADER = "X-Internal-Service"
INTERNAL_TIMESTAMP_HEADER = "X-Internal-Timestamp"
INTERNAL_CONTENT_HASH_HEADER = "X-Internal-Content-SHA256"
INTERNAL_SIGNATURE_HEADER = "X-Internal-Signature"


def compute_content_sha256(body: bytes) -> str:
    """Return the SHA-256 hex digest for the raw request body."""

    return hashlib.sha256(body).hexdigest()


def build_signature_payload(
    *,
    service_name: str,
    method: str,
    path: str,
    timestamp: int,
    content_sha256: str,
) -> bytes:
    """Build the canonical payload that gets signed.

    Newlines are used as separators because they are simple and deterministic.
    The payload format must stay stable across languages.
    """

    canonical_string = "\n".join(
        [
            service_name,
            method.upper(),
            path,
            str(timestamp),
            content_sha256,
        ]
    )
    return canonical_string.encode("utf-8")


def sign_internal_request(
    *,
    secret: str,
    service_name: str,
    method: str,
    path: str,
    timestamp: int,
    content_sha256: str,
) -> str:
    """Return the HMAC-SHA256 signature for an internal request."""

    payload = build_signature_payload(
        service_name=service_name,
        method=method,
        path=path,
        timestamp=timestamp,
        content_sha256=content_sha256,
    )
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def validate_internal_request_signature(
    *,
    secret: str,
    service_name: str,
    method: str,
    path: str,
    timestamp: int,
    content_sha256: str,
    signature: str,
) -> bool:
    """Validate that a provided signature matches the expected signature."""

    expected_signature = sign_internal_request(
        secret=secret,
        service_name=service_name,
        method=method,
        path=path,
        timestamp=timestamp,
        content_sha256=content_sha256,
    )
    return hmac.compare_digest(signature, expected_signature)


def is_timestamp_fresh(
    *,
    timestamp: int,
    max_skew_seconds: int,
    now: int | None = None,
) -> bool:
    """Return whether a signed request timestamp is within the allowed skew."""

    current_time = now if now is not None else int(time.time())
    return abs(current_time - timestamp) <= max_skew_seconds
