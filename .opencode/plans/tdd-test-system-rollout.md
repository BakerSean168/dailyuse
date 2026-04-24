# Plan: TDD Test System Rollout

## Goal

Build a fast-feedback, Nx-first testing system for the monorepo so day-to-day work follows a clear TDD path:

1. Write a failing fast test.
2. Make the smallest change to pass it.
3. Escalate only when the changed boundary requires slower suites.

## Scope Clarification (This Revision)

This revision updates the rollout status after code review of the implementation already landed in the repo.
It records what is actually complete, what is only partially complete, and what must be fixed before this rollout can be considered finished.

## Core Constraints

- All test entry points go through `pnpm nx ...`.
- `test` / `test:watch` stay fast and must not require real DB, browser, or cross-process setup.
- Vitest owns unit, integration, smoke, contract, IPC, main-process, and bench suites.
- Playwright owns browser E2E and sync-regression flows.
- CI gates fast suites with `affected`, then selectively runs slow suites by change boundary.

## Current State (As-Is Audit)

### Project target map

| Project | Fast default | Slow / boundary | Browser / flow |
| --- | --- | --- | --- |
| `task` | `test`, `test:watch` | `test:integration`, `test:bench` | - |
| `api` | `test`, `test:watch` | `test:smoke` | - |
| `web` | `test`, `test:watch` | (contract tests are inside `web:test`) | `e2e`, `e2e:sync`, `e2e:ui`, `e2e:desktop-screenshots` |
| `desktop` | `test`, `test:watch` | `test:ipc`, `test:main` | - |

### CI map

- Main CI gate (`ci.yml`): `pnpm nx affected -t lint,typecheck,test`
- Boundary workflow (`test.yml`): conditionally runs affected `test:smoke`, `test:integration`, `test:ipc`, and `test:main`

### Key clarification from current state

The plan should treat slow targets as **boundary-owned**, not “every project must expose every slow target.”
That ambiguity existed in the previous wording of Phase 2 and is now resolved below.

## Target Ownership Model (Should-Be)

| Boundary changed | Primary target | Owner project |
| --- | --- | --- |
| Domain logic, mapping, local component behavior, contract checks | `<project>:test` / `<project>:test:watch` | current changed project |
| Real DB / Prisma / transaction boundary | `task:test:integration` | `task` |
| HTTP route wiring / middleware / serialization / controller composition | `api:test:smoke` | `api` |
| Electron preload / IPC handlers | `desktop:test:ipc` | `desktop` |
| Electron main-process logic | `desktop:test:main` | `desktop` |
| Browser end-user critical flows | `web:e2e` | `web` |
| Cross-end sync regression | `web:e2e:sync` | `web` |
| Explicit perf verification | `task:test:bench` | `task` |

## Execution Phases with Definition of Done

### Phase 1 — Baseline Alignment (**Done**)

**Outcome**
- Docs and scripts align with Nx-first (`pnpm nx ...`) model.
- `nx.json` target defaults are present for main test layers.

**DoD**
- Root scripts use `pnpm nx ...` for testing entry points.
- Docs describe Vitest + Playwright split and boundary-based escalation.
- `nx.json` includes test-layer defaults (`test:watch`, `test:integration`, `test:smoke`, `test:bench`, `e2e`).

### Phase 2 — Core Target Normalization (**Done**)

**Outcome**
- `task`, `api`, `web`, `desktop` expose consistent fast entry (`test`, `test:watch`).
- Boundary targets exist where each boundary is actually owned.

**DoD**
- All four core projects expose `test` and `test:watch`.
- Legacy naming drift removed (e.g., `task:test:performance` -> `task:test:bench`).
- Slow targets follow ownership model, not blanket duplication.

**Notes**
- Target shape normalization and fast-target correctness are now both in place for the core owner projects.

### Phase 3 — Vitest Config Consolidation (**Done**)

**Outcome**
- Per-project `vitest.config.ts` is the primary ownership boundary.
- Root `vitest.config.ts` becomes a thin workspace registry + shared infra.

**DoD**
- Root config no longer carries project-specific deep alias complexity that can live in project configs/shared helpers.
- Shared defaults (alias/matchers/common test options) are centralized in `vitest.shared.ts`.
- No regression in target behavior for `task/api/web/desktop`.

### Phase 4 — Test Utilities Consolidation (**Done**)

**Outcome**
- `@dailyuse/test-utils` is the default shared source for fixtures/mocks/harness/helpers.

**DoD**
- API fast tests remain isolated from real-DB lifecycle setup.
- API fast target executes a non-empty suite and no longer relies on `passWithNoTests` to appear healthy.
- Web tests use shared harness for common Vue/Pinia/browser mock setup.
- New test helpers land in `@dailyuse/test-utils` by default, not ad hoc per project.

### Phase 5 — CI Restructure (**Done**)

**Outcome**
- Fast gates are in main CI; slow suites are conditionally boundary-triggered.

**DoD**
- Main PR gate uses affected fast checks.
- Boundary workflow conditionally runs affected slow suites (`test:smoke`, `test:integration`).
- Explicit policy documented for when to include `test:ipc` / `test:main` in CI triggers.

### Phase 6 — Governance & Automation (**Done**)

**Outcome**
- New projects inherit correct testing target shape and naming automatically.

**DoD**
- Nx automation injects required fast targets and applicable boundary targets during normal workspace task execution and explicit sync runs.
- Governance check fails when required target naming/presence drifts.

## Completion Summary

1. **API fast feedback restored**: `apps/api/vitest.config.ts` now runs against the app-local root, excludes smoke/integration coverage from the fast target, and fails on empty discovery instead of relying on `passWithNoTests`.
2. **Root Vitest config thinned**: `vitest.config.ts` now acts as a workspace registry plus shared infra while `task/api/app-vue/desktop/web` own their boundary-specific config through per-project files.
3. **Shared test harness completed**: app-vue/browser setup moved onto `@dailyuse/test-utils`, including shared browser mocks and shared Pinia setup.
4. **Nx-native automation completed**: a local Nx sync generator now owns test target normalization, is registered in `nx.json`, and is attached to common target defaults so missing targets are auto-synced during normal project task execution.

## Risks and Open Decisions

1. **Root Vitest shrink risk**
   - Risk: moving aliases/setup can break fork-worker resolution behavior.
   - Mitigation: migrate in small slices and verify by target (`task:test`, `api:test`, `web:test`, `desktop:test` + owned slow suites).

2. **API integration target scope**
   - Open decision: keep all real-DB integration under `task:test:integration`, or add `api:test:integration` later if API gains direct DB-bound integration needs.

## Progress Snapshot

### Completed

- Phase 1 baseline alignment.
- Phase 2 core target normalization.
- Phase 3 completion: root Vitest helper logic extracted into `vitest.workspace-helpers.ts`, and boundary suites for API/task/desktop/web/app-vue now resolve through per-project `--config` entry points.
- Phase 4 completion:
  - API fast setup stays boundary-light and now executes a non-empty suite
  - app-vue now uses shared browser and Pinia setup from `@dailyuse/test-utils`
  - duplicated local browser mocks were removed from editor and store specs
- Phase 5 current batch: `test.yml` now conditionally runs affected desktop boundary targets (`test:ipc`, `test:main`) in addition to smoke/integration.
- Phase 6 completion:
  - `tools/test/test-target-governance.mjs` still provides explicit `--write` / `--check` governance automation
  - local Nx plugin `@dailyuse/nx-test-system` now exposes `sync-test-targets`
  - `nx.json` now registers the sync generator globally and on common target defaults so target normalization is inherited during normal Nx task execution
  - root script `test:targets:sync` now calls the Nx generator entry point

### Validation Notes

- `pnpm test:targets:check` passes after the automation changes.
- Earlier in this rollout session, `pnpm nx run api:test` passed with a non-empty suite and `pnpm nx run app-vue:test` passed after the shared harness migration.
- Final Nx re-runs after the sync-generator wiring were blocked by the current environment's escalation quota (`spawn EPERM` from Nx plugin subprocesses in sandbox, then approval limit reached for escalated re-runs). That is an environment limitation in this session, not a known implementation regression.
