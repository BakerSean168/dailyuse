---
tags:
  - analysis
  - ci
  - cd
  - release
  - desktop
  - deployment
description: MemoFlow 与 BodySense 交付平台实测对比、差距与 V3 重构决策输入
created: 2026-09-02T16:15:00+08:00
updated: 2026-09-02T16:15:00+08:00
---

# MemoFlow × BodySense Delivery Platform Gap Analysis

## 1. Executive finding

MemoFlow 已具备一套安全性很高的 CI/CD V2：Nx affected、单一 delivery manifest、stable Oracles、immutable build artifacts、Desktop/Server 双发布 lane、ACR/GHCR digest parity、Draft-first exact-SHA release。它的问题不是“没有 CI/CD”，而是三个控制面仍未闭合：

1. **scope 粒度不足**：Desktop/Electron 变更会误触发完整 Web E2E；
2. **main → staging 缺少 artifact channel**：GCP staging 不是最新成功 main 的自动投影；
3. **release / production 仍有重复构建与手工 rollout**：Server artifact 尚未完全做到 main build once → staging → release promote → production select。

BodySense Delivery Platform V3 已在真实 release / staging / production 中验证了 candidate-set、staging channel、build-once/promote-many、release/deploy authority split 和 coherent deploy watcher。MemoFlow 应吸收这些已验证机制，同时保留自己的 Nx、Desktop、PowerSync、双 Registry 和 artifact closure 优势。

目标不是复制 BodySense，而是建立 **MemoFlow Delivery Platform V3**。

## 2. Evidence baseline

### 2.1 Repository and runtime truth

| Surface                          | Current truth at analysis time                             |
| -------------------------------- | ---------------------------------------------------------- |
| MemoFlow main                    | `dc4b9bffc274be74998f5f63b7772e82cb6d4c37`                 |
| Latest release                   | `v0.11.0`                                                  |
| Release manifest version         | `0.11.0`                                                   |
| GCP staging application revision | `670aaea48a06...`                                          |
| Production application revision  | `670aaea48a0644d3bdef792a18367d79b43d02a9`                 |
| Staging model                    | persistent Docker Compose, source/image assembled manually |
| Production model                 | digest-pinned ACR images, manual migrator-first runbook    |

The most important drift is:

```text
main = dc4b9bff...
staging = 670aaea4...
```

Staging is healthy, but it is not a canonical “latest successfully validated main candidate” channel.

### 2.2 Real CI timing

MemoFlow PR #286 (`ca3970a4...`) was predominantly Desktop/Electron capability work, but CI still ran all four Web Flow shards.

| Metric                 | MemoFlow PR #286 |                        Recent BodySense PR |
| ---------------------- | ---------------: | -----------------------------------------: |
| Wall time              |           11m08s |                                      7m08s |
| Sum of runner job time |           43m25s |                                     14m27s |
| Web E2E runner time    |     about 25m43s | one selected longitudinal E2E, about 6m33s |

MemoFlow Web Flow shards:

```text
1/4  6m58s
2/4  6m16s
3/4  6m17s
4/4  6m12s
```

The four shards are useful for Web changes and full main validation. The defect is **selection**, not sharding.

### 2.3 Current MemoFlow strengths

- one versioned delivery manifest per run;
- Nx affected execution with explicit base/head identity;
- stable required Oracles rather than dynamic child names;
- build artifacts bound to manifest digest;
- API runtime dependency closure;
- exact-SHA CI before release publication;
- Draft Release before public publication;
- Windows and Linux Desktop packages plus update metadata;
- ACR and GHCR immutable image distribution with digest parity;
- runtime dependency mirrors pinned by platform digest;
- release lane does not move `prod-latest`;
- production uses digest-pinned application/runtime images and migrator-first ordering.

These contracts must be preserved.

### 2.4 Current BodySense strengths proven after MemoFlow V2

- explicit risk vocabulary for Web/API/AI/contracts/database/runtime/release;
- PR affected execution and exhaustive main override;
- exact-SHA coherent candidate-set produced after successful main CI;
- candidate images built once and promoted to `staging-latest`;
- GCP staging watcher verifies all component revisions before runtime mutation;
- Release Publish promotes candidate digests instead of rebuilding source;
- explicit Deploy Production selects a Published Release;
- production watcher owns backup, migration, health and rollback/block state;
- external GitHub Actions are pinned by full commit SHA;
- deployment authority is separated from artifact publication authority.

## 3. Root-cause gaps

### GAP-1 — Desktop is absent from the delivery vocabulary

**Observed:** current risk levels are `docs`, `package`, `runtime`, `web-flow`, `root`, `release`; current lanes do not include Desktop.

**Effect:** `apps/desktop/**` and Electron-specific repository changes can select `lane_web`, causing four browser shards that do not validate the changed runtime boundary.

**Desired:** Desktop/Electron changes select Desktop quality and packaging smoke; Web experience only runs when Web/browser/shared presentation contracts actually change.

### GAP-2 — Logical lanes are split into many physical setup jobs

**Observed:** Static Analysis, Unit, Typecheck and Build each repeat checkout, toolchain setup, pnpm install and Nx startup.

**Effect:** wall time benefits from parallelism, but runner-minutes and setup overhead are high.

**Desired:** retain separate logical evidence while testing a consolidated physical “Affected Quality Child” in shadow mode. Promote only if P50/P95 wall time, runner-minutes and flake rate improve.

### GAP-3 — Main does not create a canonical server candidate

**Observed:** successful main CI creates build artifacts, but no durable cross-registry candidate-set and no staging channel promotion.

**Effect:** staging remains an independently assembled runtime and cannot be used as artifact-level release evidence.

**Desired:** one successful full main CI creates Web/API/Migrator exact-SHA images in ACR+GHCR, proves digest parity, emits `memoflow.candidate-set/v1`, then promotes the coherent set to `staging-latest`.

### GAP-4 — Staging has no fail-closed channel watcher

**Observed:** staging is persistent but manually updated; current image tags embed an old source revision.

**Effect:** “staging is healthy” does not prove what main/release artifact it represents.

**Desired:** a GCP user systemd watcher pulls `staging-latest`, rejects mixed revisions/digests, extracts versioned runtime files, executes migrator-first rollout, checks API/Web/PowerSync, and atomically records staging state.

### GAP-5 — Server release publication still rebuilds

**Observed:** release `publish-images.yml` restores verified CI build output, but builds OCI images during release publication.

**Effect:** staging has not validated the exact released image digest; source equality is stronger than arbitrary rebuild, but weaker than artifact identity equality.

**Desired:** Release Publish promotes the exact already-qualified candidate digests to immutable `vX.Y.Z` identities. No server source rebuild after candidate publication.

### GAP-6 — Production selection is outside the repository control plane

**Observed:** the repository documents a safe manual SSH runbook but has no `production` Environment or `Deploy Production` selector workflow.

**Effect:** desired release, verified manifest, operator action and runtime result are not one durable GitHub deployment record.

**Desired:** explicit `Deploy Production(vX.Y.Z)` verifies Published Release/tag/manifest/CI/digests, promotes a coherent production channel, and leaves runtime mutation to an Alibaba watcher.

### GAP-7 — Cross-platform Desktop release is incomplete

**Observed:** Electron Builder defines macOS, but `release-assets.yml` only builds Windows x64 and Linux x64. `v0.11.0` contains no macOS artifact.

**Desired:** Windows x64, Linux x64, macOS Intel x64 and macOS Apple Silicon arm64 are all represented in the Desktop release manifest. Unsigned macOS artifacts are explicitly labeled during the pilot; signed/notarized publication is a separate credential gate.

### GAP-8 — Release PR preparation is manual-only

**Observed:** release-please runs only by `workflow_dispatch`; after PR #286 merged, no Release PR appeared.

**Reason:** V2 intentionally removed per-main-push history scanning after a long-history GitHub API timeout incident.

**Desired:** trigger Prepare Release from successful exact-SHA main CI, not directly from raw push. Keep manual dispatch for retry. Release Please continues to prepare only; it never publishes.

### GAP-9 — Action supply-chain references are inconsistent

**Observed:** MemoFlow workflows contain about 73 tag-based external action references and only a handful of full SHA pins; BodySense has converged external Actions to full SHA pins.

**Desired:** all third-party Actions use reviewed full commit SHA with a version comment; automated audits fail on tag refs.

## 4. Recommended architecture

```text
short-lived branch
       ↓
PR Delivery Manifest V2
       ├── Governance
       ├── Affected Quality
       ├── Database
       ├── Desktop
       └── Web Experience only when selected
       ↓
stable Oracles
       ↓
main
       ↓
full exact-SHA CI
       ↓
Server Candidate Publish
       ├── Web image
       ├── API image
       ├── Migrator image
       ├── ACR/GHCR digest parity
       └── candidate-set-v1.json
       ↓
staging-latest coherent channel
       ↓
GCP staging watcher
       ↓
canonical staging exact SHA/digests

successful main CI
       ↓
Prepare Release maintains Release PR
       ↓
Release PR merge + exact-SHA main CI
       ↓
Release Publish
       ├── promote server candidate digests
       ├── build Windows/Linux/macOS Desktop assets
       ├── canonical release-manifest.json
       └── Draft → Published
       ↓
explicit Deploy Production
       ↓
coherent production channel
       ↓
Alibaba watcher
       └── backup → migrator → API/Web → PowerSync/health → commit/rollback/block
```

## 5. Decision summary

Adopt Delivery Platform V3 in phases. Preserve required Oracle names and current production runtime until shadow and staging evidence are complete. The first implementation slice includes:

1. Desktop-aware scope selection;
2. successful-main-CI-driven Release PR maintenance;
3. Windows/Linux/macOS x64+arm64 release matrix and manifest validation;
4. architecture/plan/runbook documentation;
5. full-SHA action pin policy for touched workflows.

Candidate/staging and production selection follow as independently reviewable phases and must not be hidden inside the cross-platform release change.
