---
tags:
  - plan
  - active
  - ci
  - cd
  - release
  - deployment
  - desktop
description: MemoFlow Delivery Platform V3 分阶段实施计划与可验证票据
created: 2026-09-02T16:15:00+08:00
updated: 2026-09-05T16:05:00+08:00
---

# MemoFlow Delivery Platform V3 Implementation Plan

> Status: ACTIVE — Phase 1 + Phase 2 closed; Phase 3 control plane implemented; v0.13.2 app/runtime regression fixed, Linux Secret Service/control-plane tooling authority repair validated locally; GitHub retry + Alibaba acceptance pending
> Governing ADR: [ADR-066](../../architecture/adr/ADR-066-adopt-delivery-platform-v3.md)  
> Architecture: [Delivery Platform V3](../../architecture/delivery-platform-v3.md)  
> Release contract: [Release Lifecycle V3](../../architecture/release-lifecycle-v3.md)

## 1. Outcome

Deliver a production-shaped flow where:

```text
PR selects only necessary verification
main always receives full verification
successful main produces one immutable server candidate
staging automatically represents a coherent exact main candidate
Release Publish promotes server candidates and builds all Desktop platforms
production explicitly selects a Published Release
runtime watchers deploy coherently with migration/health/rollback evidence
```

The first externally visible milestone is a Published MemoFlow release containing Windows x64, Linux x64, macOS x64 and macOS arm64 assets.

## Current implementation checkpoint — truth audit 2026-09-05

| Ticket / phase | Current truth                         | Evidence / remaining boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DLV3-0001      | **COMPLETE**                          | ADR-066, Delivery Platform V3 architecture, Release Lifecycle V3 and runbooks are published.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| DLV3-1101      | **COMPLETE**                          | Desktop-aware scope/risk selection is merged; `main` still forces full verification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DLV3-1102      | **COMPLETE**                          | successful-main-CI release-please maintenance and manual recovery paths are live and have been exercised repeatedly by v0.12.x release PRs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DLV3-1103      | **COMPLETE**                          | native matrix builds Windows x64, Linux x64, macOS x64 and macOS arm64 with packaged-runtime receipts and fail-closed manifest checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DLV3-1104      | **COMPLETE for Phase 1 scope**        | touched release workflows use pinned reviewed Actions; repository-wide convergence remains DLV3-4402.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| DLV3-1105      | **COMPLETE**                          | `v0.12.1` was Published on 2026-09-03 with Windows x64, Linux x64, macOS x64 and macOS arm64 assets, `desktop-release-manifest.json`, `release-manifest.json` and `SHA256SUMS.txt`; tag target `257c74eccbe87bba5f63a72217301ab8a17048e6`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Phase 2        | **COMPLETE**                          | PRs #306/#307/#308 established candidate-set, exact-SHA dual-registry candidates, coherent `staging-latest`, candidate-bound runtime mirrors and the GCP watcher. Main `60859e47065` and Candidate Publish run `33944690658` are green; GCP state is `DEPLOYED` at the same SHA and the watcher timer is active.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Phase 3        | **IN PROGRESS / RELEASE FAIL-CLOSED** | #310 + #311 merged DLV3-3301~3304. `v0.13.2` remains an immutable Draft at `08c2daf16e145d228d7d7a20c3282486dca58b0d`; Server promotion plus Windows x64, macOS x64 and macOS arm64 packaged smoke are proven. #317 bounded the Linux session, but retry `33965867292` exposed that the workflow still executed the helper from immutable `release-source`, so the new control-plane helper never ran and the old Secret Service path still activated `SystemPrompter`. The repaired authority is `release-tooling` helper + exact `release-source` workspace/test, using GNOME's PAM-style `--login -> --start` lifecycle. That exact split has now passed a local production-shaped `08c2daf...` Linux package + 76-runtime-dependency + packaged-Playwright run. Production remains untouched; merge the focused tooling repair and retry the same Draft before selection. |
| Phase 4        | **PARTIAL / DEFERRED**                | some Action pinning and delivery observations exist; consolidated-runner evidence, repository-wide Action pinning, macOS signing/notarization and final observation closure remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Phase 1 release evidence:

```text
v0.12.1 Published / non-prerelease
Windows x64 Setup + zip
Linux x64 AppImage + deb + rpm
macOS x64 dmg + zip
macOS arm64 dmg + zip
desktop-release-manifest.json + release-manifest.json + SHA256SUMS.txt
```

The next boundary is **Phase 3 corrective release acceptance**. `v0.13.0` and `v0.13.1` remain immutable failed Draft releases. `v0.13.2` is also immutable at release source `08c2daf16e145d228d7d7a20c3282486dca58b0d`, but its application-level ResizeObserver fix is proven on Windows x64, macOS x64 and macOS arm64. The Linux retry must use a mutable control-plane helper from `release-tooling` while keeping the executable, workspace and Playwright spec pinned to exact `release-source`; the helper now mirrors the GNOME Keyring PAM lifecycle (`--login` then `--start`) in an isolated control directory and bounds every Secret Service probe. This exact-source/tooling split has passed locally. Merge that focused release-tooling repair, then use `workflow_dispatch(tag=v0.13.2)` to resume/finalize the same Draft; PR #318 (`0.13.3`) exists but must remain unmerged while the same immutable Draft is recoverable without changing application code. Only after all four packaged Desktop runtime gates pass and `v0.13.2` is Published may `Deploy Production(v0.13.2)` select it and the Alibaba watcher proceed through check-only, mandatory backup, controlled rollout, exact-digest state and idempotent replay.

## 2. Baseline and measurable targets

Baseline Desktop-heavy PR #286:

| Metric                    | Baseline |                           Initial target |
| ------------------------- | -------: | ---------------------------------------: |
| Wall time                 |   11m08s | P50 ≤ 8m for comparable Desktop-only PRs |
| Runner job time           |   43m25s |                                P50 ≤ 22m |
| Web shard runner time     |  ~25m43s |               0 for Desktop-only changes |
| Missing required evidence |        0 |                                        0 |
| Main skipped safety lanes |        0 |                                        0 |

Current release platform coverage: **Windows x64 + Linux x64 + macOS Intel x64 + macOS Apple Silicon arm64**. The original Phase-1 platform target is complete.

## 3. Protected contracts

- existing required Oracle context names;
- full main validation;
- one source truth (`main`);
- exact-SHA/digest artifact identity;
- Draft-first release publication;
- ACR/GHCR parity;
- API/Migrator compatibility and migrator-first rollout;
- no PR production mutation;
- explicit production release selection;
- immutable release/tag/asset history;
- current GitHub App and PowerSync environment routing.

## Phase 0 — Evidence and architecture

### DLV3-0001 — Publish decision-serving documentation

**Goal:** Record current facts, target boundaries, rollout and rollback before authority changes.

**Scope:** analysis, ADR, architecture, release contract, Desktop contract, plan, runbook and indexes.

**Acceptance:** documents agree on state identities and do not represent future staging/production mechanics as already deployed.

## Phase 1 — CI scope and cross-platform release vertical slice

### DLV3-1101 — Add Desktop-aware scope selection

**Goal:** Desktop/Electron-only PRs do not run Web Flow shards.

**Scope:** risk classifier, manifest schema/contracts, generator, fixtures and CI condition wiring.

**Implementation:**

1. add `desktop` risk and scope field;
2. classify `apps/desktop/**`, Desktop packaging config and Electron-only adapters;
3. keep shared presentation/contracts able to select both Desktop and Web;
4. expose a durable Desktop scope/risk marker while the existing Validate and Boundary Oracles continue to own execution evidence;
5. add a historical fixture based on PR #286 paths;
6. prove main push still forces every existing authoritative lane.

An independent Desktop Oracle is intentionally deferred until it has its own non-duplicative evidence producer; Phase 1 does not add an enabled manifest lane with no receipt.

**Tests:** manifest/risk/contract tests; generated manifest validation; governance check.

**Acceptance:** historical #286 path set selects Desktop and does not select Web Flow; `main` event selects full.

### DLV3-1102 — Maintain Release PR after successful main CI

**Goal:** release-please PR appears/updates automatically after release-worthy main changes without publishing.

**Implementation:** use `workflow_run` of successful main `CI`, retain manual dispatch, add concurrency and negative workflow tests.

**Acceptance:** non-main/failed CI cannot run release-please; ordinary successful main CI may update the pending PR; Release Please cannot create tag/release/artifact.

### DLV3-1103 — Add macOS Intel and Apple Silicon release builds

**Goal:** release matrix covers four platform identities.

**Scope:** Release Assets workflow, Electron Builder naming/targets, Desktop manifest and postflight validator.

**Out of scope:** Apple Developer certificate procurement and notarization.

**Acceptance:** workflow contract requires Windows x64, Linux x64, macOS x64 and macOS arm64; missing/duplicate platform asset fails closed; macOS assets include architecture; unsigned pilot state is explicit.

### DLV3-1104 — Pin touched external Actions

**Goal:** no touched V3 workflow executes a floating action tag.

**Acceptance:** full SHA references with version comments; policy test rejects tag refs in touched workflows.

### DLV3-1105 — Publish first cross-platform release

**Goal:** create and publish the next semantic release with all four Desktop platforms.

**Dependencies:** 1101–1104 merged and main CI green.

**Acceptance:** release PR merged; release workflow Published; Desktop manifest and SHA256SUMS contain all platforms; Git tag and release SHA match; server release remains exact-SHA/digest-safe.

## Phase 2 — Main server candidates and canonical staging

**Status: COMPLETE — 2026-09-05.**

Canonical proof:

```text
main SHA:                 60859e470651ad775c936d9224654c1c85602d6b
main CI run:              33943787031 (completed/success after same-SHA failed-job retry)
runtime mirror run:       33943787048
candidate publish run:    33944690658
candidate digest:         sha256:24e4e282e9ab17e7dd7299e4ddd772b434346ed295bee5085307221285201cf7
runtime digest:           sha256:cebe765ab84c7a0ccd7a0ff277c13a74b052c8de0e176d18ac6183a2301bd70a
Web digest:               sha256:9e72de2075ff5a7e40b3004ea64a155abc15354e8ece009f69368d3acf32884c
API digest:               sha256:3c33536cd6c6601f240b21d46fec153ae09410a697d538ec60f50365df1b2050
Migrator digest:          sha256:6654b01552fe4538e4747a8f5adde9012e0955e50b16141ec265676ee0ebc135
PowerSync runtime digest: sha256:58003bcf4897a36bec948a10d2f37753a1188270330d43757caa2aa8dfe2d0b8 (1.25.0)
GCP deploy state:         DEPLOYED
watcher timer:            enabled / active
```

The first cutover attempt exposed a real compatibility defect: the old staging stack had already run PowerSync 1.25.0 while the initial runtime mirror contract pinned 1.20.4. The older service correctly refused the newer migration history (`1784900000000-source-metadata`). Migration history was never deleted or rewritten. PR #308 moved PostgreSQL/Redis/PowerSync mirror authority into the exact-SHA runtime artifact and pinned PowerSync 1.25.0 by linux/amd64 manifest digest. The final deployment, manual replay and first systemd-timer replay all passed.

### DLV3-2201 — Define `memoflow.candidate-set/v1`

**Status:** COMPLETE — PR #306; deterministic self-digest and negative fixtures are covered by CI/CD platform governance.

**Goal:** bind exact main CI, delivery manifest and Web/API/Migrator digests.

**Acceptance:** deterministic self-digest; tamper/mixed-revision/missing-component fixtures fail.

### DLV3-2202 — Publish exact-SHA candidates once

**Status:** COMPLETE — run `33944690658` built Web/API/Migrator for the successful exact main SHA and distributed immutable digests to ACR/GHCR.

**Goal:** successful main CI builds and distributes Web/API/Migrator once to ACR and GHCR.

**Acceptance:** revision label and top-level digest parity; immutable candidate tag; no publication from PR.

### DLV3-2203 — Promote coherent `staging-latest`

**Status:** COMPLETE — the current-main candidate promoted only after the complete candidate set was available.

**Goal:** move all three components only for current main after full candidate completion.

**Acceptance:** stale main candidate skips promotion; partial or mixed set fails closed.

### DLV3-2204 — Install GCP staging watcher

**Status:** COMPLETE — systemd watcher performs migrator-first rollout, exact-digest runtime resolution, health checks and atomic deployment state.

**Goal:** canonical staging consumes only coherent candidate artifacts.

**Acceptance:** migrator-first rollout, API/Web/PowerSync health, exact revision/digests state, replay/idempotency, previous-runtime rollback fixture.

### DLV3-2205 — Prove staging cutover

**Status:** COMPLETE — GCP staging is watcher-owned at `60859e470651ad775c936d9224654c1c85602d6b`; a second watcher execution returned `already deployed` without changing deployment state.

**Acceptance:** staging state equals a successful main SHA and candidate digests; current manual source-build path is documented as emergency-only.

## Phase 3 — Build-once release and production delivery

### DLV3-3301 — Promote Server candidate in Release Publish

**Implementation status:** COMPLETE — real `v0.13.0` attempt proved Server promotion without rebuild; overall release remained Draft because Desktop gate failed.

Release Publish now consumes the exact `candidate-set/v1` and promotes its existing image digests to release tags without rebuilding Web/API/Migrator. Existing release tags must already match the candidate digest or the lane stops before changing tags.

**Goal:** release publication no longer rebuilds Web/API/Migrator.

**Acceptance:** release image digest equals prior main candidate digest in both registries; missing candidate keeps Draft.

### DLV3-3302 — Extend canonical release manifest

**Implementation status:** IMPLEMENTED; first real release acceptance pending.

The v2 Docker and canonical release evidence now carries candidate-set, main CI and delivery-manifest identity, and validates Server component identity against the candidate before final release assembly.

**Goal:** bind candidate-set and Desktop platform manifest in one release identity.

**Acceptance:** server/desktop/tag/SHA/CI mismatch fails closed.

**First real release evidence — 2026-09-05:**

- release commit: `1a70830961da91f734867a582a86039e1ef0be16`;
- main CI `33951148798`: SUCCESS; candidate run `33951762244`: SUCCESS;
- Release Publish `33952117681`: Server `Promote Candidate Images Without Rebuild` succeeded in both attempt 1 and the controlled retry;
- Windows x64 and macOS arm64 reproduced packaged settings-readiness failures in attempt 2; macOS x64 passed the same smoke; attempt 1 Linux remained stuck in the packaged-smoke wrapper beyond the Playwright timeout;
- run attempt 2 was cancelled after deterministic reproduction; `v0.13.0` remains Draft and the immutable `v0.13.0` tag remains bound to the failed release SHA;
- corrective release target was `v0.13.1`; no production selector or Alibaba mutation occurred.

**Second real release evidence — 2026-09-05:**

- #312 merged packaged-runtime staged readiness, bounded Electron/Linux cleanup, and diagnostics; #314 made `autorelease: tagged` mean immutable tag established rather than Published, preventing failed Drafts from deadlocking release-please;
- release commit: `6f3527310d7eb88212ce3180a011087b293a6cd8`; main CI `33957881268`: SUCCESS; candidate run `33958479109`: SUCCESS;
- Release Publish `33958797324`: Draft/tag `v0.13.1` was created at the exact release SHA, Release PR #313 was immediately reconciled to `autorelease: tagged`, and Server `Promote Candidate Images Without Rebuild` succeeded;
- macOS arm64 packaged-runtime diagnostics captured `Desktop renderer failed` caused by the browser notification `ResizeObserver loop completed with undelivered notifications.`; the global `window.error` boundary incorrectly classified that notification as a fatal renderer exception;
- the failed release run was cancelled after root-cause evidence was preserved. `v0.13.1` remains Draft and production remains untouched;
- next corrective release target is `v0.13.2`, which must prove the explicit ResizeObserver classification regression across the packaged Desktop matrix before production selection.

**Third real release evidence — 2026-09-05:**

- #315 merged the exact ResizeObserver classifier fix; release PR #316 then merged `0.13.2` at `08c2daf16e145d228d7d7a20c3282486dca58b0d`; main CI `33962512144` attempt 1 failed only in Corepack/Node 24 bootstrap and attempt 2 completed SUCCESS on the same SHA;
- Candidate Publish `33963165877`: SUCCESS for the exact release SHA; Release Publish `33963523962` created immutable Draft/tag `v0.13.2`, and Server `Promote Candidate Images Without Rebuild` succeeded;
- packaged Desktop runtime smoke passed on Windows x64, macOS x64 and macOS arm64. The arm64 pass directly closes the `v0.13.1` ResizeObserver fatal-boundary defect;
- Linux packaging and runtime-dependency verification succeeded, but the packaged smoke never reached Playwright: the pristine headless runner activated `org.gnome.keyring.SystemPrompter` while creating the first Secret Service collection and then waited indefinitely. The existing `150s` timeout only wrapped the inner Playwright command, not the Xvfb/D-Bus/keyring session;
- the run was cancelled fail-closed after the outer-session defect was proven. `v0.13.2` remains Draft and production is untouched;
- #317 (`bd72d511cd0...` -> merge `085c2f56e13...`) added an outer 210s session bound and a passwordless-keyring bootstrap. Manual retry `33965867292` proved Windows x64, macOS x64 and macOS arm64 again, but Linux still failed before Playwright: its log showed `org.gnome.keyring.SystemPrompter` activation and the workflow-level 5 minute timeout;
- review of that retry exposed the deeper authority defect: `release-assets.yml` checked out current `release-tooling`, but Linux smoke still invoked `release-source/apps/desktop/scripts/run-linux-packaged-smoke-with-keyring.sh`. Therefore an immutable Draft retry could never consume #317's repaired helper. The corrected contract invokes the helper from current `release-tooling` and injects `MEMOFLOW_PACKAGED_SMOKE_WORKSPACE_ROOT` pointing at exact `release-source`, so only orchestration is mutable while application code/tests remain immutable;
- the helper now uses an isolated control directory and the GNOME-documented PAM lifecycle (`gnome-keyring-daemon --login` -> import `GNOME_KEYRING_CONTROL` -> `--start`), with bounded D-Bus and `secret-tool store/lookup/clear` probes. A production-shaped local retry using exact `08c2daf...` source plus the repaired tooling completed Desktop build, Electron native rebuild, 76 runtime package verification and packaged Playwright (`1 passed / 3.9s`, `V0132_PAM_TOOLING_PACKAGED_SMOKE=PASS`);
- PR #318 (`chore(main): release 0.13.3`) was generated automatically and is green, but remains deliberately unmerged. The correct recovery is to merge only the focused tooling-authority/keyring repair and retry the same immutable Draft through `workflow_dispatch(tag=v0.13.2)`.

### DLV3-3303 — Add production Environment and selector

**Implementation status:** IMPLEMENTED; PR CI + first Published-release selection pending.

The repository now defines an explicit manual `Deploy Production(vX.Y.Z)` selector. It accepts only a non-draft/non-prerelease Published Release, resolves the immutable tag SHA, revalidates the source main CI and candidate-set, verifies ACR/GHCR release digests, reads runtime dependency pins from the exact release SHA, and creates `memoflow.production-set/v1`. `controlPlaneSha` is part of the production-set identity so the same release cannot silently be deployed by different control logic under one desired-state digest. The selector builds only the small deployment control artifact and moves one coherent `production-selected` pointer; it never rebuilds application images or SSH-mutates Alibaba.

GitHub Environment `production` exists with a custom `main` branch deployment policy.

**Goal:** `Deploy Production(vX.Y.Z)` selects only a Published, verified release.

**Acceptance:** invalid tag/draft/prerelease/missing manifest/digest collision all fail; workflow does not SSH-mutate runtime.

### DLV3-3304 — Implement Alibaba deploy watcher

**Implementation status:** IMPLEMENTED; Alibaba install/check-only/controlled live rollout pending.

`deployment/production/` now owns a Watchtower-free exact-digest compose, root systemd watcher/installer and `production-deploy-state`. The watcher requires a coherent production control artifact, pulls every exact digest, rejects unplanned PostgreSQL image changes, takes a mandatory PostgreSQL backup before migration, runs Migrator first, then API -> PowerSync -> Web -> Caddy, commits state atomically, restores the previous runtime only before the migration boundary, and records `BLOCKED` after the boundary. Fixture coverage proves coherent check-only, digest drift rejection, pre-migration restore, post-migration BLOCKED, successful state commit and idempotent replay.

**Goal:** runtime owns lock, backup, migrator, health, rollback/block state.

**Acceptance:** production-shaped fixture matrix and a real controlled rollout prove success and failure semantics.

## Phase 4 — Performance and supply-chain hardening

### DLV3-4401 — Shadow consolidated quality execution

Compare split vs consolidated physical runners over comparable PRs. Promote only after enough samples; keep logical receipts.

### DLV3-4402 — Pin every third-party Action

Replace all remaining tag refs with reviewed full SHA. Add repository-wide audit.

### DLV3-4403 — macOS signing/notarization

Add protected secrets/environment, hardened runtime, notarization, stapling and Gatekeeper verification. Signed mode fails closed.

### DLV3-4404 — Close observation and archive

Update timing baselines, infrastructure SSOT, release/deployment runbooks and archive this plan only after staging and production proof.

## 4. Review protocol

Each phase uses:

```text
implementation
→ focused tests
→ repository governance
→ independent review
→ PR required CI
→ exact evidence update
```

No phase may claim staging/release/production completion from repository code alone.
