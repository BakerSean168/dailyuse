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
updated: undefined
---

# MemoFlow Delivery Platform V3 Implementation Plan

> Status: ACTIVE — Phase 1 + Phase 2 closed; Phase 3 release + selector accepted; v0.13.3 corrective server release Published and selected; Alibaba remains on the recovered old exact runtime while BLOCKED-force rollback-baseline hardening is merged and re-selected
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

| Ticket / phase | Current truth                                   | Evidence / remaining boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DLV3-0001      | **COMPLETE**                                    | ADR-066, Delivery Platform V3 architecture, Release Lifecycle V3 and runbooks are published.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DLV3-1101      | **COMPLETE**                                    | Desktop-aware scope/risk selection is merged; `main` still forces full verification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DLV3-1102      | **COMPLETE**                                    | successful-main-CI release-please maintenance and manual recovery paths are live and have been exercised repeatedly by v0.12.x release PRs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| DLV3-1103      | **COMPLETE**                                    | native matrix builds Windows x64, Linux x64, macOS x64 and macOS arm64 with packaged-runtime receipts and fail-closed manifest checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| DLV3-1104      | **COMPLETE for Phase 1 scope**                  | touched release workflows use pinned reviewed Actions; repository-wide convergence remains DLV3-4402.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| DLV3-1105      | **COMPLETE**                                    | `v0.12.1` was Published on 2026-09-03 with Windows x64, Linux x64, macOS x64 and macOS arm64 assets, `desktop-release-manifest.json`, `release-manifest.json` and `SHA256SUMS.txt`; tag target `257c74eccbe87bba5f63a72217301ab8a17048e6`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Phase 2        | **COMPLETE**                                    | PRs #306/#307/#308 established candidate-set, exact-SHA dual-registry candidates, coherent `staging-latest`, candidate-bound runtime mirrors and the GCP watcher. Main `60859e47065` and Candidate Publish run `33944690658` are green; GCP state is `DEPLOYED` at the same SHA and the watcher timer is active.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Phase 3        | **IN PROGRESS / PRODUCTION RECOVERY HARDENING** | #310 + #311 + #319 + #320 established build-once Release, production selector/watcher, Linux release-tooling authority and the offline Prisma engine closure. Release Publish `33975023167` Published immutable `v0.13.3` at `4e24cffd64b2255a188d28dbe37308a1e2a3fe3a` with all four Desktop packaged-runtime lanes and Server promote/postflight green. Its Migrator candidate digest `sha256:e734a0eb...17ad3` passes `--network none prisma -v` on Alibaba, and PR #320 also proved a complete internal-only pgvector/PostgreSQL Migrator run. Selector `33976296012` selected production-set `sha256:b48f087f...4a97b`. The old exact runtime still serves API/Web/PowerSync 200 while the retained v0.13.2 state remains `BLOCKED` and timer disabled. Before explicit `--force`, watcher recovery is being hardened so the preserved `runtime.prev` must exactly match current live container refs; Alibaba currently matches all six services. Merge that control-plane-only repair, re-select the same Published v0.13.3 under the new `controlPlaneSha`, then run check-only -> forced transaction -> exact state -> replay -> timer enable. |
| Phase 4        | **PARTIAL / DEFERRED**                          | some Action pinning and delivery observations exist; consolidated-runner evidence, repository-wide Action pinning, macOS signing/notarization and final observation closure remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Phase 1 release evidence:

```text
v0.12.1 Published / non-prerelease
Windows x64 Setup + zip
Linux x64 AppImage + deb + rpm
macOS x64 dmg + zip
macOS arm64 dmg + zip
desktop-release-manifest.json + release-manifest.json + SHA256SUMS.txt
```

The next boundary is **Phase 3 explicit BLOCKED recovery acceptance**. `v0.13.3` is now Published and immutable at `4e24cffd64b2255a188d28dbe37308a1e2a3fe3a`; Release Publish `33975023167` proved all four Desktop packaged runtime gates, exact Server promotion and canonical postflight. The corrective Migrator digest `sha256:e734a0ebaa82479413ef2e8bd7641ae781ddb09577a9be36f6f9ac4d7d517ad3` contains the local Prisma 7.8.0 Schema Engine and passes `--network none prisma -v` on the Alibaba host. `Deploy Production` run `33976296012` selected production-set `sha256:b48f087f58f9db6c8deae83639fb6760cd2a57af3720208ff8f0e9c80434a97b` with control artifact `sha256:7a75b85e8425b17cbbbf60a09c1bf83e8c51bcbdf4d5c8ee6f947aca953043db`. Production is intentionally still serving the operator-restored old exact runtime because the retained v0.13.2 `BLOCKED` receipt and failed target root must not be mistaken for the rollback baseline. The recovery watcher is being hardened so `BLOCKED + --force` requires preserved `runtime.prev` exact refs to match all current live containers before rotation; Alibaba currently passes that six-service comparison. After this control-plane-only change merges, re-run the selector for the same Published v0.13.3 so the new `controlPlaneSha` is bound into a fresh production-set, then run `--check-only`, explicit `--force` with a new mandatory PostgreSQL backup, exact-digest state commit, idempotent replay, and only then enable the timer.

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

**Implementation status:** COMPLETE — `v0.13.2` Published with schema-v2 canonical release evidence bound to the exact candidate/main CI.

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

**Fourth real release + first production transaction evidence — 2026-09-05:**

- #319 merged the current-control-plane Linux helper authority and PAM-style Secret Service lifecycle into main `75aa2b7cded8a1ab8ce616a8656999ba6be1c502`; the same SHA passed full main CI;
- Release Publish `33969280951` resumed immutable `v0.13.2 -> 08c2daf16e145d228d7d7a20c3282486dca58b0d`. All four Desktop lanes passed. Linux logs prove the helper came from `release-tooling`, the workspace/test stayed in exact `release-source`, `SystemPrompter` appeared 0 times, packaged smoke passed in 4.0s and installed-package smoke passed in 3.1s. Server candidate promotion and final postflight succeeded; `v0.13.2` was Published with 23 manifest-owned assets;
- Deploy Production `33970245766` validated the Published Release/candidate/main-CI closure and selected `memoflow.production-set/v1` digest `sha256:69cc759672c01711c7cd69bd9ee1648434a0336a5d8aded7411287670080529b` under control-plane `75aa2...`;
- Alibaba install left the watcher timer disabled. A transient `--check-only` completed `PRODUCTION_SELECTION=COHERENT`. The controlled rollout then produced the required non-empty PostgreSQL backup before Migrator, but `prisma db push` failed with `TLSSocket ECONNRESET`; the watcher correctly persisted `status=BLOCKED` for the exact release/set instead of rolling back after the migration boundary;
- image audit found `prisma/build/index.js` but no `@prisma/engines/schema-engine-*` in both the new and previous Migrator runtime closures. `pnpm deploy --prod --ignore-scripts` preserves the Prisma JS packages while omitting the engine materialized by `@prisma/engines` postinstall. The previous exact API/Web/PowerSync/Caddy runtime was operator-restored after reviewing pre-`db push` mutations; GCP external probes for API/Web/PowerSync are all HTTP 200, the `BLOCKED` receipt is retained, and the timer is still disabled;
- the corrective image design keeps global pnpm build-script policy unchanged, explicitly materializes the locked Prisma 7.8.0 engine during Docker build, verifies it again in the final Migrator stage, and has passed a real final-image `--network none prisma -v` plus a complete Migrator run against an internal-only pgvector/PostgreSQL network. Because the Migrator digest changes, the next production attempt must come from a new immutable release (`v0.13.3`), not by mutating Published `v0.13.2`.

**Fifth real release + BLOCKED recovery hardening evidence — 2026-09-05:**

- PR #320 merged the Prisma engine-closure repair. Full PR CI and merged-main CI passed; final-image `--network none prisma -v` resolves the bundled `schema-engine-debian-openssl-3.0.x`, and an internal-only pgvector/PostgreSQL Migrator run completed with `Database initialization completed`;
- Release Publish `33975023167` Published `v0.13.3 -> 4e24cffd64b2255a188d28dbe37308a1e2a3fe3a` with 23 manifest-owned assets, all four Desktop packaged-runtime lanes and Server promote/postflight green. Candidate Migrator digest is `sha256:e734a0ebaa82479413ef2e8bd7641ae781ddb09577a9be36f6f9ac4d7d517ad3`; Alibaba independently passes `--network none prisma -v` for that exact digest;
- Deploy Production `33976296012` selected `v0.13.3` as production-set `sha256:b48f087f58f9db6c8deae83639fb6760cd2a57af3720208ff8f0e9c80434a97b`. No new host mutation has been attempted yet; the old exact runtime remains healthy, the v0.13.2 `BLOCKED` state remains retained, and the timer remains disabled;
- recovery review found that disk `runtime` still contains the failed v0.13.2 target while live containers were operator-restored from preserved `runtime.prev`. Direct `--force` would rotate the failed target as `prev`, so the watcher must first prove preserved `runtime.prev` exact refs match live API/Web/PowerSync/Postgres/Redis/Caddy. All six refs match on Alibaba. New fixtures prove a matching baseline is restored on pre-migration failure and a mismatched baseline is rejected before Migrator.

### DLV3-3303 — Add production Environment and selector

**Implementation status:** COMPLETE — selector runs `33970245766` (v0.13.2) and `33976296012` (Published v0.13.3) both produced one coherent production-set/control artifact.

The repository now defines an explicit manual `Deploy Production(vX.Y.Z)` selector. It accepts only a non-draft/non-prerelease Published Release, resolves the immutable tag SHA, revalidates the source main CI and candidate-set, verifies ACR/GHCR release digests, reads runtime dependency pins from the exact release SHA, and creates `memoflow.production-set/v1`. `controlPlaneSha` is part of the production-set identity so the same release cannot silently be deployed by different control logic under one desired-state digest. The selector builds only the small deployment control artifact and moves one coherent `production-selected` pointer; it never rebuilds application images or SSH-mutates Alibaba.

GitHub Environment `production` exists with a custom `main` branch deployment policy.

**Goal:** `Deploy Production(vX.Y.Z)` selects only a Published, verified release.

**Acceptance:** invalid tag/draft/prerelease/missing manifest/digest collision all fail; workflow does not SSH-mutate runtime.

### DLV3-3304 — Implement Alibaba deploy watcher

**Implementation status:** IN PROGRESS / REAL FAILURE + RECOVERY SEMANTICS PROVEN — install + coherent check-only + mandatory backup + post-migration `BLOCKED` were exercised on Alibaba; current hardening makes explicit `--force` recovery require a preserved rollback root that exactly matches live production before rotation. Successful v0.13.3 rollout/replay/timer enable remain.

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
