"""Evaluation report generation, quality-gate evaluation, and result builders.

Contains the helpers that convert raw evaluation outcomes into the
machine-readable ``EvalReport`` format, plus check-level assertion helpers.
"""

from __future__ import annotations

import json
import shutil
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ai_service.evals.eval_models import (
    AgentRuntimeGoalCreateEvalCase,
    AgentRuntimeKnowledgeGenerateEvalCase,
    AgentRuntimeKnowledgeQaEvalCase,
    ChatSanityEvalCase,
    EvalCheck,
    EvalMode,
    EvalPolicy,
    EvalReport,
    EvalResult,
    GoalPlanningEvalCase,
    KnowledgeGroundingEvalCase,
)
from ai_service.schemas import (
    AgentArtifact,
    AgentRunResult,
    IndexedKnowledgeResource,
    KnowledgeQueryResponse,
    ProviderConfig,
)

# ── Result builders ────────────────────────────────────────────────────────


def build_goal_planning_eval_result(
    *,
    case: GoalPlanningEvalCase,
    response: Any,
) -> EvalResult:
    """Convert a goal-planning response into standardized checks."""

    key_results = response.key_results or []
    goal_blob = " ".join(
        filter(
            None,
            [
                response.goal.title,
                response.goal.description,
                response.goal.motivation,
                response.goal.feasibility_analysis,
                response.goal.ai_insights,
            ],
        )
    ).lower()

    checks = [
        check_non_empty("goal_title_present", response.goal.title),
        EvalCheck(
            name="goal_dates_increasing",
            passed=response.goal.suggested_end_date
            > response.goal.suggested_start_date,
            detail=(
                "Suggested end date must be after start date."
                if response.goal.suggested_end_date
                <= response.goal.suggested_start_date
                else "Goal dates are ordered correctly."
            ),
        ),
        EvalCheck(
            name="goal_category_matches",
            passed=(
                case.expected_goal_category is None
                or response.goal.category == case.expected_goal_category
            ),
            detail=(
                "Expected category "
                f"{case.expected_goal_category}, got "
                f"{response.goal.category}."
                if case.expected_goal_category is not None
                and response.goal.category != case.expected_goal_category
                else "Goal category matches expectations."
            ),
        ),
        EvalCheck(
            name="key_result_count_in_range",
            passed=case.min_key_results <= len(key_results) <= case.max_key_results,
            detail=(
                f"Expected {case.min_key_results}-{case.max_key_results} key results, "
                f"got {len(key_results)}."
                if not case.min_key_results <= len(key_results) <= case.max_key_results
                else f"Key result count {len(key_results)} is within range."
            ),
        ),
    ]
    checks.extend(
        [
            EvalCheck(
                name=f"goal_mentions:{term}",
                passed=term.lower() in goal_blob,
                detail=(
                    f'Goal output should mention "{term}".'
                    if term.lower() not in goal_blob
                    else f'Goal output mentions "{term}".'
                ),
            )
            for term in case.expected_goal_terms
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "goal_title": response.goal.title,
            "key_result_count": len(key_results),
            "goal_category": response.goal.category,
        },
    )


def build_knowledge_grounding_eval_result(
    *,
    case: KnowledgeGroundingEvalCase,
    response: KnowledgeQueryResponse,
    indexed_resources: list[IndexedKnowledgeResource],
) -> EvalResult:
    """Convert a knowledge-grounding response into standardized checks."""

    indexed_paths = {resource.resource_path for resource in indexed_resources}
    cited_paths = [citation.resource_path for citation in response.citations]
    answer_lower = response.answer.lower()

    checks = [
        EvalCheck(
            name="citation_presence_matches_expectation",
            passed=(len(response.citations) > 0) == case.expect_citations,
            detail=(
                "Expected citations="
                f"{case.expect_citations}, got {len(response.citations)}."
                if (len(response.citations) > 0) != case.expect_citations
                else "Citation presence matches expectation."
            ),
        ),
        EvalCheck(
            name="citations_reference_indexed_resources",
            passed=all(path in indexed_paths for path in cited_paths),
            detail=(
                "All citations reference indexed repository resources."
                if all(path in indexed_paths for path in cited_paths)
                else "Found citations that were not part of the indexed resource set."
            ),
        ),
    ]
    checks.extend(
        [
            EvalCheck(
                name=f"cites_expected_path:{path}",
                passed=path in cited_paths,
                detail=(
                    f'Expected citation for "{path}" was not returned.'
                    if path not in cited_paths
                    else f'Citation for "{path}" was returned.'
                ),
            )
            for path in case.expected_resource_paths
        ]
    )
    checks.extend(
        [
            EvalCheck(
                name=f"answer_mentions:{term}",
                passed=term.lower() in answer_lower,
                detail=(
                    f'Answer should mention "{term}".'
                    if term.lower() not in answer_lower
                    else f'Answer mentions "{term}".'
                ),
            )
            for term in case.expected_answer_substrings
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "citation_count": len(response.citations),
            "cited_paths": cited_paths,
            "answer_preview": response.answer[:160],
        },
    )


def build_chat_eval_result(
    *,
    case: ChatSanityEvalCase,
    answer: str,
) -> EvalResult:
    """Convert one chat answer into standardized sanity checks."""

    checks = [check_non_empty("response_non_empty", answer)]
    checks.extend(
        check_contains_text(
            answer,
            expected=case.expected_substrings,
            forbidden=case.forbidden_substrings,
        )
    )
    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "response_preview": answer[:160],
        },
    )


def build_agent_runtime_goal_create_eval_result(
    *,
    case: AgentRuntimeGoalCreateEvalCase,
    response: AgentRunResult,
) -> EvalResult:
    """Convert a goal.create Agent runtime snapshot into checks."""

    expected = case.expected
    goal_artifact = find_agent_artifact(response, "goal_draft")
    goal_data = goal_artifact.data if goal_artifact is not None else {}
    key_results = goal_data.get("keyResults")
    key_result_count = len(key_results) if isinstance(key_results, list) else 0
    action_tools = [action.tool for action in response.state.pending_actions]
    goal_blob = flatten_text(goal_data).lower()
    has_approval_interrupt = any(
        is_goal_approval_interrupt(interrupt) for interrupt in response.interrupts
    )

    checks = [
        EvalCheck(
            name="run_status_matches",
            passed=response.run.status == expected.run_status,
            detail=(
                f"Expected run status {expected.run_status}, got {response.run.status}."
                if response.run.status != expected.run_status
                else "Run status matches expectations."
            ),
        ),
        EvalCheck(
            name="stage_matches",
            passed=response.state.stage == expected.stage,
            detail=(
                f"Expected stage {expected.stage}, got {response.state.stage}."
                if response.state.stage != expected.stage
                else "Runtime stage matches expectations."
            ),
        ),
        EvalCheck(
            name="goal_draft_artifact_present",
            passed=goal_artifact is not None,
            detail=(
                "Goal draft artifact is present."
                if goal_artifact is not None
                else "Goal draft artifact was not produced."
            ),
        ),
        EvalCheck(
            name="key_result_count_at_least_minimum",
            passed=key_result_count >= expected.min_key_results,
            detail=(
                f"Expected at least {expected.min_key_results} key results, "
                f"got {key_result_count}."
                if key_result_count < expected.min_key_results
                else f"Key result count {key_result_count} meets expectations."
            ),
        ),
        EvalCheck(
            name="approval_interrupt_present",
            passed=(not expected.require_approval_interrupt or has_approval_interrupt),
            detail=(
                "Approval interrupt is present."
                if (not expected.require_approval_interrupt or has_approval_interrupt)
                else "Expected an approval interrupt before side effects."
            ),
        ),
    ]

    if expected.expected_action_tools:
        checks.append(
            EvalCheck(
                name="action_tools_match",
                passed=action_tools == expected.expected_action_tools,
                detail=(
                    f"Expected action tools {expected.expected_action_tools}, "
                    f"got {action_tools}."
                    if action_tools != expected.expected_action_tools
                    else "Action tools match expectations."
                ),
            )
        )

    if expected.usage_total_tokens is not None:
        checks.append(
            EvalCheck(
                name="usage_total_tokens_matches",
                passed=response.state.usage.total_tokens == expected.usage_total_tokens,
                detail=(
                    f"Expected total tokens {expected.usage_total_tokens}, "
                    f"got {response.state.usage.total_tokens}."
                    if response.state.usage.total_tokens != expected.usage_total_tokens
                    else "Total token usage matches expectations."
                ),
            )
        )

    checks.extend(
        [
            EvalCheck(
                name=f"goal_mentions:{term}",
                passed=term.lower() in goal_blob,
                detail=(
                    f'Goal draft should mention "{term}".'
                    if term.lower() not in goal_blob
                    else f'Goal draft mentions "{term}".'
                ),
            )
            for term in expected.expected_goal_terms
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "run_status": response.run.status,
            "stage": response.state.stage,
            "goal_title": goal_artifact.title if goal_artifact else None,
            "key_result_count": key_result_count,
            "action_tools": action_tools,
            "usage": response.state.usage.model_dump(
                by_alias=True,
                exclude_none=True,
            ),
        },
    )


def build_agent_runtime_knowledge_qa_eval_result(
    *,
    case: AgentRuntimeKnowledgeQaEvalCase,
    response: AgentRunResult,
) -> EvalResult:
    """Convert a knowledge.qa Agent runtime snapshot into checks."""

    expected = case.expected
    answer_artifact = find_agent_artifact(response, "knowledge_answer")
    answer_data = answer_artifact.data if answer_artifact is not None else {}
    answer_text = str(answer_data.get("answer") or "")
    evidence_status = answer_data.get("evidenceStatus")
    matched_resource_count = answer_data.get("matchedResourceCount")
    cited_paths = [citation.resource_path for citation in response.state.citations]

    checks = [
        EvalCheck(
            name="run_completed",
            passed=response.run.status == "completed",
            detail=(
                "Knowledge QA runtime completed."
                if response.run.status == "completed"
                else f"Expected completed run, got {response.run.status}."
            ),
        ),
        EvalCheck(
            name="knowledge_answer_artifact_present",
            passed=answer_artifact is not None,
            detail=(
                "Knowledge answer artifact is present."
                if answer_artifact is not None
                else "Knowledge answer artifact was not produced."
            ),
        ),
        EvalCheck(
            name="evidence_status_matches",
            passed=evidence_status == expected.evidence_status,
            detail=(
                f"Expected evidenceStatus {expected.evidence_status}, "
                f"got {evidence_status}."
                if evidence_status != expected.evidence_status
                else "Evidence status matches expectations."
            ),
        ),
        EvalCheck(
            name="citation_presence_matches_expectation",
            passed=(len(response.state.citations) > 0) == expected.expect_citations,
            detail=(
                f"Expected citations={expected.expect_citations}, "
                f"got {len(response.state.citations)}."
                if (len(response.state.citations) > 0) != expected.expect_citations
                else "Citation presence matches expectations."
            ),
        ),
    ]

    checks.extend(
        [
            EvalCheck(
                name=f"cites_expected_path:{path}",
                passed=path in cited_paths,
                detail=(
                    f'Expected citation for "{path}" was not returned.'
                    if path not in cited_paths
                    else f'Citation for "{path}" was returned.'
                ),
            )
            for path in expected.expected_resource_paths
        ]
    )
    checks.extend(
        [
            EvalCheck(
                name=f"answer_mentions:{term}",
                passed=term.lower() in answer_text.lower(),
                detail=(
                    f'Answer should mention "{term}".'
                    if term.lower() not in answer_text.lower()
                    else f'Answer mentions "{term}".'
                ),
            )
            for term in expected.expected_answer_substrings
        ]
    )

    if expected.usage_total_tokens is not None:
        checks.append(
            EvalCheck(
                name="usage_total_tokens_matches",
                passed=response.state.usage.total_tokens == expected.usage_total_tokens,
                detail=(
                    f"Expected total tokens {expected.usage_total_tokens}, "
                    f"got {response.state.usage.total_tokens}."
                    if response.state.usage.total_tokens != expected.usage_total_tokens
                    else "Total token usage matches expectations."
                ),
            )
        )

    if expected.min_matched_resource_count is not None:
        checks.append(
            EvalCheck(
                name="matched_resource_count_at_least_minimum",
                passed=(
                    isinstance(matched_resource_count, int)
                    and matched_resource_count >= expected.min_matched_resource_count
                ),
                detail=(
                    f"Expected at least "
                    f"{expected.min_matched_resource_count} matched resources, "
                    f"got {matched_resource_count}."
                    if not (
                        isinstance(matched_resource_count, int)
                        and matched_resource_count
                        >= expected.min_matched_resource_count
                    )
                    else "Matched resource count meets expectations."
                ),
            )
        )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "run_status": response.run.status,
            "stage": response.state.stage,
            "evidence_status": evidence_status,
            "citation_count": len(response.state.citations),
            "cited_paths": cited_paths,
            "matched_resource_count": matched_resource_count,
            "answer_preview": answer_text[:160],
            "usage": response.state.usage.model_dump(
                by_alias=True,
                exclude_none=True,
            ),
        },
    )


def build_agent_runtime_knowledge_generate_eval_result(
    *,
    case: AgentRuntimeKnowledgeGenerateEvalCase,
    response: AgentRunResult,
) -> EvalResult:
    """Convert a knowledge.generate Agent runtime snapshot into checks."""

    expected = case.expected
    draft_artifact = find_agent_artifact(response, "knowledge_note_draft")
    draft_data = draft_artifact.data if draft_artifact is not None else {}
    save_plan = draft_data.get("savePlan")
    pending_action = (
        save_plan.get("pendingAction")
        if isinstance(save_plan, dict)
        else None
    )
    pending_payload = (
        pending_action.get("payload")
        if isinstance(pending_action, dict)
        else {}
    )
    post_save = save_plan.get("postSave") if isinstance(save_plan, dict) else {}
    action_tools = [action.tool for action in response.state.pending_actions]
    topic_text = str(draft_data.get("topic") or "")
    markdown_text = str(draft_data.get("markdown") or "")
    has_approval_interrupt = any(
        is_knowledge_generate_approval_interrupt(interrupt)
        for interrupt in response.interrupts
    )

    checks = [
        EvalCheck(
            name="run_status_matches",
            passed=response.run.status == expected.run_status,
            detail=(
                f"Expected run status {expected.run_status}, got "
                f"{response.run.status}."
                if response.run.status != expected.run_status
                else "Run status matches expectations."
            ),
        ),
        EvalCheck(
            name="stage_matches",
            passed=response.state.stage == expected.stage,
            detail=(
                f"Expected stage {expected.stage}, got {response.state.stage}."
                if response.state.stage != expected.stage
                else "Runtime stage matches expectations."
            ),
        ),
        EvalCheck(
            name="knowledge_note_draft_artifact_present",
            passed=draft_artifact is not None,
            detail=(
                "Knowledge note draft artifact is present."
                if draft_artifact is not None
                else "Knowledge note draft artifact was not produced."
            ),
        ),
        EvalCheck(
            name="approval_interrupt_present",
            passed=(not expected.require_approval_interrupt or has_approval_interrupt),
            detail=(
                "Approval interrupt is present."
                if (not expected.require_approval_interrupt or has_approval_interrupt)
                else "Expected an approval interrupt before repository writes."
            ),
        ),
    ]

    if expected.expected_title is not None:
        checks.append(
            EvalCheck(
                name="draft_title_matches",
                passed=draft_data.get("title") == expected.expected_title,
                detail=(
                    f"Expected title {expected.expected_title!r}, got "
                    f"{draft_data.get('title')!r}."
                    if draft_data.get("title") != expected.expected_title
                    else "Draft title matches expectations."
                ),
            )
        )

    if expected.expected_action_tools:
        checks.append(
            EvalCheck(
                name="action_tools_match",
                passed=action_tools == expected.expected_action_tools,
                detail=(
                    f"Expected action tools {expected.expected_action_tools}, "
                    f"got {action_tools}."
                    if action_tools != expected.expected_action_tools
                    else "Action tools match expectations."
                ),
            )
        )

    if expected.expected_target_subpath is not None:
        target_subpath = (
            pending_payload.get("targetSubpath")
            if isinstance(pending_payload, dict)
            else None
        )
        checks.append(
            EvalCheck(
                name="target_subpath_matches",
                passed=target_subpath == expected.expected_target_subpath,
                detail=(
                    f"Expected targetSubpath {expected.expected_target_subpath}, "
                    f"got {target_subpath}."
                    if target_subpath != expected.expected_target_subpath
                    else "Target subpath matches expectations."
                ),
            )
        )

    if expected.expected_index_status is not None:
        index_status = (
            post_save.get("indexStatus") if isinstance(post_save, dict) else None
        )
        checks.append(
            EvalCheck(
                name="post_save_index_status_matches",
                passed=index_status == expected.expected_index_status,
                detail=(
                    f"Expected post-save indexStatus "
                    f"{expected.expected_index_status}, got {index_status}."
                    if index_status != expected.expected_index_status
                    else "Post-save index status matches expectations."
                ),
            )
        )

    checks.extend(
        [
            EvalCheck(
                name=f"topic_mentions:{term}",
                passed=term.lower() in topic_text.lower(),
                detail=(
                    f'Topic should mention "{term}".'
                    if term.lower() not in topic_text.lower()
                    else f'Topic mentions "{term}".'
                ),
            )
            for term in expected.expected_topic_substrings
        ]
    )
    checks.extend(
        [
            EvalCheck(
                name=f"markdown_mentions:{term}",
                passed=term.lower() in markdown_text.lower(),
                detail=(
                    f'Markdown should mention "{term}".'
                    if term.lower() not in markdown_text.lower()
                    else f'Markdown mentions "{term}".'
                ),
            )
            for term in expected.expected_markdown_substrings
        ]
    )

    return build_eval_result(
        case_id=case.id,
        case_type=case.type,
        description=case.description,
        checks=checks,
        metadata={
            "run_status": response.run.status,
            "stage": response.state.stage,
            "draft_title": draft_data.get("title"),
            "action_tools": action_tools,
            "target_subpath": (
                pending_payload.get("targetSubpath")
                if isinstance(pending_payload, dict)
                else None
            ),
            "index_status": (
                post_save.get("indexStatus") if isinstance(post_save, dict) else None
            ),
            "markdown_preview": markdown_text[:160],
        },
    )


def find_agent_artifact(
    response: AgentRunResult,
    kind: str,
) -> AgentArtifact | None:
    """Find one Agent artifact by kind."""

    return next(
        (artifact for artifact in response.state.artifacts if artifact.kind == kind),
        None,
    )


def is_goal_approval_interrupt(interrupt: dict[str, Any]) -> bool:
    """Return whether an interrupt carries the goal approval payload contract."""

    return interrupt.get("type") == "approval.required" or (
        interrupt.get("agentType") == "goal.create"
        and isinstance(interrupt.get("pendingActions"), list)
        and isinstance(interrupt.get("artifacts"), list)
    )


def is_knowledge_generate_approval_interrupt(interrupt: dict[str, Any]) -> bool:
    """Return whether an interrupt carries knowledge.generate approval payload."""

    return interrupt.get("type") == "approval.required" or (
        interrupt.get("agentType") == "knowledge.generate"
        and isinstance(interrupt.get("pendingActions"), list)
        and isinstance(interrupt.get("artifacts"), list)
    )


def flatten_text(value: Any) -> str:
    """Flatten nested JSON-like values into one text blob for term checks."""

    if value is None:
        return ""
    if isinstance(value, dict):
        return " ".join(flatten_text(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(flatten_text(item) for item in value)
    return str(value)


# ── Check helpers ──────────────────────────────────────────────────────────


def check_non_empty(name: str, value: str) -> EvalCheck:
    """Create a non-empty-string check."""

    normalized = value.strip()
    return EvalCheck(
        name=name,
        passed=bool(normalized),
        detail="Value is present." if normalized else "Value must not be empty.",
    )


def check_contains_text(
    answer: str,
    *,
    expected: list[str],
    forbidden: list[str],
) -> list[EvalCheck]:
    """Build substring inclusion/exclusion checks."""

    answer_lower = answer.lower()
    checks: list[EvalCheck] = []

    for token in expected:
        checks.append(
            EvalCheck(
                name=f"contains:{token}",
                passed=token.lower() in answer_lower,
                detail=(
                    f'Answer should contain "{token}".'
                    if token.lower() not in answer_lower
                    else f'Answer contains "{token}".'
                ),
            )
        )

    for token in forbidden:
        checks.append(
            EvalCheck(
                name=f"excludes:{token}",
                passed=token.lower() not in answer_lower,
                detail=(
                    f'Answer should not contain "{token}".'
                    if token.lower() in answer_lower
                    else f'Answer excludes "{token}".'
                ),
            )
        )

    return checks


# ── Report infrastructure ──────────────────────────────────────────────────


def build_eval_result(
    *,
    case_id: str,
    case_type: str,
    description: str,
    checks: list[EvalCheck],
    metadata: dict[str, Any],
) -> EvalResult:
    """Aggregate check-level outcomes into one case result."""

    passed_count = sum(1 for check in checks if check.passed)
    total = len(checks)
    score = 1.0 if total == 0 else round(passed_count / total, 4)

    return EvalResult(
        id=case_id,
        type=case_type,
        description=description,
        passed=passed_count == total,
        score=score,
        checks=checks,
        metadata=metadata,
    )


def evaluate_quality_gate(
    *,
    report_results: list[EvalResult],
    policy: EvalPolicy,
    baseline_report: EvalReport | None = None,
) -> list[str]:
    """Evaluate report results against policy thresholds and an optional baseline."""

    failures: list[str] = []
    total_cases = len(report_results)
    passed_cases = sum(1 for result in report_results if result.passed)
    pass_rate = 0.0 if total_cases == 0 else passed_cases / total_cases

    if pass_rate < policy.minimum_pass_rate:
        failures.append(
            f"pass_rate below minimum: {pass_rate:.4f} < {policy.minimum_pass_rate:.4f}"
        )

    result_ids = {result.id for result in report_results}
    for case_id in policy.required_case_ids:
        if case_id not in result_ids:
            failures.append(f"required case missing: {case_id}")

    if baseline_report is None:
        return failures

    baseline_by_id = {result.id: result for result in baseline_report.results}
    current_by_id = {result.id: result for result in report_results}

    for case_id, current in current_by_id.items():
        baseline = baseline_by_id.get(case_id)
        if baseline is None:
            continue

        score_drop = baseline.score - current.score
        if score_drop > policy.max_allowed_score_drop:
            failures.append(
                f"score regression for {case_id}: "
                f"{current.score:.4f} vs baseline {baseline.score:.4f}"
            )

        if policy.require_no_new_failures and baseline.passed and not current.passed:
            failures.append(f"new failure introduced: {case_id}")

    return failures


def build_report(
    *,
    cases_path: Path,
    results: list[EvalResult],
    mode: EvalMode = "deterministic",
    provider_config: ProviderConfig | None = None,
    gate_failures: list[str] | None = None,
    baseline_path: Path | None = None,
    archive_path: Path | None = None,
) -> EvalReport:
    """Convert case results into one top-level report object."""

    total_cases = len(results)
    passed_cases = sum(1 for result in results if result.passed)
    failed_cases = total_cases - passed_cases
    by_type = dict(sorted(Counter(result.type for result in results).items()))
    normalized_gate_failures = gate_failures or []

    return EvalReport(
        generated_at=datetime.now(tz=UTC).isoformat(),
        mode=mode,
        provider=provider_config.provider if provider_config else None,
        model=provider_config.model if provider_config else None,
        base_url=provider_config.base_url if provider_config else None,
        cases_path=str(cases_path),
        total_cases=total_cases,
        passed_cases=passed_cases,
        failed_cases=failed_cases,
        pass_rate=0.0 if total_cases == 0 else round(passed_cases / total_cases, 4),
        by_type=by_type,
        failed_case_ids=[result.id for result in results if not result.passed],
        gate_passed=len(normalized_gate_failures) == 0,
        gate_failures=normalized_gate_failures,
        baseline_path=str(baseline_path) if baseline_path else None,
        archive_path=str(archive_path) if archive_path else None,
        results=results,
    )


def write_report(report: EvalReport, output_path: Path) -> None:
    """Persist the report JSON to disk."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def archive_report(output_path: Path, archive_dir: Path, generated_at: str) -> Path:
    """Copy the latest report into a timestamped history location."""

    archive_dir.mkdir(parents=True, exist_ok=True)
    timestamp = generated_at.replace(":", "-")
    archive_path = archive_dir / f"{timestamp}.json"
    shutil.copyfile(output_path, archive_path)
    return archive_path


def ensure_live_chat_service(
    chat_service: Any,
) -> Any:
    """Validate that live mode received a concrete chat service."""

    if chat_service is None:
        raise ValueError("Live evaluation mode requires a chat service instance.")
    return chat_service


def ensure_live_provider_config(
    live_eval_config: Any,
) -> ProviderConfig:
    """Validate that live mode received a concrete provider config."""

    if live_eval_config is None:
        raise ValueError("Live evaluation mode requires provider configuration.")
    return live_eval_config.provider_config
