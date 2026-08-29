---
tags:
  - analysis
  - core-vnext
  - release
  - merge-readiness
description: PR #281 的 v0.11 milestone merge-readiness、deferred scope 与 release gate 证据
created: 2026-08-29T20:00:00+08:00
updated: 2026-08-29T20:00:00+08:00
---

# Core vNext v0.11 Merge Readiness — PR #281

## Decision

**Recommendation: merge after this documentation-only closure commit passes exact-head CI.**

The implementation baseline reviewed before the closure-only diff is `439fdc315a6ea595891c6041f318bd18db2b74cd`. At that SHA PR #281 was `MERGEABLE`, `CLEAN`, and the exact-head CI run `33238265083` completed successfully across required build/typecheck/unit/static/governance/verification/Web-flow/integration/coverage/performance/delivery-observation gates.

No new runtime feature is introduced by the closure pass. Therefore the final merge gate is intentionally simple: this plan-truth diff must remain documentation-only and its new exact HEAD must pass required CI before PR #281 is merged.

## v0.11 milestone accepted scope

- Core vNext Waves 0–2 contract/domain/schema convergence.
- Wave 3 durable Task/Goal/Routine scheduling, NotificationRequested, scheduler separation, settlement, and projection repair.
- Wave 4 Routine local runtime/intervention/focus and FullCalendar Planner engine/owner-aware mutation cutover.
- Web/Desktop primary Goal, Task, Routine, Planner, and Notification vNext surfaces.
- Production clean rebuild and health acceptance.
- Production GitHub App Web install → finalize → connect → real push webhook → projection acceptance.
- Transactional email recovery through the existing Brevo SMTP configuration and real Better Auth sign-up path.
- Exact-digest production application/runtime pinning and dual-registry release distribution contracts.

## Verified merge blockers

| Class                                            | Result          | Evidence                                                                      |
| ------------------------------------------------ | --------------- | ----------------------------------------------------------------------------- |
| P0 data-loss / broken primary path               | none unresolved | production health + vNext vertical/reliability gates                          |
| P1 architecture/contract bypass inside milestone | none unresolved | schedule-notification governance, boundary/integration oracles, exact-head CI |
| Git conflict / stale branch                      | none            | PR #281 mergeable + clean at reviewed baseline                                |
| Uncommitted integration work                     | none            | integration worktree clean at reviewed baseline                               |

## Explicit post-v0.11 follow-up

The following work remains real and is **not relabeled as completed**:

- Routine method library (`ROUTINE-5302`).
- AI Goal/Task/Routine/Planner/Notification parity (`AI-6101~6103`).
- React/mobile Goal/Task/Notification parity (`MOBILE-6201/6202`).
- Residual legacy/physical cleanup (`CLEAN-6301~6304`), including product-facing raw ScheduleTask remnants outside the already-governed normal Planner path.
- pg-boss PoC (`POC-6401`).
- Remaining full long-horizon failure/acceptance/docs closure that depends on deferred surfaces (`HARD-7101~7104`).
- AI Provider Onboarding V2, tracked independently in its own active plan.

Residual audit intentionally remains visible rather than being hidden by checkbox churn. Examples include React/mobile legacy cards/hooks and legacy Reminder/ScheduleTask compatibility surfaces. Those are follow-up debt, not newly discovered regressions in the already production-accepted Web/Desktop v0.11 path.

## Release-only acceptance still required

The durable GitHub installation gateway has one live acceptance item that cannot be honestly completed until a new Windows artifact exists:

`Windows release package -> Desktop external browser -> GitHub installation -> polling/finalize -> repository inventory/connect`.

This is a **release acceptance gate**, not a reason to keep the integration branch unmerged. If it fails on the released candidate, the release is not considered fully accepted even if GitHub Actions published the artifact.

## Merge protocol

1. Run docs/governance checks on this closure diff.
2. Commit and push the closure-only changes.
3. Require exact-head CI success on PR #281.
4. Mark PR #281 ready for review and merge it to `main` without adding unrelated implementation work.
5. Run `Prepare Release`; merge the release-please PR only after its required checks pass.
6. Let `Release Publish` build Windows/Linux assets and ACR/GHCR images from the exact successful release commit.
7. Perform the Windows live acceptance above against the published candidate.

## Release lifecycle recovery — 2026-08-29

The first `v0.11.0` release-please merge produced main commit `3627c7e0cf4a446b1e3921f6d4d12d1d32e36fc7` and passed exact-SHA CI, but `Release Publish` correctly left the release unpublished because the release detector only recognized a direct `chore(main): release X.Y.Z` HEAD subject. The repository intentionally merges release PRs with merge commits, so HEAD instead had GitHub's `Merge pull request ...` subject.

The release contract now preserves the main merge commit as the immutable release SHA while, only for an exact two-parent merge commit, accepting the second parent's strict release-please subject. A regression fixture reproduces the GitHub merge shape and remains fail-closed for non-release subjects and version identity drift.

This documentation-only marker is the retry candidate for `0.11.0`; publication still requires its PR checks, main exact-SHA CI, Desktop lane, Docker lane, and postflight to pass.

### Release retry 2 — preserve merge-parent history

The next publication attempt reached the real release candidate, but `Create or Resume Draft Release` re-validated the exact SHA from an `actions/checkout` shallow clone. With depth 1 the release merge commit's second parent was unavailable, so the otherwise-correct merged-release detector could not recover the release-please subject. The same shallow-history defect also existed in the Desktop source checkout and Docker source checkout that re-run the release contract.

All three release-validation checkouts now use full history (`fetch-depth: 0`). A workflow regression test locks the invariant so prepare, Desktop, and Docker validation cannot silently regress to depth 1. This marker retries `v0.11.0`; all normal PR, exact-main-CI, Desktop, Docker, and postflight gates remain mandatory.

### Release retry 3 — stabilize the Goal label-filter release gate

Main release candidate `1d7d671da63ec8804209b773f08ce78e10b18ba0` passed every required CI lane except one Goal Web Flow case: the resize/state-preservation scenario sometimes attempted to select a visible `CommandItem` while Reka's filtered option node was being re-mounted. The product Goal/Label code had not changed from three immediately preceding exact-head runs where all four Web Flow shards passed; the failure trace showed the selection action, not resize or controlled state, was the unstable point.

The E2E now first proves the exact label option is visible and then performs the real click with Playwright actionability stability checks disabled for that transient node. The application still receives the normal click and `update:modelValue` path; only Playwright's requirement that the DOM node remain geometrically stable is bypassed. The isolated P0 scenario then passed three consecutive runs end to end, including sign-up, Goal/Label creation, filtering, resize, and post-resize state preservation. Web lint/typecheck and formatting also passed. This marker retries `v0.11.0` without changing product runtime code.
