---
tags:
  - runbook
  - ci
  - cd
  - release
  - deployment
description: MemoFlow Delivery Platform V3 渐进切换、验证、回滚与事故处置手册
created: 2026-09-02T16:15:00+08:00
updated: 2026-09-02T16:15:00+08:00
---

# Delivery Platform V3 Rollout Runbook

## 1. Safety rule

V3 is introduced beside V2. Do not delete a V2 authority until the corresponding V3 transition has real evidence.

```text
code present != workflow proven
workflow green != artifact promoted
artifact promoted != staging deployed
release Published != production selected
production selected != runtime healthy
```

## 2. Phase 1 rollout

### Preflight

- branch starts from current `origin/main`;
- canonical main worktree remains clean;
- no Release PR or release workflow is manually edited during migration;
- required check names are unchanged;
- release signing policy is recorded.

### CI scope validation

Run historical fixtures:

```text
Desktop/Electron-only  → desktop=true, web=false
Web-only               → web=true
shared UI/contract     → desktop=true, web=true when required
migration              → database/integration
CI/Docker/release      → full
main push              → full
```

Inspect the PR delivery manifest artifact before merging.

### Cross-platform release dry contract

Before publication:

- workflow YAML and matrix tests pass;
- macOS artifacts use architecture-specific names;
- Desktop manifest validation fails when one platform directory is absent;
- unsigned pilot state is visible;
- Draft release upload remains centralized.

## 3. First cross-platform release

1. Merge V3 Phase 1 PR after all current required checks pass.
2. Confirm exact main CI success.
3. Confirm Prepare Release creates/updates the next Release PR.
4. Review version and CHANGELOG; merge Release PR.
5. Observe exact release merge SHA CI.
6. Observe `Publish Main Candidate` complete successfully for that exact SHA and retain `candidate-set-<SHA>`.
7. Observe Release Publish start only after candidate publication, then create/resume the Draft Release.
8. Verify platform child jobs:
   - Windows x64;
   - Linux x64;
   - macOS x64;
   - macOS arm64.
9. Verify `candidate-set-v1.json`, `docker-release-manifest.json`, `desktop-release-manifest.json` and `SHA256SUMS.txt` before publication.
10. Confirm release Web/API/Migrator tags preserve the exact candidate digests in both ACR and GHCR.
11. Confirm Published Release/tag SHA identity and asset coverage.
12. Do not deploy production solely because the Release is Published.

### Failure handling

- platform build failure: leave Draft; fix code/workflow in a new PR; retry the same Draft only if release SHA remains valid;
- duplicate/missing asset: do not manually upload around validator;
- Git tag collision: stop; immutable tag must never move;
- Server release-tag digest collision: stop before promotion; never overwrite a tag that points to a different candidate digest;
- missing/expired candidate-set or candidate/main-CI mismatch: do not rebuild Server images; keep/resume the Draft only after the exact candidate evidence is restored;
- unsigned macOS policy mismatch: stop rather than dropping the platform silently.

## 4. Candidate/staging cutover

### Shadow

Candidate Publish first builds immutable SHA images and manifest without moving `staging-latest`.

Acceptance:

- CI source SHA is exact successful main;
- ACR/GHCR digests match;
- candidate manifest validates;
- repeated execution reuses or confirms the same immutable identity.

### Channel enablement

`Publish Main Candidate` is triggered only by a successful `CI` push run on `main` (manual dispatch is recovery-only and revalidates the exact successful CI run). It publishes immutable candidates first, rechecks current `main` immediately before mutation, and only then moves the coherent ACR/GHCR `staging-latest` channel. A stale but valid candidate remains available by `sha-<full SHA>` and skips channel promotion.

### Watcher installation

Install GCP user service/timer from `deployment/staging/` with:

- `deployment/staging/install-staging-deploy-watch.sh`;
- host-owned non-secret `~/.config/memoflow/staging-channel.env`;
- external `~/.config/memoflow/staging.env` secret file;
- dedicated state/runtime directories;
- host-owned Docker credentials for the configured distribution (`global`/GHCR on GCP staging);
- lock and bounded health timeouts;
- `~/.local/bin/memoflow-staging-deploy-watch --check-only` before timer enablement.

The runtime OCI artifact embeds the exact candidate manifest, reviewed `runtime-image-mirrors.json`, and versioned Compose/PowerSync/watcher files. The watcher deploys `repository@sha256:...` refs rather than mutable channel tags. PostgreSQL, Redis and PowerSync runtime dependencies are resolved from that candidate-bound mirror contract, not from host image pins.

**PowerSync migration compatibility:** never downgrade a staging/production database to a PowerSync image older than the migration history already recorded in its storage. The 2026-09-05 GCP cutover proved this fail-closed behavior when a stale 1.20.4 mirror encountered migration `1784900000000-source-metadata` written by 1.25.0. Do not delete migration history to bypass this guard; advance the reviewed runtime mirror instead.

### Staging acceptance

Record:

```text
main SHA
candidate manifest digest
Web/API/Migrator digests
migration result
API/Web/PowerSync health
public/private ingress result
deploy-state content
```

Pre-migration failure restores the previous exact runtime automatically. Once Migrator succeeds, an uncertain rollout records `BLOCKED` rather than performing a blind schema rollback. Never rebuild locally under an existing candidate identity. The historical source-build staging stack is emergency/diagnostic only and is not release evidence after cutover.

## 5. Production cutover

1. Create `production` GitHub Environment and branch policy.
2. Deploy selector in dry/verification mode.
3. Install Alibaba watcher but leave automatic timer disabled.
4. Run preflight against current Published Release without channel mutation.
5. Enable selector promotion.
6. Run watcher check-only.
7. Schedule controlled rollout with backup evidence.
8. Verify migration head, containers, image digests, public health and GitHub App/PowerSync flows.
9. Enable regular watcher only after the first successful controlled transaction.

## 6. Rollback / block policy

| Failure point                                     | Action                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| before candidate promotion                        | no runtime impact                                  |
| staging pre-migration                             | keep current staging                               |
| staging post-migration                            | restore only when schema compatibility is proven   |
| release pre-publish                               | keep Draft                                         |
| production pre-migration                          | restore previous selected release                  |
| production post-migration, compatible             | restore previous app set and verify                |
| production post-migration, uncertain/incompatible | mark BLOCKED; preserve evidence; operator decision |

## 7. Evidence closeout

A phase is complete only when repository tests, GitHub workflow run, artifact identities and runtime state all agree. Update the active plan and infrastructure SSOT with exact IDs; then archive superseded V2 operational text.
