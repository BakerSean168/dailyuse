---
tags:
  - analysis
  - plan
  - active
  - audit
description: 2026-09-04 MemoFlow Active Plan 真值审计与剩余实施优先级
created: 2026-09-04T23:25:00+08:00
updated: 2026-09-06T10:16:00+08:00
---

# MemoFlow Active Plan Truth Audit — 2026-09-04

## 1. Executive result

AI Provider Onboarding V2 已完成并归档后，`docs/plan/active/` 只剩三份真实 Active Plan。没有第二份“完整设计后完全忘记实施”的计划，但两份存在显著 residual，一份只差实机验收。

| Plan                               | Current truth                                           | What is actually left                                                                                                 |
| ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Delivery Platform V3               | **Phase 3 COMPLETE in live production**                 | Phase 4 runner consolidation, macOS signing/notarization and final observation/archive                                |
| Core vNext umbrella                | **v0.11 Waves 0–5 primary scope closed; residual-only** | Routine method library, AI/Mobile parity, legacy ScheduleTask/SourceModule cleanup, pg-boss decision, final hardening |
| GitHub Durable Installation Intent | **implementation complete**                             | one Published Windows Desktop live external-browser + polling/finalize acceptance                                     |

## 2. Delivery Platform V3 — still required

### Completed

- Desktop-aware PR scope and full-main override;
- automatic Release PR maintenance;
- Windows x64 / Linux x64 / macOS x64 / macOS arm64 package lanes;
- packaged runtime receipts/manifests and fail-closed Draft-first release flow;
- `v0.12.1` Published with all four Desktop platform identities plus canonical release evidence.

### Phase 2 completed — 2026-09-05

- `DLV3-2201`: `memoflow.candidate-set/v1` deterministic self-digest and negative fixtures;
- `DLV3-2202`: successful main CI publishes Web/API/Migrator exact-SHA candidates once to ACR + GHCR;
- `DLV3-2203`: coherent `staging-latest` promotion is current-main/freshness gated;
- `DLV3-2204`: GCP watcher owns migrator-first exact-digest rollout, rollback/BLOCKED semantics and idempotent timer execution;
- `DLV3-2205`: canonical staging cut over to candidate `60859e470651ad775c936d9224654c1c85602d6b`; source-build staging is emergency-only.

### Phase 3 completed in live production — 2026-09-06

1. `DLV3-3301/3302`: merged in PR #310. Release Publish promotes the existing exact candidate digests without rebuilding Server images, and schema-v2 release evidence binds candidate-set/main-CI/delivery identity.
2. `DLV3-3303`: `Deploy Production(vX.Y.Z)` plus `memoflow.production-set/v1` is implemented. The selector is manual, Published-release-only, main-control-plane-bound, verifies ACR/GHCR parity and moves one `production-selected` control artifact; GitHub Environment `production` exists with a `main` branch policy.
3. `DLV3-3304`: `deployment/production/` is implemented with exact-digest Watchtower-free compose, mandatory database backup, migrator-first rollout, pre-migration restore, post-migration `BLOCKED`, PowerSync downgrade guard and idempotent state/replay fixtures.
4. #319 closed the Linux helper-authority/Secret Service defect and Published v0.13.2; its first Alibaba transaction then failed closed at Prisma engine acquisition and retained `BLOCKED` while the old exact runtime was operator-restored.
5. #320 bundled and verified the locked Prisma 7.8.0 Schema Engine in the Migrator image. `v0.13.3 -> 4e24cffd64b2255a188d28dbe37308a1e2a3fe3a` is Published via Release Publish `33975023167`; all four Desktop lanes, exact Server promotion and postflight passed. The exact Migrator digest `sha256:e734a0eb...17ad3` passes offline Prisma resolution on Alibaba. Selector `33976296012` selected production-set `sha256:b48f087f...4a97b`.
6. #321 merged the BLOCKED live-baseline guard as control-plane `3adafc21...`; full main CI passed. Selector `33978120212` re-selected the same Published v0.13.3 as set `sha256:50163b7b...ba1bb` / control artifact `sha256:65a0c04a...a2a22`. The exact bundle installed on Alibaba with timer still disabled; check-only is coherent, the retained v0.13.2 BLOCKED receipt remains, and `runtime.prev` still matches all six current live service refs. A final pre-force probe found Alibaba cannot reliably hairpin/resolve its own public production domains, while all three canonical HTTPS Host/SNI routes pass through local Caddy with `--resolve ...:127.0.0.1`. The next control-plane repair must make that local Caddy path the transaction probe; public Internet reachability stays an independent GCP acceptance check. Then re-select the same v0.13.3 again and complete force -> new backup -> exact state -> replay -> public probe -> timer enable.
7. #323 merged local-Caddy transaction probing as `64521cf...`; main CI `33979229785` passed. Final selector `34005198389` re-selected immutable v0.13.3 as set `sha256:2ea3a112...ae0ae` / control artifact `sha256:4d9b493f...175fa`. Alibaba verified and installed that bundle, check-only was coherent, rollback baseline remained 6/6, and guarded `--force` produced a new backup before Migrator. The bundled Prisma engine completed `db push` and the remaining migration checks; API/PowerSync/Web/Caddy converged, local Caddy probes passed, and atomic state became `DEPLOYED` at `2026-09-06T02:02:12Z`. Replay and the canonical service returned `already deployed` with unchanged state/backup count and no Migrator rerun. Independent GCP probes passed 9/9 after one retained transient Web timeout. The timer is enabled/active and its first Persistent catch-up run also used the idempotent fast path.

### Later / conditional

- DLV3-4401 runner-consolidation performance experiment;
- DLV3-4402 repository-wide Action SHA pinning — **COMPLETE**: all workflow/composite-action third-party refs are immutable 40-hex SHAs with version comments and a global fail-closed governance audit;
- DLV3-4403 macOS signing/notarization (only necessary before trusted public macOS distribution);
- DLV3-4404 observation closeout/archive.

**Recommendation:** Phase 3 is closed; do not create a corrective release for the resolved incident chain. Preserve the accepted v0.13.3 production authority and move to Phase 4. DLV3-4402 is closed. DLV3-4401 should gather comparable runner samples without weakening logical receipts; DLV3-4403 remains the public-macOS trust/signing gate; DLV3-4404 may archive only after those observation/hardening decisions are closed.

## 3. Core vNext — classify before implementing

### Already implemented; do not redo

Goal/Task/Routine business semantics, EventBus, recurrence, scheduling identity/reconcile, Notification durable pipeline/policy, FullCalendar Planner, owner-aware edits, Web/Desktop primary vNext surfaces, Intervention/Focus windows and v0.11 primary acceptance are already implemented and verified.

### Still product-relevant

- `ROUTINE-5302`: Routine method library/catalog — **absent in production source**. This is a real user-facing enhancement rather than a correctness blocker; implement it if Routine presets (`Stand & Move`, `20-20-20`, `50/10`, Pomodoro, etc.) remain part of the product roadmap.
- `AI-6101`: **partially implemented but still needs correction**. Current Mastra Goal/Task workflows already support KR Measurement V2, recurrence, Goal/KR binding and contribution, but `TaskPlanTaskSchema` still exposes retired `folderId`; finish the schema cleanup and verify label semantics against the current Task contract.
- `AI-6102/6103`: **not implemented**. No Routine command/draft tools or Planner/Notification AI read tools were found. Implement only if MemoFlow's assistant is intended to operate Routine and summarize Planner/Notifications; otherwise explicitly close these as product-scope decisions instead of leaving them indefinitely active.
- `MOBILE-6201`: **likely implemented, needs parity acceptance rather than rebuild**. Current React/mobile Goal/Task screens use current public contracts and no Folder/Dependency/ValueType product UI was found.
- `MOBILE-6202`: **substantially implemented, needs parity/capability acceptance**. Current mobile Notification list/detail use `NotificationClientPort`/`NotificationClientDTO`, and mobile Settings uses current notification preferences. Verify the desktop-only Routine capability-state boundary before closing the ticket.

### Still real technical debt

- `CLEAN-6301`: **partially complete**. GoalFolder/TaskDependencyGraph/TaskFolder product UI is gone, but residual branded IDs/test mocks and standalone Goal `ProgressBreakdown` API/client/component surfaces remain. Reconfirm whether ProgressBreakdown is still a desired product read model; delete only the dead/publicly exposed residuals.
- `CLEAN-6302`: **clearly incomplete**. `ControlMode`, Reminder group-control APIs, `smartFrequencyEnabled`, overloaded `responseTime` snooze semantics and Reminder naming remain widely present. This is one of the largest remaining Core semantic-cleanup tasks.
- `CLEAN-6303`: **clearly incomplete**. Raw ScheduleTask HTTP/IPC/client surfaces remain, Reminder projection still calls `ScheduleTask.create(...)`, and schedule orchestration retains a `SourceModule` fallback router.
- `CLEAN-6304`: physical scheduler package split decision should wait until `CLEAN-6302/6303` remove the semantic ambiguity.
- `HARD-7101~7105`: final failure matrix, residual governance locks, full acceptance, documentation truth closure and final review remain meaningful only after product residuals/cleanup are resolved.

### Decision ticket, not required feature

- `POC-6401` pg-boss: current repository explicitly says “Keep now; later PoC”; pg-boss is not installed. Run the PoC only **after** business packages stop depending on legacy ScheduleTask seams. Evidence may legitimately conclude “keep current scheduler”.

## 4. GitHub Installation Intent — verification, not implementation

All durable intent, setup gateway, status/finalize, environment routing and Web production acceptance code exists. The only unchecked DoD is a Published Windows Desktop package live journey:

```text
Desktop
→ external browser
→ GitHub App installation
→ API polling observes callback
→ authenticated finalize
→ repository inventory/connect
```

`v0.12.1` is Published and includes `MemoFlow-Windows-0.12.1-Setup.exe` and Setup zip, so the acceptance can now be executed. Do not write more orchestration code before attempting the live journey; only fix code if the live test finds a defect.

## 5. Recommended priority

### Must close / verify now

1. **GitHub Desktop live acceptance** — no new feature work expected; smallest scope and closes an entire Active Plan.
2. **AI-6101 contract cleanup** — remove the retired `folderId` from Task AI draft semantics and verify current labels/contribution mapping. This is a concrete contract inconsistency, not an optional feature.

### Should implement for architecture completion

3. **Delivery Platform V3 Phase 2 — COMPLETE (2026-09-05).** Candidate-set → exact-SHA images → coherent staging channel → GCP watcher is live.
4. **Core `CLEAN-6302/6303`** — remove Reminder legacy semantics and raw ScheduleTask/SourceModule product/execution paths. This reduces dual-authority/maintenance risk and is a prerequisite for a meaningful scheduler-engine comparison.
5. **Delivery Platform V3 Phase 4 hardening** — Phase 3 is complete in live production at v0.13.3 and DLV3-4402 Action SHA pinning is complete. Continue runner-consolidation observation, macOS signing/notarization decision/implementation and final observation/archive without reopening the closed production transaction.

### Audit/product decision before coding

6. **MOBILE-6201/6202** — likely mostly complete; run a focused parity/capability audit and close or implement only concrete gaps.
7. **ROUTINE-5302** — useful preset/method-library feature, but not a correctness blocker. Implement only if still desired by current Routine UX roadmap.
8. **AI-6102/6103** — real missing capabilities, but product-scope dependent. Decide whether the MemoFlow assistant should mutate Routine and read Planner/Notifications before implementing.
9. **CLEAN-6301** — most headline legacy UI is already gone; audit `ProgressBreakdown` and residual branded/test/public surfaces before deletion.

### Decision / final closure

10. **POC-6401 pg-boss** — not mandatory. Run only after `CLEAN-6302/6303`; a valid result is “keep current scheduler”.
11. **HARD-7101~7105** — final failure matrix/governance/product acceptance/docs/archive after all chosen residual product work is settled.
12. **Delivery Phase 4** — performance/supply-chain observation after Phase 2/3; macOS signing/notarization is conditional on trusted public macOS distribution.

## 6. Anti-drift rule

Future agents must not use checkbox count alone as implementation truth. For any Active Plan older than one release cycle:

1. inspect current code symbols and recent commits;
2. separate implementation from live acceptance;
3. mark completed historical work before scheduling residuals;
4. turn stale umbrella tickets into an explicit residual ledger;
5. archive plans once only validation remains and that validation passes.
