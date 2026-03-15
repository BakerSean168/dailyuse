# Notification Composition Root

`@dailyuse/notification` has been migrated to the governance reference pattern.

## Key Code Locations

| File                                                    | Purpose                                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `src/infrastructure-server/notification.module.ts`      | Composition root (`createNotificationModule`)        |
| `src/api/module.ts`                                     | API transport assembly (Express)                     |
| `src/api/runtime.ts`                                    | Runtime contribution (cross-module event bus wiring) |
| `src/api/transport-handlers.ts`                         | Transport mapping layer                              |
| `src/electron-entry/index.ts`                           | Electron / IPC transport assembly                    |
| `src/infrastructure-server/powersync.ts`                | PowerSync convenience factory                        |
| `src/application-client/notification-client-service.ts` | Client service facade                                |

## Migration Summary

- `createNotificationModule(deps)` replaced `NotificationContainer`
- Old 164-line `initialization.ts` (event bus wiring for `reminder:triggered` and `schedule:task:executed`) converted to `createNotificationRuntimeContribution()` with explicit `start()` / `stop()` lifecycle
- Transport only consumes `module.api` via `NotificationApplicationPort`
- Prisma adapters selected at API transport; PowerSync adapters selected at Electron transport
- Three repository ports: `INotificationRepository`, `INotificationPreferenceRepository`, `INotificationTemplateRepository`
- Five assembled use cases: `CreateNotification`, `MarkNotificationAsRead`, `GetUserNotifications`, `GetUnreadNotifications`, `GetNotificationPreference`
- `NotificationContainer` still exported but marked `@deprecated`
- Client-side singleton proxy (`notificationApplicationService`) still present — not yet cleaned up

## Correspondence With Governance

| Notification                            | Governance                            |
| --------------------------------------- | ------------------------------------- |
| `createNotificationModule`              | `createGovernanceModule`              |
| `NotificationApplicationPort`           | `GovernanceApplicationPort`           |
| `NotificationModuleDependencies`        | `GovernanceModuleDependencies`        |
| `NotificationModuleInstance`            | `GovernanceModuleInstance`            |
| `createNotificationRuntimeContribution` | `createGovernanceRuntimeContribution` |
| `createNotificationTransportHandlers`   | `createGovernanceTransportHandlers`   |
| `NotificationClientService`             | _(no client layer in governance yet)_ |

## Next Steps

- Remove deprecated `NotificationContainer` and `NotificationRepositoryFactory` once all callers are updated
- Clean up client-side singleton proxy (`notificationApplicationService` / `setNotificationApplicationService`)
- Add `createNotificationClientService(adapter)` factory (similar to setting's `createSettingClientService`)
- Some `NotificationApplicationPort` methods still return stub data — implement full domain service delegation

See `REFACTOR_PLAYBOOK.md` for the full migration checklist and pattern reference.
