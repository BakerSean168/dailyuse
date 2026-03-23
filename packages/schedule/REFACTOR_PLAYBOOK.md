# Schedule Refactor Playbook

Use this file as the quickest map when reviewing or extending the schedule module migration.

## Read Order

1. `packages/schedule/src/infrastructure-server/schedule.module.ts`
   - the canonical `createScheduleModule(deps)` shape
   - defines `ScheduleModuleDependencies`, `ScheduleApplicationPort`, `ScheduleModuleInstance`
   - assembles all use cases once via `createScheduleUseCases()`
   - wraps use cases with `ok()` / `fail()` in the `api` facade
   - owns `start()` / `dispose()` lifecycle for runtime contributions
2. `packages/schedule/src/api/module.ts`
   - shows how API transport selects Prisma adapters and creates the module
   - 3-step pattern: composition root -> transport handlers -> route mounting
   - `destroy()` calls `scheduleModule.dispose()`
3. `packages/schedule/src/api/runtime.ts`
   - hosts the live scheduler runtime via `createScheduleRuntimeContribution()`
   - loads active tasks, tracks task lifecycle changes, and executes due tasks through registered source executors
4. `packages/schedule/src/api/transport-handlers.ts`
   - thin mapping layer: `ScheduleApplicationPort` -> `ScheduleUseCases` (controller port)
   - currently a direct pass-through since shapes already match
5. `packages/schedule/src/electron-entry/index.ts`
   - same module reused from a second transport (Electron IPC)
   - uses `createSchedulePowerSyncModule(db)` instead of Prisma adapters
   - registers `ipcMain.handle()` for each schedule channel
6. `packages/schedule/src/infrastructure-server/powersync.ts`
   - convenience factory wiring PowerSync repository adapters into `createScheduleModule`

## What To Copy

### 1. Composition Root Shape

From `packages/schedule/src/infrastructure-server/schedule.module.ts`:

```ts
export interface ScheduleModuleDependencies {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
}

export interface ScheduleApplicationPort {
  createTask(data: CreateScheduleTaskRequest, ctx: Context): Promise<Result<unknown>>;
  listTasks(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTask(id: string): Promise<Result<unknown>>;
  // ... (13 methods total covering CRUD, lifecycle, batch, metadata)
}

export interface ScheduleModuleInstance {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly useCases: ScheduleModuleUseCases;
  readonly api: ScheduleApplicationPort;
  start(): void;
  dispose(): void;
}

export function createScheduleModule(deps: ScheduleModuleDependencies): ScheduleModuleInstance;
```

Key: `api` wraps use cases with `ok()` / `fail()` so transports never touch Result construction.
（`api` 用 `ok()` / `fail()` 包裹 use case，传输层不接触 Result 构造。）

### 2. API Module Shape

From `packages/schedule/src/api/module.ts` — self-contained 3-step pattern:

1. **Composition root**: select Prisma adapters -> build repos -> build use cases -> create runtime contribution -> `createScheduleModule({...repos, runtimeContributions})`
   （选择 Prisma 适配器 -> 构建仓储 -> 构建 use case -> 创建运行时贡献 -> 组装模块）
2. **Transport handlers**: `createScheduleTransportHandlers(scheduleModule.api)` + controller instantiation
   （创建传输处理器 + 控制器实例化）
3. **Route mounting**: `router.use('/schedules', scheduleRoutes)` + `router.use('/schedules/events', eventRoutes)`
   （路由挂载）

Note: schedule's API module builds use cases independently (`createScheduleUseCases`) before the module so the runtime contribution can reuse the assembled task APIs without a second composition path.
（schedule 的 API 模块独立预构建 use case，让 runtime contribution 可以直接复用已组装好的任务 API，而不需要第二套装配路径。）

### 3. Runtime Contribution Shape

From `packages/schedule/src/api/runtime.ts`:

- Replaces the deprecated `registerScheduleInitializationTasks()` from `initialization.ts`
  （取代 `initialization.ts` 中已弃用的 `registerScheduleInitializationTasks()`）
- Loads active tasks into the in-memory queue on `start()`
- Subscribes to `schedule:task:*` events to keep the queue synchronized
- Dispatches due tasks through the registered source executors and records execution results
- Repeated `start()` / `stop()` calls are safe (idempotent guard)

### 4. Transport Mapping Shape

From `packages/schedule/src/api/transport-handlers.ts`:

- Thin mapping: `ScheduleApplicationPort` -> `ScheduleUseCases` (controller interface)
- Currently a direct pass-through since the two shapes already match
- If they diverge in the future, the mapper adapts without touching the composition root

```ts
export function createScheduleTransportHandlers(api: ScheduleApplicationPort): ScheduleUseCases {
  return api;
}
```

## What Was Deleted During Migration

- `registerScheduleInitializationTasks()` — deprecated, replaced by `createScheduleRuntimeContribution()`
  （已弃用，被运行时贡献取代）
- Global `InitializationManager.getInstance().registerTask()` usage — replaced by module-owned `start()` / `stop()`
  （全局初始化管理器注册用法已被模块自有的 start/stop 取代）
- `src/api/initialization.ts` — still present but marked `@deprecated`; all active code paths use `runtime.ts`
  （文件仍存在但全文标记 @deprecated；所有活跃代码路径已切换到 runtime.ts）
- Centralized schedule projection logic — replaced by per-module schedule runtime contributions in goal / task / reminder
  （集中式 schedule projection 逻辑已被 goal / task / reminder 各自拥有的 schedule runtime contribution 取代）

## Correspondence With Governance

| Schedule                            | Governance                            |
| ----------------------------------- | ------------------------------------- |
| `createScheduleModule`              | `createGovernanceModule`              |
| `ScheduleModuleDependencies`        | `GovernanceModuleDependencies`        |
| `ScheduleApplicationPort`           | `GovernanceApplicationPort`           |
| `ScheduleModuleInstance`            | `GovernanceModuleInstance`            |
| `ScheduleModuleRuntimeContribution` | `GovernanceRuntimeContribution`       |
| `createScheduleRuntimeContribution` | `createGovernanceRuntimeContribution` |
| `createScheduleTransportHandlers`   | `createGovernanceTransportHandlers`   |
| `createScheduleUseCases` (helper)   | _(inlined in governance)_             |
| `createSchedulePowerSyncModule`     | `createGovernancePowerSyncModule`     |
| `ScheduleApiModule`                 | `GovernanceApiModule`                 |
| `ScheduleElectronModule`            | `GovernanceElectronModule`            |

## Migration Checklist

- [x] Add `createScheduleModule(deps)` composition root in `schedule.module.ts`
- [x] Define `ScheduleModuleDependencies` — repositories + optional runtime contributions
- [x] Define `ScheduleApplicationPort` — transport-neutral callable facade (13 methods)
- [x] Define `ScheduleModuleInstance` — api + useCases + start/dispose
- [x] Add `createScheduleUseCases()` pure assembly helper
- [x] Add `ScheduleModuleRuntimeContribution` interface (start/stop)
- [x] Add `createScheduleRuntimeContribution()` in `runtime.ts`
- [x] Deprecate `registerScheduleInitializationTasks()` in `initialization.ts`
- [x] Switch `ScheduleApiModule.register()` to use `createScheduleModule` + transport handlers
- [x] Add `ScheduleApiModule.destroy()` calling `module.dispose()`
- [x] Add `createScheduleTransportHandlers()` thin mapping layer
- [x] Switch `ScheduleElectronModule` to use `createSchedulePowerSyncModule`
- [x] Add `ScheduleElectronModule.destroy()` calling `module.dispose()` + removing IPC handlers
- [x] Add `createSchedulePowerSyncModule()` convenience factory in `powersync.ts`
- [x] Update barrel export in `src/index.ts`
- [x] Remove `ScheduleEventPublisher` / strategy-factory based projection path
- [x] Move schedule projection ownership to goal / task / reminder modules

## Success Criteria

A module is considered fully migrated when:

- There is one obvious composition root (`createScheduleModule`) — no singleton container needed
  （只有一个明确的组合根，不需要单例容器）
- Transport layers only choose adapters and forward to `module.api`
  （传输层只选择适配器并转发到 `module.api`）
- Lifecycle is explicit via `start()` / `dispose()`
  （生命周期通过 `start()` / `dispose()` 显式管理）
- `ok()` / `fail()` wrapping lives in the ApplicationPort, not in transports
  （`ok()` / `fail()` 包装在 ApplicationPort 中，不在传输层）
- Runtime side effects are reversible and owned by the module instance
  （运行时副作用可逆且由模块实例持有）
- The deprecated `initialization.ts` is no longer imported by active code paths
  （已弃用的 `initialization.ts` 不再被活跃代码路径引入）
