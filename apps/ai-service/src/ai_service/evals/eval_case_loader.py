"""Evaluation case loading and filtering utilities."""

from __future__ import annotations

import json
from pathlib import Path

from ai_service.evals.eval_models import (
    EvalCase,
    EvalPolicy,
    EvalReport,
)


def load_eval_cases(path: Path) -> list[EvalCase]:
    """Load and validate evaluation cases from JSON."""

    from pydantic import TypeAdapter

    raw = json.loads(path.read_text(encoding="utf-8"))
    return TypeAdapter(list[EvalCase]).validate_python(raw)


def filter_eval_cases(
    cases: list[EvalCase],
    *,
    case_id: str | None = None,
) -> list[EvalCase]:
    """Optionally filter to a single named case."""

    if case_id is None:
        return cases
    filtered = [case for case in cases if case.id == case_id]
    if not filtered:
        raise ValueError(f"No evaluation case found with id={case_id!r}")
    return filtered


def load_policy(path: Path) -> EvalPolicy:
    """Load and validate an evaluation policy from JSON."""

    return EvalPolicy.model_validate_json(path.read_text(encoding="utf-8"))


def load_report(path: Path) -> EvalReport:
    """Load a previously-written evaluation report from JSON."""

    return EvalReport.model_validate_json(path.read_text(encoding="utf-8"))
