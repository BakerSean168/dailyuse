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
updated: 2026-09-05T13:05:00+08:00
---

# MemoFlow Delivery Platform V3 Implementation Plan

> Status: ACTIVE — Phase 1 + Phase 2 closed; Phase 3 is the next implementation boundary
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

| Ticket / phase | Current truth                  | Evidence / remaining boundary                                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DLV3-0001      | **COMPLETE**                   | ADR-066, Delivery Platform V3 architecture, Release Lifecycle V3 and runbooks are published.                                                                                                                                                                                                                     |
| DLV3-1101      | **COMPLETE**                   | Desktop-aware scope/risk selection is merged; `main` still forces full verification.                                                                                                                                                                                                                             |
| DLV3-1102      | **COMPLETE**                   | successful-main-CI release-please maintenance and manual recovery paths are live and have been exercised repeatedly by v0.12.x release PRs.                                                                                                                                                                      |
| DLV3-1103      | **COMPLETE**                   | native matrix builds Windows x64, Linux x64, macOS x64 and macOS arm64 with packaged-runtime receipts and fail-closed manifest checks.                                                                                                                                                                           |
| DLV3-1104      | **COMPLETE for Phase 1 scope** | touched release workflows use pinned reviewed Actions; repository-wide convergence remains DLV3-4402.                                                                                                                                                                                                            |
| DLV3-1105      | **COMPLETE**                   | `v0.12.1` was Published on 2026-09-03 with Windows x64, Linux x64, macOS x64 and macOS arm64 assets, `desktop-release-manifest.json`, `release-manifest.json` and `SHA256SUMS.txt`; tag target `257c74eccbe87bba5f63a72217301ab8a17048e6`.                                                                       |
| Phase 2        | **COMPLETE**                   | PRs #306/#307/#308 established candidate-set, exact-SHA dual-registry candidates, coherent `staging-latest`, candidate-bound runtime mirrors and the GCP watcher. Main `60859e47065` and Candidate Publish run `33944690658` are green; GCP state is `DEPLOYED` at the same SHA and the watcher timer is active. |
| Phase 3        | **IN PROGRESS**                | DLV3-3301/3302 implementation promotes exact Phase-2 candidate digests without rebuild and binds candidate-set/main-CI/delivery identity into release evidence; first real release acceptance is still required. DLV3-3303/3304 remain unimplemented.                                                            |
| Phase 4        | **PARTIAL / DEFERRED**         | some Action pinning and delivery observations exist; consolidated-runner evidence, repository-wide Action pinning, macOS signing/notarization and final observation closure remain.                                                                                                                              |

Phase 1 release evidence:

```text
v0.12.1 Published / non-prerelease
Windows x64 Setup + zip
Linux x64 AppImage + deb + rpm
macOS x64 dmg + zip
macOS arm64 dmg + zip
desktop-release-manifest.json + release-manifest.json + SHA256SUMS.txt
```

The next implementation boundary is **Phase 3**: Release Publish must promote the already-built server candidate instead of rebuilding it, then production selection/watch ownership can be added.

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

**Implementation status:** IMPLEMENTED; first real release acceptance pending.

Release Publish now consumes the exact `candidate-set/v1` and promotes its existing image digests to release tags without rebuilding Web/API/Migrator. Existing release tags must already match the candidate digest or the lane stops before changing tags.

**Goal:** release publication no longer rebuilds Web/API/Migrator.

**Acceptance:** release image digest equals prior main candidate digest in both registries; missing candidate keeps Draft.

### DLV3-3302 — Extend canonical release manifest

**Implementation status:** IMPLEMENTED; first real release acceptance pending.

The v2 Docker and canonical release evidence now carries candidate-set, main CI and delivery-manifest identity, and validates Server component identity against the candidate before final release assembly.

**Goal:** bind candidate-set and Desktop platform manifest in one release identity.

**Acceptance:** server/desktop/tag/SHA/CI mismatch fails closed.

### DLV3-3303 — Add production Environment and selector

**Goal:** `Deploy Production(vX.Y.Z)` selects only a Published, verified release.

**Acceptance:** invalid tag/draft/prerelease/missing manifest/digest collision all fail; workflow does not SSH-mutate runtime.

### DLV3-3304 — Implement Alibaba deploy watcher

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
