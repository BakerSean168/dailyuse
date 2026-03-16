# Reminder Refactor Playbook

Use this file as the quickest map when reviewing or extending the reminder module migration.

> **Complexity note:** This was a HIGH complexity migration. The original `api/module.ts`
> was ~368 lines with inline domain logic (template CRUD, group CRUD, response recording,
> frequency analysis, preference management). The Electron entry duplicated API assembly
> logic with its own repository instantiation. Both transports now share a single
> `ReminderApplicationPort` through the composition root.

## Read Order

1. `packages/reminder/src/infrastructure-server/reminder.module.ts`
   - the canonical `createReminderModule(deps)` shape
   - shows dependency object (4 repositories + optional runtime contributions)
   - shows the large `ReminderApplicationPort` (27 methods) and lifecycle ownership
2. `packages/reminder/src/infrastructure-server/powersync.ts`
   - thin factory selecting PowerSync adapters and delegating to the shared composition root
3. `packages/reminder/src/api/module.ts`
   - shows how API transport chooses Prisma adapters and creates the module
   - follows the standard 3-step pattern: composition root → transport handlers → route mounting
4. `packages/reminder/src/api/runtime.ts`
   - shows how old global initialization becomes module-owned runtime contribution
5. `packages/reminder/src/api/transport-handlers.ts`
   - shows the thin transport mapping layer (direct pass-through since `api` already matches `ReminderUseCases`)
6. `packages/reminder/src/electron-entry/index.ts`
   - shows the same module reused from IPC transport via `createReminderPowerSyncModule`
   - registers IPC handlers using `ReminderController` + shared transport handlers
7. `packages/reminder/src/application-client/index.ts`
   - shows the client-side service (`ReminderClientService`) and legacy singleton proxy

## What To Copy

### 1. Composition Root Shape

```ts
export interface ReminderModuleDependencies {
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly reminderResponseRepository: IReminderResponseRepository;
  readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;
  readonly runtimeContributions?: ReminderRuntimeContributionsInput;
}

export interface ReminderApplicationPort {
  // Template CRUD (6 methods)
  createTemplate(data, ctx): Promise<Result<unknown>>;
  listTemplates(ctx): Promise<Result<unknown>>;
  getUpcomingReminders(params, ctx): Promise<Result<unknown>>;
  getTemplate(id): Promise<Result<unknown>>;
  updateTemplate(id, data): Promise<Result<unknown>>;
  deleteTemplate(id): Promise<Result<unknown>>;

  // Template Actions (5 methods)
  enableTemplate(id): Promise<Result<unknown>>;
  pauseTemplate(id): Promise<Result<unknown>>;
  toggleTemplate(id): Promise<Result<unknown>>;
  moveTemplate(id, groupId): Promise<Result<unknown>>;
  getTemplateHistory(id): Promise<Result<unknown>>;

  // Response Operations (3 methods)
  recordResponse(templateId, data): Promise<Result<unknown>>;
  getTemplateResponses(templateId): Promise<Result<unknown>>;
  getResponseStats(templateId): Promise<Result<unknown>>;

  // Frequency Analysis (3 methods)
  analyzeFrequency(templateId): Promise<Result<unknown>>;
  adjustFrequency(templateId, data): Promise<Result<unknown>>;
  rejectFrequencyAdjustment(templateId): Promise<Result<unknown>>;

  // Group CRUD (8 methods)
  createGroup(data, ctx): Promise<Result<unknown>>;
  listGroups(ctx): Promise<Result<unknown>>;
  getGroup(id): Promise<Result<unknown>>;
  updateGroup(id, data): Promise<Result<unknown>>;
  deleteGroup(id): Promise<Result<unknown>>;
  switchGroupControlMode(id, data): Promise<Result<unknown>>;
  batchGroupTemplates(groupId, data): Promise<Result<unknown>>;
  toggleGroup(id): Promise<Result<unknown>>;

  // Preferences (2 methods)
  getPreferences(ctx): Promise<Result<unknown>>;
  updatePreferences(data, ctx): Promise<Result<unknown>>;
}

export function createReminderModule(deps: ReminderModuleDependencies): ReminderModuleInstance {
  // assemble domain services, use cases, and api once
}
```

### 2. API Module Shape

- Outer app selects Prisma adapters (4 repositories)
- Outer app passes runtime contributions explicitly
- Transport consumes `module.api`
- `destroy()` calls `module.dispose()`

### 3. PowerSync Factory Shape

```ts
export function createReminderPowerSyncModule(db: Queryable): ReminderModuleInstance {
  return createReminderModule({
    reminderTemplateRepository: new ReminderTemplatePowerSyncRepository(db),
    reminderGroupRepository: new ReminderGroupPowerSyncRepository(db),
    reminderResponseRepository: new ReminderResponsePowerSyncRepository(db),
    userReminderPreferenceRepository: new UserReminderPreferencePowerSyncRepository(db),
  });
}
```

### 4. Runtime Contribution Shape

- Replaces global initialization task registration
- Small object with `start()` / `stop()`
- Repeated start/stop calls are safe (idempotent)

### 5. Transport Mapping Shape

- Transport mapping is a direct pass-through (`return api`)
- `ReminderApplicationPort` already satisfies `ReminderUseCases` controller interface
- No additional instantiation of repositories or use cases

### 6. Electron Entry Shape

- Uses `createReminderPowerSyncModule(ctx.db)` for PowerSync adapters
- Creates `ReminderController` with shared transport handlers
- Registers IPC handlers as thin wrappers around controller methods
- `destroy()` removes IPC handlers and calls `module.dispose()`

## What Was Deleted During Migration

- Inline domain logic from old `api/module.ts` (~368 lines) — extracted to `ReminderApplicationPort` inside the composition root
- Duplicated repository instantiation in the Electron entry — now delegates to `createReminderPowerSyncModule`
- Duplicated application logic between API and Electron transports — both now share `module.api`

## What Still Needs Cleanup

- `ReminderContainer` legacy DI container (`infrastructure-server/di/reminder-container.ts`) — retained for backward compatibility, should be removed
- `reminderApplicationService` singleton proxy (`application-client/index.ts`) — should be replaced with `createReminderClientService(adapter)` factory
- `setReminderApplicationService` manual initialization helper — should be removed with singleton proxy

## Correspondence With Governance

| Reminder                            | Governance                             |
| ----------------------------------- | -------------------------------------- |
| `createReminderModule`              | `createGovernanceModule`               |
| `createReminderPowerSyncModule`     | _(governance has no PowerSync layer)_  |
| `ReminderApplicationPort`           | `GovernanceApplicationPort`            |
| `ReminderModuleDependencies`        | `GovernanceModuleDependencies`         |
| `ReminderModuleInstance`            | `GovernanceModuleInstance`             |
| `ReminderModuleRuntimeContribution` | `GovernanceModuleRuntimeContribution`  |
| `createReminderRuntimeContribution` | `createGovernanceRuntimeContribution`  |
| `createReminderTransportHandlers`   | `createGovernanceTransportHandlers`    |
| `ReminderClientService`             | _(governance has no client layer yet)_ |

## Migration Checklist

- [x] Add `createReminderModule(deps)` composition root
- [x] Add `ReminderApplicationPort` transport-neutral surface (27 methods)
- [x] Add `ReminderModuleDependencies` with 4 repository interfaces
- [x] Add optional runtime contribution support
- [x] Add `createReminderPowerSyncModule` factory for PowerSync adapters
- [x] Extract inline domain logic from old `api/module.ts` into composition root
- [x] Switch API entrypoint to the factory (3-step pattern)
- [x] Switch Electron/IPC entrypoint to use shared composition root
- [x] Share transport handlers between API and Electron transports
- [x] Add lifecycle management (`start()` / `dispose()`)
- [x] Export hygiene — layered re-exports in `src/index.ts`
- [x] Update docs (COMPOSITION_ROOT.md, REFACTOR_PLAYBOOK.md)

## Success Criteria

A module is considered fully migrated when:

- There is one obvious composition root (`createReminderModule`)
- Transport only chooses adapters and forwards to `module.api`
- Lifecycle is explicit via `start()` / `dispose()`
- No singleton container is needed for normal runtime usage
- Both API and Electron transports share the same `ReminderApplicationPort`
- Client service returns `Result<T>` without throwing
- Exports are layered: Contracts → Domain → Application → Infrastructure
