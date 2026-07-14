"""CLI entrypoint for the evaluation runner."""

from __future__ import annotations

import argparse
import asyncio
import os
import shutil
from pathlib import Path
from typing import cast

import httpx

from ai_service.evals.eval_case_loader import (
    filter_eval_cases,
    load_eval_cases,
    load_policy,
    load_report,
)
from ai_service.evals.eval_models import (
    DEFAULT_ARCHIVE_DIR,
    DEFAULT_BASELINE_PATH,
    DEFAULT_CASES_PATH,
    DEFAULT_LIVE_ARCHIVE_DIR,
    DEFAULT_LIVE_BASELINE_PATH,
    DEFAULT_LIVE_CASES_PATH,
    DEFAULT_LIVE_OUTPUT_PATH,
    DEFAULT_LIVE_POLICY_PATH,
    DEFAULT_OUTPUT_PATH,
    DEFAULT_POLICY_PATH,
    EvalMode,
    LiveEvalConfig,
)
from ai_service.evals.eval_reporter import (
    archive_report,
    build_report,
    evaluate_quality_gate,
    write_report,
)
from ai_service.evals.runner import evaluate_cases_with_mode
from ai_service.schemas import ProviderConfig
from ai_service.services.chat_service import create_chat_service


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the evaluation runner."""

    parser = argparse.ArgumentParser(description="Run deterministic ai-service evals.")
    parser.add_argument(
        "--mode",
        choices=("deterministic", "live"),
        default="deterministic",
        help="Use deterministic stubbed outputs or a live provider configuration.",
    )
    parser.add_argument(
        "--cases",
        type=Path,
        default=None,
        help="Path to the JSON file containing evaluation cases.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Where to write the JSON evaluation report.",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        default=None,
        help="Path to the JSON policy file for quality-gate thresholds.",
    )
    parser.add_argument(
        "--baseline",
        type=Path,
        default=None,
        help="Optional baseline report to compare current results against.",
    )
    parser.add_argument(
        "--archive-dir",
        type=Path,
        default=None,
        help="Directory where timestamped report history should be written.",
    )
    parser.add_argument(
        "--case-id",
        default=None,
        help="Run only one named evaluation case from the selected case file.",
    )
    parser.add_argument(
        "--provider",
        default=None,
        help="Live mode only: provider name, for example openai or anthropic.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Live mode only: provider model name.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Live mode only: provider API key. Falls back to AI_SERVICE_EVAL_API_KEY.",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="Live mode only: optional custom base URL.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Live mode only: provider temperature.",
    )
    return parser.parse_args()


async def run() -> int:
    """CLI entrypoint used by the Nx eval target."""

    args = parse_args()
    mode = cast(EvalMode, args.mode)
    cases_path = resolve_cases_path(args)
    output_path = resolve_output_path(args)
    policy_path = resolve_policy_path(args)
    baseline_path = resolve_baseline_path(args)
    archive_dir = resolve_archive_dir(args)
    cases = filter_eval_cases(load_eval_cases(cases_path), case_id=args.case_id)
    policy = load_policy(policy_path)
    baseline_report = load_report(baseline_path) if baseline_path.exists() else None

    live_eval_config = resolve_live_eval_config(args) if mode == "live" else None
    if mode == "live":
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            results = await evaluate_cases_with_mode(
                cases,
                mode=mode,
                live_eval_config=live_eval_config,
                chat_service=create_chat_service(http_client),
            )
    else:
        results = await evaluate_cases_with_mode(cases, mode=mode)

    gate_failures = evaluate_quality_gate(
        report_results=results,
        policy=policy,
        baseline_report=baseline_report,
    )
    report = build_report(
        cases_path=cases_path,
        results=results,
        mode=mode,
        provider_config=live_eval_config.provider_config if live_eval_config else None,
        gate_failures=gate_failures,
        baseline_path=baseline_path if baseline_report else None,
    )
    write_report(report, output_path)
    archive_path = archive_report(output_path, archive_dir, report.generated_at)
    archived_report = report.model_copy(update={"archive_path": str(archive_path)})
    write_report(archived_report, output_path)
    shutil.copyfile(output_path, archive_path)

    print(
        f"ai-service evals ({archived_report.mode}): "
        f"{archived_report.passed_cases}/{archived_report.total_cases} passed "
        f"({archived_report.pass_rate * 100:.1f}%)"
    )
    print(f"quality gate: {'passed' if archived_report.gate_passed else 'failed'}")
    if archived_report.failed_case_ids:
        print("failed cases:", ", ".join(archived_report.failed_case_ids))
    if archived_report.gate_failures:
        print("gate failures:", " | ".join(archived_report.gate_failures))
    if not archived_report.gate_passed:
        return 1
    return 0


def main() -> None:
    """Synchronous wrapper for the async evaluation runner."""

    raise SystemExit(asyncio.run(run()))


def resolve_cases_path(args: argparse.Namespace) -> Path:
    """Resolve the effective cases path for the selected mode."""

    if args.cases is not None:
        return args.cases
    return DEFAULT_LIVE_CASES_PATH if args.mode == "live" else DEFAULT_CASES_PATH


def resolve_policy_path(args: argparse.Namespace) -> Path:
    """Resolve the effective policy path for the selected mode."""

    if args.policy is not None:
        return args.policy
    return DEFAULT_LIVE_POLICY_PATH if args.mode == "live" else DEFAULT_POLICY_PATH


def resolve_baseline_path(args: argparse.Namespace) -> Path:
    """Resolve the effective baseline path for the selected mode."""

    if args.baseline is not None:
        return args.baseline
    return DEFAULT_LIVE_BASELINE_PATH if args.mode == "live" else DEFAULT_BASELINE_PATH


def resolve_output_path(args: argparse.Namespace) -> Path:
    """Resolve the effective output path for the selected mode."""

    if args.output is not None:
        return args.output
    return DEFAULT_LIVE_OUTPUT_PATH if args.mode == "live" else DEFAULT_OUTPUT_PATH


def resolve_archive_dir(args: argparse.Namespace) -> Path:
    """Resolve the effective archive directory for the selected mode."""

    if args.archive_dir is not None:
        return args.archive_dir
    return DEFAULT_LIVE_ARCHIVE_DIR if args.mode == "live" else DEFAULT_ARCHIVE_DIR


def resolve_live_eval_config(args: argparse.Namespace) -> LiveEvalConfig:
    """Resolve provider config for live evaluation mode from args or env."""

    provider = args.provider or os.environ.get("AI_SERVICE_EVAL_PROVIDER") or "openai"
    model = args.model or os.environ.get("AI_SERVICE_EVAL_MODEL")
    api_key = args.api_key or os.environ.get("AI_SERVICE_EVAL_API_KEY")
    base_url = args.base_url or os.environ.get("AI_SERVICE_EVAL_BASE_URL")

    if not model:
        raise ValueError(
            "Live evaluation mode requires --model or AI_SERVICE_EVAL_MODEL."
        )
    if not api_key:
        raise ValueError(
            "Live evaluation mode requires --api-key or AI_SERVICE_EVAL_API_KEY."
        )

    return LiveEvalConfig(
        provider_config=ProviderConfig(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=args.temperature,
            # Gemini free-tier often truncates early without an explicit budget.
            max_tokens=1024,
        )
    )


if __name__ == "__main__":
    main()

