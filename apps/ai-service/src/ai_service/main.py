"""FastAPI process entry point.

The real application wiring lives in `ai_service.app`. We intentionally export
only the factory here so configuration is evaluated when the server starts, not
when the module is merely imported by tests or tooling.
"""

from ai_service.app import create_app

__all__ = ["create_app"]
