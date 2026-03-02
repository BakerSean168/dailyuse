# Test Architecture

## Three-Layer Testing Strategy

The DailyUse monorepo uses a three-layer testing strategy, with the **task** module as the reference implementation.

```
Layer 3: API Smoke Tests (Supertest)
  HTTP request → Express router → Controller → Use Case → mock Repository
  Verifies: routing, middleware, serialization, HTTP status codes

Layer 2: Unit Tests (vi.fn mocks)
  Controller/Service/UseCase → mocked dependencies
  Verifies: business logic, validation, error handling, DTO mapping

Layer 1: Integration Tests (real PostgreSQL)
  Repository → Docker PostgreSQL (port 5433)
  Verifies: SQL queries, Prisma mappings, data integrity, transactions
```

### Layer 1 — Repository Integration Tests (`task-integration`)

- **Location**: `packages/task/src/infrastructure-server/adapters/prisma/__tests__/*.integration.test.ts`
- **Requires**: Docker PostgreSQL container on port `5433`
- **Global setup**: `packages/task/src/__tests__/integration-global-setup.ts` (runs Prisma sync)
- **Execution**: Sequential (`fileParallelism: false`, `singleFork: true`) to avoid DB conflicts
- **Timeout**: 30s per test
- **Test count**: 60 tests

### Layer 2 — Unit Tests (`task`)

- **Location**: `packages/task/src/**/*.{test,spec}.ts` (excluding `*.integration.*`)
- **Strategy**: All external dependencies are mocked via `vi.fn()`. Tests validate:
  - Controller input validation (Zod schemas)
  - Use case orchestration logic
  - Domain aggregate state machines
  - Domain service behavior
  - DTO conversion
- **Test count**: 527 tests

### Layer 3 — API Smoke Tests (`api-smoke`)

- **Location**: `apps/api/src/__tests__/smoke/**/*.test.ts`
- **Strategy**: Supertest drives Express, controllers use real use case logic with mocked repositories
- **Validates**: Full HTTP round-trip without a database
- **Test count**: 58 tests

## Project Layout

```
vitest.config.ts          ← Single config for all 12 projects
├── Library Projects
│   ├── contracts         (0 tests, passWithNoTests)
│   ├── domain-server     (0 tests, passWithNoTests)
│   ├── domain-client     (0 tests, passWithNoTests)
│   └── ui                (0 tests, passWithNoTests)
├── Package Projects
│   ├── utils             (23 tests)
│   ├── task              (527 unit tests)
│   └── task-integration  (60 integration tests)
└── Application Projects
    ├── api               (0 non-smoke tests, passWithNoTests)
    ├── api-smoke         (58 smoke tests)
    ├── desktop           (0 tests, passWithNoTests)
    └── web               (0 tests, passWithNoTests)
```

## Module Resolution in Tests

This is the most complex part of the test infrastructure due to the monorepo structure.

### The Problem

Test files import cross-package modules using three styles:

1. **Relative paths**: `./services/foo`
2. **`@/` alias**: `@/domain-server/aggregates/TaskInstance`
3. **Package self-references**: `@dailyuse/contracts/task`, `@dailyuse/task/domain-shared`

Vitest runs tests in **fork workers** (`pool: 'forks'`). Vite plugins (`resolveId` hooks) only run in the main Vite server process, **not** inside fork workers. This means:

- `resolve.alias` works in fork workers (serialized to child processes)
- Vite plugins **do not** work in fork workers

### Resolution Strategy

All cross-package resolution is handled by `taskResolveAliases` (a `resolve.alias` array):

1. **Explicit string aliases** for top-level contracts subpaths (`result`, `shared`, `primitives`, `electron`, `mocks`)
2. **Catch-all regex** `@dailyuse/contracts/(.+)` → `src/modules/$1/index.ts` for domain module subpaths
3. **Bare alias** `@dailyuse/contracts` → `src/index.ts`
4. Similar pattern for `@dailyuse/utils`, `@dailyuse/task`, `@dailyuse/test-utils`

### The `@dailyuse/contracts` Dual Layout

The contracts package has two source directories:

```
packages/contracts/src/
├── modules/        ← Domain modules (task, goal, account, ...)
│   ├── task/index.ts
│   ├── goal/index.ts
│   └── ...
├── result/         ← Top-level utilities
├── shared/
├── primitives/
├── electron/
└── mocks/
```

A single regex can't route both layouts. Solution:

- 5 explicit string aliases for top-level subpaths (checked first)
- 1 catch-all regex for domain modules

### Alias Ordering Rules

```
1. Exact-string aliases checked first (longest match wins)
2. Regex aliases checked in array order (first match wins)
3. Subpath regex MUST come BEFORE bare-package alias
```

Incorrect ordering will cause the bare alias to match `@dailyuse/contracts/task` and resolve to `src/index.ts/task` (ENOTDIR error).
