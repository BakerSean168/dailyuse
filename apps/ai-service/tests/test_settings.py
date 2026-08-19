"""Tests for MEMOFLOW_WEB_URL auto-derivation in the browser allowlist."""

import os

from ai_service.config import get_settings


def _settings_with(env_updates: dict[str, str]):
    """Apply env updates for the test, then rebuild the settings singleton.

    The autouse conftest fixture restores the original environment after each
    test, so no restore is needed here.
    """

    get_settings.cache_clear()
    for key, value in env_updates.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    return get_settings()


def test_allowed_origins_defaults_when_web_url_unset():
    """Without MEMOFLOW_WEB_URL the allowlist keeps its configured origins only."""

    settings = _settings_with({"MEMOFLOW_WEB_URL": ""})
    assert settings.allowed_origins_list == ["http://localhost:3000"]


def test_magic_dns_web_origin_is_appended():
    """The MagicDNS public Web origin is auto-included in the allowlist."""

    settings = _settings_with(
        {"MEMOFLOW_WEB_URL": "http://oracle.taile92a8e.ts.net:58080"}
    )
    assert "http://oracle.taile92a8e.ts.net:58080" in settings.allowed_origins_list
    assert settings.allowed_origins_list == [
        "http://localhost:3000",
        "http://oracle.taile92a8e.ts.net:58080",
    ]


def test_web_origin_strips_trailing_path():
    """A Web URL with a path is normalized to its origin."""

    settings = _settings_with(
        {"MEMOFLOW_WEB_URL": "http://oracle.taile92a8e.ts.net:58080/verify"}
    )
    assert settings.allowed_origins_list == [
        "http://localhost:3000",
        "http://oracle.taile92a8e.ts.net:58080",
    ]


def test_web_origin_is_deduplicated():
    """An origin already present in ALLOWED_ORIGINS is not appended twice."""

    settings = _settings_with(
        {
            "ALLOWED_ORIGINS": "http://localhost:3000,http://oracle.taile92a8e.ts.net:58080",
            "MEMOFLOW_WEB_URL": "http://oracle.taile92a8e.ts.net:58080/",
        }
    )
    assert settings.allowed_origins_list == [
        "http://localhost:3000",
        "http://oracle.taile92a8e.ts.net:58080",
    ]


def test_invalid_web_url_is_ignored():
    """An unparseable MEMOFLOW_WEB_URL leaves the allowlist unchanged."""

    settings = _settings_with({"MEMOFLOW_WEB_URL": "not a url"})
    assert settings.allowed_origins_list == ["http://localhost:3000"]