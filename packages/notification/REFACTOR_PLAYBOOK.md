# Notification Refactor Playbook

Use this file as the quickest map when reviewing or extending the notification module migration.

## Read Order

1. `packages/notification/src/infrastructure-server/notification.module.ts`
   - the canonical `createNotificationModule(deps)` shape
   - defines `NotificationModuleDependencies`, `NotificationApplicationPort`, `NotificationModuleInstance`
   - assembles five use cases via `createNotificationUseCases()`
   - wraps them in a transport-neutral `api` facade
   - owns lifecycle via `start()` / `dispose()` with runtime contributions
2. `packages/notification/src/api/module.ts`
   - shows how API transport chooses Prisma adapters and creates the module
   - injects runtime contributions explicitly
   - mounts routes under `/notifications`
3. `packages/notification/src/api/runtime.ts`
   - **critical file** — preserves all cross-module event bus wiring from the deleted 164-line `initialization.ts`
   - subscribes to `reminder:triggered` and `schedule:task:executed` via `eventBus.on()`
   - `handleReminderTriggered`: converts reminder payloads into `notification:dispatch_in_app` + `notification:dispatch_desktop` events
   - `handleScheduleExecuted`: converts schedule execution payloads into desktop + in-app notifications (only for successful executions)
   - all subscriptions are scoped to `start()` / `stop()` — calling `stop()` removes all listeners
4. `packages/notification/src/api/transport-handlers.ts`
   - thin mapping from `NotificationApplicationPort` to controller's `NotificationUseCases` interface
   - shared by both HTTP and Electron transports
5. `packages/notification/src/electron-entry/index.ts`
   - same module reused from IPC transport
   - uses `createNotificationPowerSyncModule(db)` for desktop database access
   - creates a separate `runtimeContribution` and starts it manually
   - registers 10 IPC channels via `ipcMain.handle()`
6. `packages/notification/src/application-client/notification-client-service.ts`
   - `NotificationClientService` wraps `INotificationApiClient`
   - returns `Result<T>` throughout — no throwing

## What To Copy

### 1. Composition Root Shape

```ts
export interface NotificationModuleDependencies {
  readonly notificationRepository: INotificationRepository;
  readonly preferenceRepository: INotificationPreferenceRepository;
  readonly templateRepository: INotificationTemplateRepository;
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
}

export interface NotificationApplicationPort {
  createNotification(data: unknown): Promise<Result<unknown>>;
  listNotifications(query: unknown): Promise<Result<unknown>>;
  getNotification(id: string): Promise<Result<unknown>>;
  updateNotification(id: string, data: unknown): Promise<Result<unknown>>;
  deleteNotification(id: string): Promise<Result<unknown>>;
  markAsRead(id: string): Promise<Result<unknown>>;
  markAllAsRead(identityId: string): Promise<Result<unknown>>;
  getUnreadCount(identityId: string): Promise<Result<unknown>>;
  batchMarkAsRead(data: { notificationIds?: string[] }): Promise<Result<unknown>>;
  batchDelete(data: { notificationIds?: string[] }): Promise<Result<unknown>>;
  cleanupOldNotifications(data: {
    identityId: string;
    beforeDays?: number;
    category?: string;
  }): Promise<Result<unknown>>;
  getPreferences(identityId: string): Promise<Result<unknown>>;
  updatePreferences(dto: unknown): Promise<Result<unknown>>;
}

export function createNotificationModule(
  deps: NotificationModuleDependencies,
): NotificationModuleInstance {
  // assemble once
}
```

### 2. API Module Shape

- Outer app selects Prisma adapters (`NotificationPrismaRepository`, `NotificationPreferencePrismaRepository`, `NotificationTemplatePrismaRepository`)
- Outer app passes runtime contributions explicitly via `createNotificationRuntimeContribution()`
- Transport consumes `module.api` through `createNotificationTransportHandlers()`
- `destroy()` calls `module.dispose()`

### 3. Runtime Contribution Shape (Cross-Module Event Wiring)

This is the most complex part of the notification migration. The old `initialization.ts` (164 lines) contained substantial event bus wiring for cross-module events. This was converted to a runtime contribution with explicit lifecycle:

- `start()` subscribes to `reminder:triggered` and `schedule:task:executed` via `eventBus.on()`
- `stop()` unsubscribes via `eventBus.off()` — no dangling listeners
- `handleReminderTriggered`: dispatches `notification:dispatch_in_app` + `notification:dispatch_desktop`
- `handleScheduleExecuted`: dispatches `notification:dispatch_desktop` + `notification:dispatch_in_app` (only for `ExecutionStatus.Success`)
- Maps `SourceModule` (Goal/Task/Reminder) to `NotificationCategory`
- Repeated start/stop calls are safe (idempotent)

### 4. Transport Mapping Shape

- Maps `NotificationApplicationPort` to `NotificationUseCases` (controller interface)
- Port shape already matches controller needs — mapper is thin (11 pass-through methods)
- Does not instantiate repositories or use cases

### 5. Client Service Shape

- `NotificationClientService` wraps any `INotificationApiClient` (HTTP or IPC adapter)
- Returns `Result<T>` — no throwing
- Singleton proxy still exists in `application-client/index.ts` — not yet cleaned up

## What Was Deleted During Migration

- 164-line `initialization.ts` with global `InitializationManager` registration — replaced by `createNotificationRuntimeContribution()` in `src/api/runtime.ts`
- Direct `eventBus.on()` calls in initialization — now scoped to runtime contribution lifecycle

## What Still Needs Cleanup

- `NotificationContainer` singleton DI container (`infrastructure-server/di/notification-container.ts`) — exported with `@deprecated`
- `NotificationRepositoryFactory` (`infrastructure-server/di/`) — exported with `@deprecated`
- `notificationApplicationService` singleton proxy + `setNotificationApplicationService` helper (`application-client/index.ts`)
- Missing `createNotificationClientService(adapter)` factory function

## Correspondence With Governance

| Notification                            | Governance                             |
| --------------------------------------- | -------------------------------------- |
| `createNotificationModule`              | `createGovernanceModule`               |
| `NotificationApplicationPort`           | `GovernanceApplicationPort`            |
| `NotificationModuleDependencies`        | `GovernanceModuleDependencies`         |
| `NotificationModuleInstance`            | `GovernanceModuleInstance`             |
| `NotificationModuleRuntimeContribution` | runtime contribution interface         |
| `createNotificationRuntimeContribution` | `createGovernanceRuntimeContribution`  |
| `createNotificationTransportHandlers`   | `createGovernanceTransportHandlers`    |
| `createNotificationUseCases`            | use-case assembly helper               |
| `NotificationClientService`             | _(governance has no client layer yet)_ |

## Migration Checklist

- [x] Add `createNotificationModule(deps)` composition root
- [x] Add `NotificationApplicationPort` transport-neutral surface (13 methods)
- [x] Add `NotificationModuleRuntimeContribution` interface with `start()` / `stop()`
- [x] Convert 164-line `initialization.ts` event bus wiring to runtime contribution
- [x] Preserve `reminder:triggered` -> notification dispatch wiring
- [x] Preserve `schedule:task:executed` -> notification dispatch wiring
- [x] Add `createNotificationUseCases()` pure assembly helper
- [x] Switch API entrypoint to the factory
- [x] Switch Electron/IPC entrypoint to the factory
- [x] Add shared `createNotificationTransportHandlers()` mapping layer
- [x] Add `createNotificationPowerSyncModule()` convenience factory
- [x] Export hygiene — layered re-exports in `src/index.ts`
- [x] Mark legacy `NotificationContainer` as `@deprecated`
- [ ] Delete legacy `NotificationContainer` singleton
- [ ] Delete legacy `NotificationRepositoryFactory`
- [ ] Clean up client singleton proxy (`notificationApplicationService`)
- [ ] Add `createNotificationClientService(adapter)` factory
- [ ] Replace stub `api` methods with full domain service delegation
- [x] Update docs (COMPOSITION_ROOT.md, REFACTOR_PLAYBOOK.md)

## Success Criteria

A module is considered fully migrated when:

- There is one obvious composition root (`createNotificationModule`)
- Transport only chooses adapters and forwards to `module.api`
- Lifecycle is explicit via `start()` / `dispose()`
- Cross-module event wiring is scoped to runtime contribution lifecycle (no dangling listeners)
- No singleton container is needed for normal runtime usage
- Client service returns `Result<T>` without throwing
- Exports are layered: Contracts -> Domain -> Application -> Infrastructure
