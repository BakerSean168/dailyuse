# Task Refactor Playbook

Use this file as the quickest map to understand how the task module was migrated to the
functional factory pattern. This follows the same blueprint as `packages/governance/`.

## Read Order / 阅读顺序

1. `packages/task/src/infrastructure-server/task.module.ts`
   - The canonical `createTaskModule(deps)` shape
   - Shows dependency object, transport-neutral `api`, and lifecycle ownership
   - 规范化的 `createTaskModule(deps)` 工厂形式
2. `packages/task/src/infrastructure-server/powersync.ts`
   - Thin factory that selects PowerSync adapters and delegates to `createTaskModule()`
   - PowerSync 适配器工厂，委托给 `createTaskModule()`
3. `packages/task/src/api/module.ts`
   - Shows how API transport chooses Prisma adapters and creates the module
   - 3-step pattern: composition root → transport handlers → mount routes
   - 三步模式：组合根 → 传输处理器 → 挂载路由
4. `packages/task/src/api/runtime.ts`
   - Shows how old global initialization becomes module-owned runtime contribution
   - 旧全局初始化改为模块级 runtime contribution
5. `packages/task/src/api/transport-handlers.ts`
   - Shows the thin transport mapping layer (3 controller groups)
   - 薄传输层映射（3 个控制器分组）
6. `packages/task/src/electron-entry/index.ts`
   - Shows the same module reused from a second transport (IPC)
   - 同一个模块从第二种传输层（IPC）复用

## What Was Changed / 变更内容

### 1. Composition Root (`task.module.ts`)

**Before:** Class `TaskModule` with constructor injection, manual repository property exposure.
**After:** `createTaskModule(deps)` factory function returning `TaskModuleInstance`.

Key types:

- `TaskModuleDependencies` — everything the module needs from outside
- `TaskModuleUseCases` — assembled use case collection (28 use cases)
- `TaskApplicationPort` — transport-neutral API surface
- `TaskModuleInstance` — return type with `api`, `useCases`, `start()`, `dispose()`

### 2. PowerSync Factory (`powersync.ts`)

**Before:** Class `TaskPowerSyncModule` extending `TaskModule`.
**After:** `createTaskPowerSyncModule(db)` thin factory delegating to `createTaskModule()`.

### 3. API Module (`api/module.ts`)

**Before:** Direct repository instantiation and use case wiring in `register()`.
**After:** 3-step pattern:

1. `createTaskModule()` — composition root
2. `createTaskTransportHandlers()` — map API to controller interfaces
3. `registerTaskRoutes()` — mount routes with platform middleware

### 4. Runtime Contribution (`api/runtime.ts`)

**Before:** `registerTaskInitializationTasks()` using global `InitializationManager`.
**After:** `createTaskRuntimeContribution()` returning `{ start(), stop() }`.

### 5. Transport Handlers (`api/transport-handlers.ts`)

**New file.** Maps the flat `TaskApplicationPort` to controller-specific interfaces:

- `template: TaskTemplateUseCases` (13 use cases)
- `instance: TaskInstanceUseCases` (10 use cases)
- `dependency: TaskDependencyUseCases` (6 use cases)

### 6. Electron Entry (`electron-entry/index.ts`)

**Before:** `new TaskPowerSyncModule()` + direct use case calls + `TaskContainer.reset()`.
**After:** `createTaskPowerSyncModule()` + transport handlers + `dispose()`.

### 7. Exports Updated

- `infrastructure-server/index.ts` — exports factory functions and types
- `api/index.ts` — exports `TaskApiModule`
- `src/index.ts` — explicit named exports for composition root types

### 8. Legacy Code Deprecated

- `TaskContainer` — `@deprecated` JSDoc added, kept for backward compatibility
- `api/initialization.ts` — `@deprecated` JSDoc added, replaced by `runtime.ts`

## What Was Preserved / 保留内容

- All 28 use case classes (commands + queries)
- All 3 controller classes (template, instance, dependency)
- All route definitions
- All IPC channel names
- All domain logic (aggregates, value objects, repository interfaces)
- `TaskClientService` (client-side, uses port injection — already clean)

## Migration Checklist / 迁移清单

- [x] `createTaskModule(deps)` composition root
- [x] `TaskApplicationPort` transport-neutral API
- [x] `createTaskPowerSyncModule(db)` PowerSync factory
- [x] `createTaskRuntimeContribution()` runtime lifecycle
- [x] `createTaskTransportHandlers(api)` transport mapping
- [x] API module uses 3-step pattern with `destroy()`
- [x] Electron entry uses factories with `dispose()`
- [x] Legacy `TaskContainer` deprecated
- [x] Legacy `initialization.ts` deprecated
- [x] Barrel exports updated
- [x] Zero type errors (verified with `tsc --noEmit`)
- [x] Bilingual comments (English + Chinese)
- [x] `COMPOSITION_ROOT.md` created
- [x] `REFACTOR_PLAYBOOK.md` created

## Success Criteria / 成功标准

The task module is considered fully migrated when:

- There is one obvious composition root (`createTaskModule`)
- Transport only chooses adapters and forwards to `module.api`
- Lifecycle is explicit via `start()` / `dispose()`
- No singleton container is needed for normal runtime usage
- All existing routes and IPC channels continue to work unchanged
