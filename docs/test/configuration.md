# Vitest Configuration Deep Dive

> Source: `vitest.config.ts` (root)

## Overview

All 12 test projects are defined in a single `vitest.config.ts` using the `test.projects` array. This replaced the deprecated workspace file format from Vitest 2.x.

## Shared Components

### Plugins

Three custom Vite plugins are defined at the top of the file:

| Plugin                        | Purpose                                                            | Used By                           |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `taskResolveAtAlias`          | Resolves `@/` imports to the correct package's `src/` dir          | task, task-integration, api-smoke |
| `taskDeepImportResolver`      | Resolves `@dailyuse/task/<deep-path>` for non-export paths         | api-smoke                         |
| `contractsDeepImportResolver` | Resolves `@dailyuse/contracts/<subpath>` with dual-layout fallback | task, task-integration            |

**Important**: These plugins only run in the main Vite server process. They do **not** run inside fork workers. The `resolve.alias` array is what actually handles resolution in test workers.

### `taskResolveAliases` Array

This is the primary resolution mechanism. It's shared across `task`, `task-integration`, and `api-smoke` projects.

```
Alias resolution order:
1. @dailyuse/database          → packages/database/src/index.ts
2. @dailyuse/domain-shared     → packages/domain-shared/src/index.ts
3. @dailyuse/utils/(.+)        → packages/utils/src/$1/index.ts       (regex)
4. @dailyuse/utils              → packages/utils/src/index.ts
5. @dailyuse/patterns           → packages/patterns/src/index.ts
6. @dailyuse/test-utils/(.+)   → packages/test-utils/src/$1           (regex)
7. @dailyuse/test-utils         → packages/test-utils/src/index.ts
8. @dailyuse/contracts/result   → contracts/src/result/index.ts        (explicit)
9. @dailyuse/contracts/shared   → contracts/src/shared/index.ts        (explicit)
10. @dailyuse/contracts/primitives → contracts/src/primitives/index.ts (explicit)
11. @dailyuse/contracts/electron  → contracts/src/electron/index.ts    (explicit)
12. @dailyuse/contracts/mocks    → contracts/src/mocks/index.ts        (explicit)
13. @dailyuse/contracts/(.+)     → contracts/src/modules/$1/index.ts   (regex catch-all)
14. @dailyuse/contracts           → contracts/src/index.ts
15. @dailyuse/task/(.+)          → packages/task/src/$1/index.ts       (regex)
16. @dailyuse/task                → packages/task/src/index.ts
```

### Why 5 Explicit Contracts Aliases?

The contracts package has two source layouts:

- Domain modules live in `src/modules/<name>/`
- Top-level utilities live in `src/<name>/`

The catch-all regex (item 13) routes everything to `src/modules/`. Without explicit aliases for the 5 top-level subpaths, `@dailyuse/contracts/result` would incorrectly resolve to `src/modules/result/index.ts` (which doesn't exist).

## Global Settings

```typescript
globals: true; // vi, describe, it, expect are global
passWithNoTests: true; // Projects without test files still pass
bail: process.env.CI ? 1 : 0; // Fail fast in CI
```

## Coverage

- Provider: `v8`
- Disabled by default, enable with `--coverage`
- Reporters: text, json, html, lcov
- Excludes: node_modules, dist, .d.ts, config files, prisma

## `api-smoke` Project Special Config

The api-smoke project extends `taskResolveAliases` with additional explicit aliases for deep task controller paths:

```
@dailyuse/task/api/controllers/task-template.controller → .ts file
@dailyuse/task/api/controllers/task-instance.controller → .ts file
@dailyuse/task/api/routes → routes/index.ts
```

These must come **before** the generic `@dailyuse/task/(.+)` regex in the alias array.

## Deprecation Warnings

Vitest 4 moved `poolOptions` to top-level project options. The current config still uses the nested format:

```
test.poolOptions.forks.singleFork  →  should become test.forks.singleFork
```

This produces deprecation warnings but works correctly at runtime.
