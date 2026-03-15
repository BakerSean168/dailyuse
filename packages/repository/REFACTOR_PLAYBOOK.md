# Repository Refactor Playbook

Use this file as the quickest map when reviewing or extending the repository module migration.

Repository was the **highest-complexity** migration — the original `api/module.ts` was a
397-line monolith containing inline use-case instantiation for 25 use cases, manual handler
wiring across Repository/Resource/Folder/Bookmark CRUD, and direct transport coupling. It is
now the canonical example for migrating large modules with broad transport surfaces.

## Read Order

1. `packages/repository/src/infrastructure-server/repository.module.ts`
   - the canonical `createRepositoryModule(deps)` shape (707 lines total)
   - `RepositoryModuleDependencies`: 4 repositories + 1 storage port + optional runtime contributions
   - `RepositoryModuleUseCases`: 25 assembled use-case instances
   - `RepositoryApplicationPort`: 25+ transport-neutral methods across 4 CRUD domains
   - `createRepositoryUseCases()`: pure assembly helper (extracted for testability)
   - `buildApplicationPort()`: maps use-case `.execute()` to `ok()`/`fail()` facade
   - `RepositoryModule` class: deprecated backward-compatibility facade
2. `packages/repository/src/api/module.ts`
   - shows how API transport chooses Prisma adapters and creates the module
   - 3-step pattern: composition root → transport handlers → route mounting
   - module singleton with `destroy()` → `module.dispose()`
3. `packages/repository/src/api/runtime.ts`
   - shows how old global `InitializationManager` registration becomes module-owned runtime contribution
   - small object with idempotent `start()` / `stop()`
4. `packages/repository/src/api/transport-handlers.ts`
   - the thinnest possible transport mapping — a direct pass-through
   - `RepositoryApplicationPort` is structurally compatible with `RepositoryUseCases`
5. `packages/repository/src/api/routes/index.ts`
   - splits routes into 3 route files: repository, resource, folder
   - each receives handlers + middleware, creates controller, returns Router
6. `packages/repository/src/electron-entry/index.ts`
   - shows the same module concept reused from IPC transport
   - **note**: still uses `RepositoryPowerSyncModule` (legacy) + manual `ipcMain.handle()`
   - candidate for future migration to the composition root pattern
7. `packages/repository/src/application-client/index.ts`
   - exports `RepositoryClientService` and `IRepositoryApiClient` port type

## What To Copy

### 1. Composition Root Shape (Large Module)

```ts
export interface RepositoryModuleDependencies {
  readonly repositoryRepository: IRepositoryRepository;
  readonly resourceRepository: IResourceRepository;
  readonly folderRepository: IFolderRepository;
  readonly resourceBookmarkRepository: IResourceBookmarkRepository;
  readonly storagePort: IStoragePort;
  readonly runtimeContributions?: RepositoryRuntimeContributionsInput;
}

export interface RepositoryApplicationPort {
  // Repository CRUD (8 methods)
  createRepository(data, ctx): Promise<Result<unknown>>;
  listRepositories(filters, ctx): Promise<Result<unknown>>;
  getCurrentRepository(ctx): Promise<Result<unknown>>;
  getRepository(id): Promise<Result<unknown>>;
  updateRepository(id, data): Promise<Result<unknown>>;
  deleteRepository(id): Promise<Result<unknown>>;
  archiveRepository(id): Promise<Result<unknown>>;
  activateRepository(id): Promise<Result<unknown>>;
  // Resource CRUD (6 methods)
  // Folder CRUD (6 methods)
  // Bookmark CRUD (5 methods)
  // ...
}

export interface RepositoryModuleUseCases {
  // 25 use-case instances — assembled once in createRepositoryUseCases()
}

export function createRepositoryModule(
  deps: RepositoryModuleDependencies,
): RepositoryModuleInstance {
  // 1. assemble use cases
  // 2. build application port
  // 3. return instance with start/dispose
}
```

### 2. API Module Shape

- Outer app selects Prisma adapters via `RepositoryRepositoryFactory.createPrismaRepositories()`
- Creates `FsStorageAdapter` with configured base path
- Passes runtime contributions explicitly
- Transport consumes `module.api` via `createRepositoryTransportHandlers()`
- Routes split into `registerRepositoryRoutes`, `registerResourceRoutes`, `registerFolderRoutes`
- `destroy()` calls `module.dispose()`

### 3. Runtime Contribution Shape

- Replaces global `InitializationManager.registerTask()` pattern
- Small object with `start()` / `stop()`
- Repeated start/stop calls are safe (idempotent)

### 4. Transport Mapping Shape (Direct Pass-Through)

```ts
export function createRepositoryTransportHandlers(
  api: RepositoryApplicationPort,
): RepositoryUseCases {
  return api; // structural compatibility — no manual mapping needed
}
```

This is the ideal end state: when the `ApplicationPort` exactly matches the controller's
expected interface, the transport handler becomes a single-line pass-through.

### 5. Use-Case Extraction Pattern (High-Complexity Modules)

```ts
export function createRepositoryUseCases(
  deps: RepositoryModuleDependencies,
): RepositoryModuleUseCases {
  // Pure function: deps in → wired use cases out
  // Testable without module lifecycle
}
```

For large modules (25+ use cases), extracting assembly into a standalone function keeps the
composition root readable and enables unit-testing use-case wiring independently.

## What Was Deleted During Migration

- `RepositoryContainer` singleton DI container (replaced by constructor injection in composition root)
- Global `InitializationManager` registration (replaced by runtime contributions)
- 397-line monolithic `api/module.ts` with inline use-case instantiation (replaced by 123-line
  3-step module that delegates to the composition root)
- Manual handler wiring scattered across the API module (centralized in `buildApplicationPort`)

## What Still Uses Legacy Patterns

- `RepositoryModule` class (deprecated, kept for `RepositoryPowerSyncModule` compatibility)
- `RepositoryContainer` still used by the deprecated `RepositoryModule` class and by
  `RepositoryElectronModule.destroy()` for cleanup
- Electron entry still does manual `ipcMain.handle()` wiring with `RepositoryPowerSyncModule`
  rather than using `createRepositoryModule()` + shared transport handlers

## Correspondence With Governance

| Repository                            | Governance                             |
| ------------------------------------- | -------------------------------------- |
| `createRepositoryModule`              | `createGovernanceModule`               |
| `RepositoryApplicationPort`           | `GovernanceApplicationPort`            |
| `RepositoryModuleDependencies`        | `GovernanceModuleDependencies`         |
| `RepositoryModuleInstance`            | `GovernanceModuleInstance`             |
| `RepositoryModuleUseCases`            | _(governance keeps use cases inline)_  |
| `createRepositoryUseCases`            | _(governance assembles inline)_        |
| `createRepositoryRuntimeContribution` | `createGovernanceRuntimeContribution`  |
| `createRepositoryTransportHandlers`   | `createGovernanceTransportHandlers`    |
| `RepositoryClientService`             | _(governance has no client layer yet)_ |

## Migration Checklist

- [x] Add `createRepositoryModule(deps)` composition root
- [x] Add `RepositoryApplicationPort` transport-neutral surface (25+ methods)
- [x] Extract `createRepositoryUseCases()` pure assembly helper
- [x] Add `buildApplicationPort()` to centralize ok/fail wrapping
- [x] Add optional runtime contribution support
- [x] Switch API entrypoint to the factory (397 lines → 123 lines)
- [x] Add `createRepositoryTransportHandlers()` (direct pass-through)
- [x] Split routes into 3 focused route files
- [x] Deprecate legacy `RepositoryModule` class (kept for backward compatibility)
- [x] Export hygiene — layered re-exports in `src/index.ts`
- [x] Update docs (COMPOSITION_ROOT.md, REFACTOR_PLAYBOOK.md)
- [ ] Migrate Electron entry to use `createRepositoryModule()` instead of `RepositoryPowerSyncModule`
- [ ] Remove deprecated `RepositoryModule` class once all consumers updated
- [ ] Remove `RepositoryContainer` singleton once deprecated class removed

## Success Criteria

A module is considered fully migrated when:

- There is one obvious composition root (`createRepositoryModule`)
- Use cases are assembled once via `createRepositoryUseCases(deps)` — no inline `new` in transports
- Transport only chooses adapters and forwards to `module.api`
- Transport handler mapping is boring (ideally a pass-through)
- Lifecycle is explicit via `start()` / `dispose()`
- No singleton container is needed for normal runtime usage
- Client service returns `Result<T>` without throwing
- Exports are layered: Contracts → Domain → Application → Infrastructure
