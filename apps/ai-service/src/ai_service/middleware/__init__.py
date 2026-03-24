"""Middleware module for the AI Service."""

from .auth import ServiceAuthMiddleware

__all__ = ["ServiceAuthMiddleware"]
