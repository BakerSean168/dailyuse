# Goal Refactor Playbook

Use this file as the quickest map when migrating another module to the new pattern.

## Read Order

1. `packages/goal/src/infrastructure-server/goal.module.ts`
   - the canonical `createGoalModule(deps)` shape
   - shows dependency object, use cases assembly, and lifecycle ownership
2. `packages/goal/src/api/module.ts`
   - shows how API transport chooses concrete adapters and creates the module
3. `packages/goal/src/api/runtime.ts`
   - shows how old global initialization becomes module-owned runtime contribution
4. `packages/goal/src/api/transport-handlers.ts`
   - shows the thin transport mapping layer
5. `packages/goal/src/electron-entry/index.ts`
   - shows the same module reused from a second transport (Electron IPC)

## What Changed

### Before (legacy pattern)

- `GoalModule` class — constructed with repositories, exposed use cases as properties
- `GoalContainer` singleton — mutable service locator for repositories
- `initialization.ts` — global `InitializationManager` task registration
- `api/module.ts` — manually assembled handlers object, `GoalContainer.getInstance().reset()` in destroy()
- `electron-entry/index.ts` — same manual assembly, direct `GoalContainer` usage

### After (governance pattern)

- `createGoalModule(deps)` factory — explicit composition root, returns `GoalModuleInstance`
- `GoalModuleUseCases` interface — typed use case collection
- `createGoalPowerSyncModule(db)` — convenience factory for Electron
- `createGoalRuntimeContribution()` — replaces global initialization hooks
- `createGoalTransportHandlers()` / `createGoalFolderTransportHandlers()` — thin mapping
- `api/module.ts` — 3-step pattern: composition root → transport handlers → mount routes
- `electron-entry/index.ts` — same 3-step with PowerSync + IPC handlers
- `start()` / `dispose()` lifecycle — idempotent, reversible

### Backward Compatibility

- `GoalModule` class is still exported but `@deprecated`
- `GoalContainer` is still exported but `@deprecated`
- `GoalModuleRepositories` type alias is still exported but `@deprecated`

## What To Delete During Migration

- ~~singleton DI container exports~~ (deprecated, kept for now)
- ~~`Container.getInstance().reset()` cleanup logic~~ (replaced by `dispose()`)
- ~~global initialization registration helpers~~ (replaced by runtime contributions)
- ~~transport-owned business orchestration~~ (replaced by transport handlers)
- ~~class facades that only wrap the factory API~~ (deprecated, kept for now)

## Migration Checklist

- [x] add `createGoalModule(deps)`
- [x] add `GoalModuleUseCases` interface
- [x] add `createGoalPowerSyncModule(db)` convenience factory
- [x] add optional runtime contribution support
- [x] switch API entrypoint to the factory
- [x] switch Electron/IPC entrypoint to the factory
- [x] add `PermanentlyDeleteGoal` to barrel exports
- [x] create transport handler mapping layer
- [x] create runtime contribution
- [x] update barrel exports (infrastructure-server, api, src/index.ts)
- [x] create documentation (COMPOSITION_ROOT.md, REFACTOR_PLAYBOOK.md)
- [x] deprecate container usage from module internals

## Success Criteria

A module is considered migrated when:

- there is one obvious composition root
- transport only chooses adapters and forwards to `module.useCases`
- lifecycle is explicit via `start()` / `dispose()`
- no singleton container is needed for normal runtime usage
