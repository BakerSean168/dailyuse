# Code Quality & Consistency Audit

**Date:** 2026-07-01
**Auditor:** Claude Code (automated)
**Scope:** Full monorepo (apps/api, apps/web, apps/desktop, apps/ai-service, packages/*)
**Method:** Multi-stage automated review with targeted verification

---

## 1. Executive Summary

The Memoflow monorepo is **structurally well-architected** with a clear layered DDD pattern (Contracts → Domain-Shared → Domain-Server/Client → Application → Infrastructure → API). The core architectural decisions — Result pattern, centralized error handling, `IApiModule` contract, Zod-based validation — are sound and consistently applied across most modules.

**The three highest-risk issues are:**

1. **Reminder module facade bloat** (~460 lines of inline business logic with 5 existing but unwired use-case classes) — this is the single largest maintenance hazard. The notification module has a similar but less severe deviation with raw SQL in its facade.

2. **Pervasive `as any` casts in production code** (38 instances) — particularly 15 in `builtin-validators.ts` and 4 in the account repository's Prisma JSON field handling. These undermine the type safety that the contracts layer is designed to enforce.

3. **Zero test coverage in three registered packages** (`apps/web`, `packages/app-vue`, `packages/scheduler-server`) — these contain the entire Vue SPA layer, the shared composable/store/router infrastructure, and server-side scheduler logic, all running without any unit test protection.

**Overall assessment:** The codebase is closer to "structurally clear, local problems" than "core boundary needs reconvergence." The architectural intent is strong — the issues are in execution consistency (reminder/notification facade deviation, type safety gaps, test coverage holes) rather than fundamental design flaws. The existing governance tooling (`tools/governance/`) suggests the team is already aware of these concerns.

---

## 2. Project Map

### Module Structure

```
dailyuse/ (Nx 22 pnpm monorepo)
├── apps/
│   ├── api/          → Express 5 REST API (tsup build)
│   ├── web/          → Vue 3 SPA (Vite)
│   ├── desktop/      → Electron 39 + Vue 3
│   ├── ai-service/   → Python FastAPI
│   └── mobile/       → placeholder
├── packages/
│   ├── contracts/    → Zod schemas, Result pattern, branded IDs (authority)
│   ├── domain-shared/ → Cross-domain value objects
│   ├── patterns/     → DDD base classes (AggregateRepositoryBase, etc.)
│   ├── utils/        → Utilities, validators, env config
│   ├── http-client/  → Axios/Result HTTP client
│   ├── ipc-client/   → Electron IPC bridge
│   ├── database/     → Prisma schema
│   ├── test-utils/   → Mock factories, matchers, fixtures
│   ├── [12 domain]   → task, goal, reminder, schedule, notification,
│   │                    account, authentication, setting, editor,
│   │                    dashboard, ai, governance, repository, data-portability
│   ├── [5 UI]        → ui-core, ui-vue-shadcn, ui-react-native, app-vue, app-react
│   └── [2 infra]     → powersync-schema, scheduler-server
└── tools/
    ├── governance/   → Naming, platform-leakage, singleton audits
    ├── nx-test-system/ → Test target sync generator
    └── [ci, build, docker, docs, agent-skills]
```

### Core Entry Points

| Surface | Entry | Stack |
|---------|-------|-------|
| API | `apps/api/src/main.ts` | Express 5 + Prisma + Zod |
| Web | `apps/web/src/main.ts` | Vue 3 + Pinia + shadcn-vue |
| Desktop | `apps/desktop/` | Electron 39 + Vue 3 |
| AI Service | `apps/ai-service/src/` | Python FastAPI |

### Key Architectural Patterns

- **Result<T>** pattern throughout (never throw for business errors)
- **IApiModule** contract for API module registration
- **Zod schemas** in `@dailyuse/contracts` as single source of truth for wire types
- **Branded types** for domain value objects (contracts → domain-shared two-layer)
- **Prisma** for database ORM with `AggregateRepositoryBase` auto-publishing domain events
- **Pinia** stores as pure state containers; composables handle business logic

---

## 3. Responsibility Boundaries

### Well-Defined Boundaries

| Boundary | Status | Evidence |
|----------|--------|----------|
| Contracts (wire types) vs Domain (branded types) | ✅ Clean | Two-layer branded type pattern is intentional and consistent |
| Domain-Shared (client+server) vs Domain-Server (server-only) | ✅ Clean | Separate export subpaths enforce the split |
| Application (use cases) vs Infrastructure (Prisma adapters) | ✅ Clean | Use cases depend on repository ports, not implementations |
| Routes vs Controllers vs Use Cases | ✅ Clean (task, goal, governance, auth, account, setting, schedule) | Consistent delegation chain |
| API app (composition root) vs Domain packages (business logic) | ✅ Clean | `main.ts` only wires modules; no business logic |

### Boundary Violations

| Boundary | Status | Evidence |
|----------|--------|----------|
| Reminder facade vs use cases | ❌ Violated | 460 lines of inline business logic in `reminder.module.ts` facade |
| Notification facade vs use cases | ⚠️ Partial | Raw SQL (`db.execute()`) in facade; bypasses use cases for 5 operations |
| Editor module structure | ⚠️ Deviant | No `createEditorUseCases()` extraction; use cases are local variables |
| `DatabaseClient` type safety | ⚠️ Leaked | `type DatabaseClient = any` at API module contract boundary |
| Dashboard/PowerSync (apps/api local) | ✅ Acceptable | Infrastructure modules; documented deviation |

---

## 4. Critical Findings (Blocker + High)

### Q-001 — Reminder Module: 460 Lines of Inline Business Logic in Facade

- **Severity:** High
- **Type:** Architecture
- **Location:** `packages/reminder/src/infrastructure-server/reminder.module.ts`, lines 302-763
- **Impact:** The facade contains complete business logic (DTO mapping, domain orchestration, repository calls, group stats updates) that should live in use-case classes. 5 existing use-case classes are written but never wired in. Any change to reminder business rules requires reading and modifying a single 460-line method collection, increasing bug risk and making testing impossible at the use-case level.
- **Evidence:**
  - `createTemplate` (lines 305-337): inline DTO normalization + domain service + group stats + enrichment
  - `updateTemplate` (lines 411-455): 44-line field-by-field update object construction
  - `enableTemplate`/`pauseTemplate`/`toggleTemplate` (lines 578-620): identical fetch-mutate-sync-save pattern duplicated 3 times
  - Unwired use cases: `create-reminder-template.use-case.ts`, `update-reminder-template.use-case.ts`, `delete-reminder-template.use-case.ts`, `list-reminder-templates.use-case.ts`, `get-reminder-template.use-case.ts`
- **Suggestion:** Wire the existing use-case classes into the module factory. Extract `toTemplateClientDTO` enrichment into a shared mapper. Replace facade methods with thin `useCases.X.execute(...)` delegation, following the task/goal pattern.
- **Needs test:** Yes — use-case level tests for each extracted use case
- **Recommended test location:** `packages/reminder/src/application-server/use-cases/__tests__/`
- **Verification:** `pnpm nx run reminder:test`

### Q-002 — Notification Module: Raw SQL in Facade Bypassing Use Cases

- **Severity:** High
- **Type:** Architecture
- **Location:** `packages/notification/src/infrastructure-server/notification.module.ts`, lines 287-459
- **Impact:** `updateNotification`, `deleteNotification`, `batchDelete`, `cleanupOldNotifications`, and `updatePreferences` use `db.execute()` (raw SQL) directly in the facade, bypassing both use-case classes and the Prisma repository layer. This makes the operations untestable at the use-case level and creates a maintenance blind spot.
- **Evidence:**
  - Lines 307-325: `db.execute()` for notification update
  - Lines 437-455: `db.execute()` for preferences update
  - Lines 362-373: `batchDelete` with inline loop
  - Lines 377-382: `cleanupOldNotifications` with inline timestamp math
- **Suggestion:** Migrate raw SQL to Prisma repository methods. Wire existing or create new use-case classes. Follow the standard facade delegation pattern.
- **Needs test:** Yes
- **Recommended test location:** `packages/notification/src/application-server/use-cases/__tests__/`
- **Verification:** `pnpm nx run notification:test`

### Q-003 — Zero Test Coverage for Web App, App-Vue, and Scheduler-Server

- **Severity:** High
- **Type:** Test
- **Location:** `apps/web/`, `packages/app-vue/`, `packages/scheduler-server/`
- **Impact:** The entire Vue SPA layer (13 Pinia stores, 10 domain modules with composables, router, DI container, error handling) runs without any unit tests. `packages/app-vue` contains all shared composable logic, store definitions, and route configuration — a bug here affects every domain feature. `packages/scheduler-server` has server-side scheduling logic with zero test coverage.
- **Evidence:**
  - `apps/web` has 0 test files (only 1 Playwright e2e spec: `shortcuts.spec.ts`)
  - `packages/app-vue` has 0 test files despite containing 13 Pinia stores and 10 domain composable modules
  - `packages/scheduler-server` has 0 test files
  - All three are registered in root `vitest.config.ts` with `passWithNoTests: true`
- **Suggestion:** Add unit tests for Pinia stores (mutations, getters), composables (API call orchestration, error handling), and router guards. Start with the highest-traffic composables: `useTaskTemplates`, `useGoal`, `useReminder`.
- **Needs test:** Yes — this IS the test gap
- **Recommended test location:** `packages/app-vue/src/modules/*/composables/__tests__/`, `packages/app-vue/src/modules/*/stores/__tests__/`
- **Verification:** `pnpm nx run app-vue:test`

### Q-004 — `DatabaseClient = any` Defeats Module Type Safety

- **Severity:** High
- **Type:** Quality
- **Location:** `apps/api/src/shared/contracts/api-module.ts`, line 34
- **Impact:** Every API module receives an untyped database client and must cast it to `PrismaClient` internally. This means a module with a wrong cast will only fail at runtime, not at compile time. The generic `ServerModuleContext<DbClient>` contract is well-designed but defeated by this escape hatch.
- **Evidence:**
  - `export type DatabaseClient = any;` with eslint-disable comment
  - Used in `apps/api/src/bootstrap.ts` (lines 19, 34, 37) and `apps/api/src/test/app-factory.ts` (lines 8, 16)
  - Each module casts internally: e.g., `const prisma = deps.databaseClient as PrismaClient;`
- **Suggestion:** Replace with `export type DatabaseClient = PrismaClient;` or use the existing generic `ServerModuleContext<PrismaClient>` directly. If multiple database clients are truly needed, use a discriminated union or a proper interface.
- **Needs test:** No (type-level change)
- **Verification:** `pnpm nx run api:typecheck`

### Q-005 — Hardcoded Chinese Strings in Shared HTTP Client (i18n Violation)

- **Severity:** High
- **Type:** Consistency
- **Location:** `packages/http-client/src/result-http-client.ts`, lines 385-431
- **Impact:** The shared HTTP client used by all web/desktop clients contains hardcoded Chinese error messages (`'请求超时，请稍后重试'`, `'网络连接异常，请检查网络'`, etc.). These are not i18n-aware and cannot be localized. The same messages are duplicated in `apps/web/src/platform/auth-web-service.ts` (lines 23-53).
- **Evidence:**
  - `result-http-client.ts` lines 387-400: `statusToMessage()` with hardcoded Chinese
  - `result-http-client.ts` lines 408-431: network error messages with hardcoded Chinese
  - `auth-web-service.ts` lines 23-53: identical hardcoded Chinese messages
  - `apps/web/src/auth/result-error.ts`: duplicated `translateResultError` function
- **Suggestion:** Move error messages to i18n keys. Use the existing `translateResultError()` pattern from `packages/app-vue/src/shared/utils/translate-result-error.ts` as the single source. Remove the duplicate in `apps/web/src/auth/result-error.ts`.
- **Needs test:** No (string extraction)
- **Verification:** `pnpm nx run web:typecheck && pnpm nx run http-client:typecheck`

---

## 5. Full Findings

### Blocker

*None found.*

### High

| ID | Type | Location | Summary |
|----|------|----------|---------|
| Q-001 | Architecture | `packages/reminder/src/infrastructure-server/reminder.module.ts:302-763` | 460 lines of inline business logic in facade; 5 use-case classes exist but are unwired |
| Q-002 | Architecture | `packages/notification/src/infrastructure-server/notification.module.ts:287-459` | Raw SQL (`db.execute()`) in facade; bypasses use-case and repository layers |
| Q-003 | Test | `apps/web/`, `packages/app-vue/`, `packages/scheduler-server/` | Zero unit tests for entire Vue SPA layer (13 stores, 10 composables) and scheduler |
| Q-004 | Quality | `apps/api/src/shared/contracts/api-module.ts:34` | `DatabaseClient = any` defeats module type safety |
| Q-005 | Consistency | `packages/http-client/src/result-http-client.ts:385-431` | Hardcoded Chinese error messages in shared client; duplicated in auth-web-service |

### Medium

| ID | Type | Location | Summary |
|----|------|----------|---------|
| Q-006 | Quality | `packages/utils/src/validation/builtin-validators.ts` | 15 `as any` casts in production code; validator interface needs proper generic type |
| Q-007 | Quality | `packages/account/src/infrastructure-server/adapters/prisma/account-prisma.repository.ts` | 4 `as any` casts for Prisma JSON fields; needs Prisma JSON type adapter |
| Q-008 | Consistency | `packages/contracts/src/modules/task/api/response-schemas.ts` | Task response schemas use `z.string()` for enums; goal uses `z.enum()`. OpenAPI docs won't show valid values for task. |
| Q-009 | Consistency | `packages/contracts/src/modules/task/api/` vs `goal/api/` | Task CRUD schemas don't use `.strict()`; goal does. Task endpoints silently accept extra properties. |
| Q-010 | Consistency | `packages/contracts/src/modules/task/value-objects/task-type.ts` | Missing outer `as const` on object literal (inner values have it, object doesn't) |
| Q-011 | Test | `packages/reminder/src/application-server/use-cases/commands/reminder-use-cases.test.ts` | Hand-rolled mock classes with `any` types instead of `createMockRepo<T>()`; bypasses compile-time interface verification |
| Q-012 | Test | `packages/schedule/src/application-server/use-cases/commands/schedule-use-cases.test.ts` | Same hand-rolled mock anti-pattern as Q-011 |
| Q-013 | Consistency | `packages/app-vue/src/views/DashboardView.vue` | ~30 hardcoded Chinese strings bypassing i18n entirely |
| Q-014 | Consistency | `packages/app-vue/src/router/index.ts:63` | `title: '仪表盘'` hardcoded Chinese instead of i18n key |
| Q-015 | Quality | `packages/editor/src/infrastructure-server/editor.module.ts:142-392` | No `createEditorUseCases()` extraction; use cases are local variables, not a typed collection |
| Q-016 | Test | `packages/goal/`, `packages/reminder/` | No `testing/` directory with fixture factories (unlike task module's `aOneTimeTask()` pattern); increases test verbosity and inconsistency |

### Low

| ID | Type | Location | Summary |
|----|------|----------|---------|
| Q-017 | Quality | `apps/api/src/bootstrap.ts:104-105` | Dual route mounting at `/api` and `/api/v1`; every endpoint available at two URLs |
| Q-018 | Quality | `packages/task/src/infrastructure-server/adapters/prisma/task-template-prisma.repository.ts:114-152` | `findByGoalId`/`findByTags` parse JSON in-memory from string columns; won't scale |
| Q-019 | Quality | `apps/api/src/main.ts` | Module failure re-throws and crashes server; comment says "comment it out" for faulty modules |
| Q-020 | Test | Root `vitest.config.ts` | `passWithNoTests: true` globally; zero-test packages silently pass CI |
| Q-021 | Quality | `packages/app-vue/src/shared/components/GlobalErrorBoundary.vue:33-37` | `@ts-ignore` for `globalThis.Sentry`; fragile external script integration |
| Q-022 | Quality | `packages/reminder/src/infrastructure-server/reminder.module.ts:82,85,109,122` | `ReminderApplicationPort` uses `Record<string, unknown>` for input types instead of typed DTOs |
| Q-023 | Consistency | `apps/web/src/auth/result-error.ts` | Duplicated `translateResultError` function (copy of `packages/app-vue/src/shared/utils/translate-result-error.ts`) |
| Q-024 | Test | `packages/contracts/src/` | Only 6 test files for substantial shared type/DTO layer; schema validation edge cases untested |

### Needs Verification

| ID | Type | Location | Summary |
|----|------|----------|---------|
| Q-025 | Performance | `packages/reminder/src/infrastructure-server/reminder.module.ts:198-252` | `toTemplateClientDTO` queries group repository per template; potential N+1 in `listTemplates` — needs profiling with real data |
| Q-026 | Quality | `apps/api/src/shared/infrastructure/middleware/global.ts:54-63` | Compression skips SSE paths by checking `req.path` string; may miss SSE on non-standard paths |

---

## 6. Consistency Matrix

### Naming Consistency

| Concept | Location A | Location B | Inconsistency | Risk | Suggested Unification |
|---------|-----------|-----------|---------------|------|----------------------|
| Error translation function | `packages/app-vue/src/shared/utils/translate-result-error.ts` | `apps/web/src/auth/result-error.ts` (as `translateAuthResultError`) | Duplicate implementation | Maintenance drift | Import from shared location |
| Error message strings | `packages/http-client/src/result-http-client.ts:387-431` | `apps/web/src/platform/auth-web-service.ts:23-53` | Identical hardcoded Chinese | Localization blocked | Use i18n keys via shared constant |
| Test file naming | `*.test.ts` (use-case tests) | `*.spec.ts` (domain specs) | Two conventions coexist | Mild confusion | Accept both; document convention |

### Data Structure Consistency

| Concept | Location A | Location B | Inconsistency | Risk | Suggested Unification |
|---------|-----------|-----------|---------------|------|----------------------|
| Enum Zod validation | `packages/contracts/src/modules/goal/api/response-schemas.ts` (uses `z.enum()`) | `packages/contracts/src/modules/task/api/response-schemas.ts` (uses `z.string()`) | Task doesn't validate enum values in responses | OpenAPI docs incomplete for task | Use `z.enum()` consistently |
| Schema strictness | `packages/contracts/src/modules/goal/api/goal-crud.dto.ts` (uses `.strict()`) | `packages/contracts/src/modules/task/api/task-template.dto.ts` (no `.strict()`) | Task accepts unknown properties | Silent data acceptance | Apply `.strict()` consistently |
| `as const` pattern | All value objects (outer `as const`) | `packages/contracts/src/modules/task/value-objects/task-type.ts` (missing outer) | Inconsistent const assertion | Type narrowing difference | Add outer `as const` |

### Architecture Pattern Consistency

| Pattern | Standard Modules | Deviant Modules | Inconsistency | Risk | Suggested Unification |
|---------|-----------------|-----------------|---------------|------|----------------------|
| Facade → UseCase delegation | task, goal, governance, auth, account, setting, schedule, repository | reminder (HIGH), notification (MEDIUM), editor (LOW-MEDIUM), ai (LOW) | Business logic in facade | Untestable, hard to maintain | Wire existing use cases; extract facade logic |
| `createXUseCases()` helper | task, goal, governance, auth, account, setting, schedule | reminder (missing), editor (missing), notification (missing) | No typed use-case collection | Cannot introspect module capabilities | Add assembly helpers |
| `createMockRepo<T>()` in tests | 73 test files | reminder-use-cases.test.ts, schedule-use-cases.test.ts | Hand-rolled mocks with `any` | Type drift between mock and real repo | Use `createMockRepo<T>()` |
| Test fixture factories | task (`testing/task.fixture.ts`) | goal, reminder (no fixtures) | Inline domain object construction | Test verbosity, inconsistency | Add fixture factories |

### Error Handling Consistency

| Layer | Pattern | Status |
|-------|---------|--------|
| API controllers | `Result<T>` return, never throw | ✅ Consistent across task, goal, governance |
| API global handler | 4-tier priority chain (404 → CORS → Domain → Prisma → 500) | ✅ Centralized |
| HTTP client | `ResultHttpClient` returns `Promise<Result<T>>`, never rejects | ✅ Consistent |
| Web composables | `translateResultError()` + `toast.error()` | ✅ Consistent (except auth duplicate) |
| Reminder facade | Inline try/catch with direct error returns | ⚠️ Bypasses Result pattern in some paths |
| Notification facade | Raw SQL errors may bypass structured error handling | ⚠️ Inconsistent |

---

## 7. Testing Gaps

### Coverage Summary

| Module | Test Files | Domain Coverage | Use-Case Coverage | Integration | Smoke |
|--------|-----------|----------------|-------------------|-------------|-------|
| task | 45 | ✅ Rich (2205-line TaskTemplate.test.ts) | ✅ One per use case | ✅ 3 files | ✅ Full HTTP pipeline |
| goal | 55 | ✅ Rich | ✅ Good | ✅ 1 file | ⚠️ Partial |
| reminder | 31 | ✅ Good (23 spec files) | ⚠️ Hand-rolled mocks, consolidated files | ✅ 1 file | ⚠️ Partial |
| schedule | 23 | ✅ Good | ⚠️ Hand-rolled mocks | ✅ 1 file | ⚠️ Partial |
| notification | 17 | ✅ Good | ⚠️ Thin | ❌ None | ❌ None |
| authentication | 16 | ✅ Good | ✅ Good | ❌ None | ⚠️ Partial |
| account | 14 | ✅ Good | ✅ Good | ❌ None | ❌ None |
| setting | 11 | ✅ Good | ⚠️ Thin | ❌ None | ❌ None |
| governance | 15 | ✅ Good | ✅ Good | ❌ None | ❌ None |
| editor | 19 | ✅ Good | ❌ None | ❌ None | ❌ None |
| contracts | 6 | ❌ Thin | N/A | N/A | N/A |
| app-vue | 0 | ❌ None | ❌ None | ❌ None | ❌ None |
| web | 0 | ❌ None | ❌ None | ❌ None | ⚠️ 1 e2e only |
| scheduler-server | 0 | ❌ None | ❌ None | ❌ None | ❌ None |

### Gap Table

| Test Gap | Risk | Recommended Test Type | Recommended Location | Priority | Verification Command |
|----------|------|----------------------|---------------------|----------|---------------------|
| Pinia stores (13 stores in app-vue) | State mutations untested | Unit test | `packages/app-vue/src/modules/*/stores/__tests__/` | High | `pnpm nx run app-vue:test` |
| Composables (useTaskTemplates, useGoal, etc.) | API orchestration untested | Unit test with mocked services | `packages/app-vue/src/modules/*/composables/__tests__/` | High | `pnpm nx run app-vue:test` |
| Router guards | Auth redirect logic untested | Unit test | `packages/app-vue/src/router/__tests__/` | High | `pnpm nx run app-vue:test` |
| DI container / lazy service loader | Proxy-based lazy init untested | Unit test | `apps/web/src/platform/__tests__/` | Medium | `pnpm nx run web:test` |
| Reminder facade → use-case migration | Business logic will move | Use-case unit tests | `packages/reminder/src/application-server/use-cases/__tests__/` | High | `pnpm nx run reminder:test` |
| Notification facade raw SQL | SQL correctness untested | Integration test | `packages/notification/src/__tests__/integration/` | Medium | `pnpm nx run notification:test:integration` |
| Contracts Zod schemas | Schema validation edge cases | Unit test | `packages/contracts/src/modules/*/api/__tests__/` | Medium | `pnpm nx run contracts:test` |
| Scheduler-server logic | Entire package untested | Unit test | `packages/scheduler-server/src/__tests__/` | Medium | `pnpm nx run scheduler-server:test` |
| Error translation fallback chain | Fallback logic untested | Unit test | `packages/app-vue/src/shared/utils/__tests__/` | Low | `pnpm nx run app-vue:test` |

---

## 8. Recommended Repair Plan

### Repair Pass 01: Wire Reminder Use Cases into Module Factory (Q-001)

- **Goal:** Replace 460 lines of inline facade logic with thin use-case delegation
- **Files:** `packages/reminder/src/infrastructure-server/reminder.module.ts`
- **Why first:** Highest architectural risk; existing use-case classes are already written but unused
- **Steps:**
  1. Read existing use-case classes to verify they match facade behavior
  2. Add `createReminderUseCases()` assembly helper
  3. Add `ReminderModuleUseCases` typed collection
  4. Replace facade methods with `useCases.X.execute(...)` calls
  5. Extract `toTemplateClientDTO` enrichment into a shared mapper
  6. Run `pnpm nx run reminder:test` to verify no regressions
  7. Run `pnpm nx run api:test:smoke` to verify HTTP behavior unchanged
- **Verification:** `pnpm nx run reminder:test && pnpm nx run api:test:smoke`

### Repair Pass 02: Add App-Vue Store Unit Tests (Q-003)

- **Goal:** Establish test coverage for the 13 Pinia stores
- **Files:** `packages/app-vue/src/modules/*/stores/__tests__/*.test.ts` (new)
- **Why second:** Highest test coverage gap; stores are pure state containers, easy to test
- **Steps:**
  1. Create test for `task-store.ts` as template (mutations, getters, persistence config)
  2. Replicate pattern for `goal-store.ts`, `reminder-store.ts`, `authentication-store.ts`
  3. Cover remaining stores
  4. Run `pnpm nx run app-vue:test`
- **Verification:** `pnpm nx run app-vue:test`

### Repair Pass 03: Fix `DatabaseClient = any` (Q-004)

- **Goal:** Restore type safety at module contract boundary
- **Files:** `apps/api/src/shared/contracts/api-module.ts`, `apps/api/src/bootstrap.ts`
- **Why third:** Type safety fix with low blast radius; enables compile-time detection of wrong casts
- **Steps:**
  1. Change `DatabaseClient` from `any` to `PrismaClient`
  2. Remove eslint-disable comment
  3. Remove internal `as PrismaClient` casts in module files (now unnecessary)
  4. Run `pnpm nx run api:typecheck`
- **Verification:** `pnpm nx run api:typecheck`

### Repair Pass 04: Extract Hardcoded Chinese Error Messages (Q-005)

- **Goal:** Make error messages i18n-aware; eliminate duplication
- **Files:** `packages/http-client/src/result-http-client.ts`, `apps/web/src/platform/auth-web-service.ts`, `apps/web/src/auth/result-error.ts`
- **Why fourth:** User-facing text quality; blocks localization
- **Steps:**
  1. Define error message i18n keys in a shared constant
  2. Replace hardcoded strings in `result-http-client.ts` with key references
  3. Remove duplicate `translateAuthResultError` from `apps/web/src/auth/result-error.ts`; import from shared
  4. Align `auth-web-service.ts` to use same pattern
  5. Run `pnpm nx run web:typecheck && pnpm nx run http-client:typecheck`
- **Verification:** `pnpm nx run web:typecheck && pnpm nx run http-client:typecheck`

### Repair Pass 05: Fix Task Contracts Schema Consistency (Q-008, Q-009, Q-010)

- **Goal:** Align task contracts with goal contracts patterns
- **Files:** `packages/contracts/src/modules/task/api/response-schemas.ts`, `packages/contracts/src/modules/task/api/task-template.dto.ts`, `packages/contracts/src/modules/task/value-objects/task-type.ts`
- **Why fifth:** Type consistency; OpenAPI documentation quality
- **Steps:**
  1. Change `z.string()` to `z.enum(...)` in task response schemas
  2. Add `.strict()` to task CRUD schemas
  3. Add outer `as const` to `TaskType` object
  4. Run `pnpm nx run contracts:test && pnpm nx run task:typecheck`
- **Verification:** `pnpm nx run contracts:test && pnpm nx run task:typecheck`

### Repair Pass 06: Migrate Notification Facade from Raw SQL (Q-002)

- **Goal:** Replace raw SQL with Prisma repository methods; wire use cases
- **Files:** `packages/notification/src/infrastructure-server/notification.module.ts`
- **Why sixth:** Architectural consistency; enables testing
- **Steps:**
  1. Audit raw SQL queries to understand intent
  2. Create Prisma repository methods for each query
  3. Create or wire use-case classes
  4. Replace facade methods with use-case delegation
  5. Run `pnpm nx run notification:test`
- **Verification:** `pnpm nx run notification:test`

### Repair Pass 07: Add Composable Unit Tests (Q-003 continued)

- **Goal:** Test API orchestration logic in composables
- **Files:** `packages/app-vue/src/modules/*/composables/__tests__/*.test.ts` (new)
- **Why seventh:** Second-highest test gap after stores
- **Steps:**
  1. Create test for `useTaskTemplates.ts` as template (mock service, verify store updates, verify error handling)
  2. Replicate for `useGoal.ts`, `useReminder.ts`
  3. Cover remaining composables
- **Verification:** `pnpm nx run app-vue:test`

### Repair Pass 08: Replace Hand-Rolled Mocks (Q-011, Q-012)

- **Goal:** Use `createMockRepo<T>()` consistently
- **Files:** `packages/reminder/src/application-server/use-cases/commands/reminder-use-cases.test.ts`, `packages/schedule/src/application-server/use-cases/commands/schedule-use-cases.test.ts`
- **Why eighth:** Test quality; type safety in mocks
- **Steps:**
  1. Replace `class MockReminderTemplateRepository` with `createMockRepo<IReminderTemplateRepository>()`
  2. Replace all `any`-typed mock methods with properly typed overrides
  3. Run `pnpm nx run reminder:test && pnpm nx run schedule:test`
- **Verification:** `pnpm nx run reminder:test && pnpm nx run schedule:test`

### Repair Pass 09: Eliminate `as any` in Production Code (Q-006, Q-007)

- **Goal:** Reduce production `as any` from 38 to <5
- **Files:** `packages/utils/src/validation/builtin-validators.ts`, `packages/account/src/infrastructure-server/adapters/prisma/account-prisma.repository.ts`
- **Why ninth:** Type safety across utility and infrastructure layers
- **Steps:**
  1. Define proper generic type for validator return objects
  2. Replace 15 `as any` casts in validators with typed returns
  3. Add Prisma JSON field type definitions for account profile/settings
  4. Replace 4 `as any` casts in account repository
  5. Run `pnpm nx run utils:test && pnpm nx run account:test`
- **Verification:** `pnpm nx run utils:test && pnpm nx run account:test`

### Repair Pass 10: Add Test Fixture Factories (Q-016)

- **Goal:** Create reusable fixture factories for goal and reminder modules
- **Files:** `packages/goal/src/testing/goal.fixture.ts` (new), `packages/reminder/src/testing/reminder.fixture.ts` (new)
- **Why tenth:** Test maintainability; reduces test setup verbosity
- **Steps:**
  1. Create `aGoal()` factory following task module's `aOneTimeTask()` pattern
  2. Create `aReminderTemplate()` factory
  3. Migrate existing inline constructions in test files to use fixtures
  4. Run `pnpm nx run goal:test && pnpm nx run reminder:test`
- **Verification:** `pnpm nx run goal:test && pnpm nx run reminder:test`

---

## 9. Suggested Follow-up Prompts

### Focused Repair Pass Prompts

```
# Repair Pass 01: Wire reminder use cases
"Read packages/reminder/src/infrastructure-server/reminder.module.ts and all files in
packages/reminder/src/application-server/use-cases/. Verify each use-case class matches
the inline facade logic, then wire them into the module factory following the pattern in
packages/task/src/infrastructure-server/task.module.ts. Extract toTemplateClientDTO
enrichment into a shared mapper. Run pnpm nx run reminder:test to verify."
```

```
# Repair Pass 02: Add app-vue store tests
"Read packages/app-vue/src/modules/task/stores/task-store.ts and create a comprehensive
unit test at packages/app-vue/src/modules/task/stores/__tests__/task-store.test.ts covering
all mutations, getters, and persistence config. Then replicate the pattern for goal-store,
reminder-store, and authentication-store. Run pnpm nx run app-vue:test."
```

```
# Repair Pass 03: Fix DatabaseClient type
"Change apps/api/src/shared/contracts/api-module.ts line 34 from 'export type DatabaseClient = any'
to 'export type DatabaseClient = PrismaClient' (import PrismaClient from @prisma/client).
Remove the eslint-disable comment. Then remove all 'as PrismaClient' casts in module files that
were compensating for the any type. Run pnpm nx run api:typecheck to verify."
```

```
# Repair Pass 04: Extract i18n error messages
"Extract the hardcoded Chinese error messages from packages/http-client/src/result-http-client.ts
(lines 385-431) and apps/web/src/platform/auth-web-service.ts (lines 23-53) into i18n keys.
Delete apps/web/src/auth/result-error.ts and import from
packages/app-vue/src/shared/utils/translate-result-error.ts instead. Run
pnpm nx run web:typecheck && pnpm nx run http-client:typecheck."
```

```
# Repair Pass 05: Fix task contracts
"In packages/contracts/src/modules/task/api/response-schemas.ts, change z.string() to z.enum(...)
for status and importance fields. In task-template.dto.ts, add .strict() to all CRUD schemas.
In value-objects/task-type.ts, add outer 'as const' to the object literal. Run
pnpm nx run contracts:test && pnpm nx run task:typecheck."
```

### Test Gap Prompts

```
# Composable test template
"Read packages/app-vue/src/modules/task/composables/useTaskTemplates.ts and create a unit test
at packages/app-vue/src/modules/task/composables/__tests__/useTaskTemplates.test.ts that:
1) mocks the injected task service, 2) verifies store updates on success,
3) verifies error translation and toast notification on failure,
4) verifies loading state management. Use @testing-library/vue and vitest."
```

```
# Contracts schema test
"Create packages/contracts/src/modules/task/api/__tests__/task-template.dto.test.ts that tests:
1) valid input passes CreateTaskTemplateSchema, 2) missing required fields fail validation,
3) extra properties are rejected (after .strict() is added), 4) enum fields reject invalid values.
Use vitest and the existing zod schemas."
```

### Consistency Convergence Prompts

```
# Editor module convergence
"Read packages/editor/src/infrastructure-server/editor.module.ts and refactor to follow the
standard pattern: extract createEditorUseCases() helper, define EditorModuleUseCases type,
add useCases property to EditorModuleInstance. Follow packages/governance/src/infrastructure-server/
governance.module.ts as the canonical reference. Run pnpm nx run editor:test."
```

```
# Notification module convergence
"Read packages/notification/src/infrastructure-server/notification.module.ts and replace all
db.execute() raw SQL calls with Prisma repository methods. Wire existing or create new use-case
classes for updateNotification, deleteNotification, batchDelete, cleanupOldNotifications, and
updatePreferences. Follow the task module pattern. Run pnpm nx run notification:test."
```
