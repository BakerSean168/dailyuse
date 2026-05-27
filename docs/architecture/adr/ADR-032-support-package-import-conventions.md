# ADR-032: Support Package Import Conventions

## Status

Accepted

## Context

Support packages (`@dailyuse/utils`, `@dailyuse/contracts`, `@dailyuse/app-vue`, etc.) grew organically
and developed "god barrel" exports — a single root `index.ts` that re-exports everything. This creates:

- **Coupling**: consumers pull in the entire surface area even when they only need `createLogger`
- **Ambiguity**: no signal about which domain a symbol belongs to
- **Bundle risk**: tree-shaking helps but isn't guaranteed across all bundlers

The `@dailyuse/utils/result` subpath (96 files) proves the subpath pattern works when adopted early.
All other subpaths had near-zero adoption while 250 files imported from the root barrel.

## Decision

### 1. Prefer subpath imports for `@dailyuse/utils`

Import from the specific subpath, not the root barrel:

```typescript
// Before
import { createLogger, AggregateRoot, BusinessRuleViolationError } from '@dailyuse/utils';

// After
import { createLogger } from '@dailyuse/utils/logger';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';
```

Available subpaths:

| Subpath | Contents |
|---|---|
| `@dailyuse/utils/logger` | `createLogger`, `ILogger`, `LoggerFactory`, `LogLevel` |
| `@dailyuse/utils/domain` | `Entity`, `AggregateRoot`, `ValueObject`, `eventBus`, `createIdType` |
| `@dailyuse/utils/errors` | `DomainError`, `BusinessRuleViolationError`, `NotFoundError`, `mapInfraErrorToResultError` |
| `@dailyuse/utils/shared` | `generateUUID`, `toDateOrNull`, `parseJson`, `envConfig` |
| `@dailyuse/utils/result` | `ok`, `fail`, `Result`, `expressAdapter`, `ipcAdapter`, `RouteRegistrar` |
| `@dailyuse/utils/frontend` | `getEnvironmentConfig`, `LoadingState`, `debounce/throttle` |
| `@dailyuse/utils/validation` | `FormValidator`, `BuiltinValidators` |
| `@dailyuse/utils/lifecycle` | `InitializationManager`, `InitializationPhase`, `WebInitializationManager`, `ModuleGroup` |

An ESLint `no-restricted-imports` warning enforces this for new code.

### 2. Unified client service creation language

Client-side services follow a consistent factory convention across all packages:

```typescript
// Factory function pattern (used by 9 packages)
export function createXxxServiceFromHttpClient(httpClient: IHttpClient): IXxxService {
  return new XxxHttpClientService(httpClient);
}
```

This convention applies to both Web (HTTP) and Desktop (IPC) transport:

| Package | Factory |
|---|---|
| `authentication` | `createAuthServiceFromHttpClient` |
| `account` | `createAccountServiceFromHttpClient` |
| `task` | `createTaskServiceFromHttpClient` |
| `goal` | `createGoalServiceFromHttpClient` |
| `schedule` | `createScheduleServiceFromHttpClient` |
| `reminder` | `createReminderServiceFromHttpClient` |
| `notification` | `createNotificationServiceFromHttpClient` |
| `repository` | `createRepositoryServiceFromHttpClient` |
| `editor` | `createEditorServiceFromHttpClient` |

Desktop uses `createXxxServiceFromIpcBridge(bridge)` with the same shape.

**Why not force a shared factory across React and Vue?** Web uses `createLazyService()` for
code-splitting (dynamic import), while React's `AppProvider` eagerly creates services at startup.
Forcing a shared factory would break Web's lazy-loading. The shared language is the naming
convention, not a shared implementation.

### 3. App shell root export guidance

`@dailyuse/app-vue` and `@dailyuse/app-react` are app shells, not libraries. Their root exports
should be constrained to:

- **DI keys** (`InjectionKey<T>`)
- **Plugin install functions**
- **Router factory**
- **Shared layout components**

Feature-module code should be imported directly from the feature subpath
(e.g., `@dailyuse/app-vue/modules/editor`), not from the root barrel.

## Consequences

- All consumers migrated from `@dailyuse/utils` root barrel to specific subpaths
- Root barrel now uses explicit named exports (no `export *`)
- New code is guided by ESLint warnings toward subpath imports
- Client service factories follow a predictable naming pattern across all packages
- `InitializationManager` etc. available via `@dailyuse/utils/lifecycle` subpath

## Migration notes

- The `@dailyuse/utils` root barrel uses explicit named exports (no `export *`) and emits ESLint warnings for root-barrel imports
- `InitializationManager`, `InitializationPhase`, `InitializationTask` are available via `@dailyuse/utils/lifecycle`
- All consumers have been migrated to subpath imports — no files import from the root barrel
