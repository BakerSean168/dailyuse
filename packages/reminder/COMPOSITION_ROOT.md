# Reminder Composition Root

`@dailyuse/reminder` has been migrated to the governance reference pattern.
This was a **HIGH complexity** migration — the original `api/module.ts` was 368 lines
with inline domain logic, and the Electron entry duplicated API assembly logic.

## Key Code Locations

| File                                                          | Purpose                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/infrastructure-server/reminder.module.ts`                | Composition root (`createReminderModule`)                   |
| `src/infrastructure-server/powersync.ts`                      | PowerSync adapter factory (`createReminderPowerSyncModule`) |
| `src/api/module.ts`                                           | API transport assembly (Prisma adapters)                    |
| `src/api/runtime.ts`                                          | Runtime contribution contract / wrapper                     |
| `src/infrastructure-server/cron/reminder-trigger-cron-job.ts` | Real cron-based runtime contribution                        |
| `src/api/transport-handlers.ts`                               | Transport mapping layer                                     |
| `src/electron-entry/index.ts`                                 | Electron / IPC transport assembly (PowerSync adapters)      |
| `src/application-client/index.ts`                             | Client service facade                                       |

## Migration Summary

- `createReminderModule(deps)` replaced inline assembly that was scattered across `api/module.ts` and `electron-entry/index.ts`
- 368 lines of inline domain logic in the old `api/module.ts` extracted to `ReminderApplicationPort` inside the composition root
- Old global initialization converted to `start()` / `dispose()` lifecycle
- Cron scanning now runs through `createReminderTriggerCronJob(...)` and is injected into the module lifecycle
- Transport only consumes `module.api` — both API and Electron share the same `ReminderApplicationPort`
- Prisma adapters selected in `api/module.ts`; PowerSync adapters selected in `powersync.ts` / `electron-entry/index.ts`
- Legacy container has been removed from runtime code paths
- Client singleton proxy has been removed

## Correspondence With Governance

| Reminder                            | Governance                             |
| ----------------------------------- | -------------------------------------- |
| `createReminderModule`              | `createGovernanceModule`               |
| `createReminderPowerSyncModule`     | _(governance has no PowerSync layer)_  |
| `ReminderApplicationPort`           | `GovernanceApplicationPort`            |
| `ReminderModuleDependencies`        | `GovernanceModuleDependencies`         |
| `ReminderModuleInstance`            | `GovernanceModuleInstance`             |
| `createReminderRuntimeContribution` | `createGovernanceRuntimeContribution`  |
| `createReminderTransportHandlers`   | `createGovernanceTransportHandlers`    |
| `ReminderClientService`             | _(governance has no client layer yet)_ |

## Next Steps

See `REFACTOR_PLAYBOOK.md` for the full migration checklist and pattern reference.
When migrating the next module, use governance's `REFACTOR_PLAYBOOK.md` as the primary reference
and reminder as the high-complexity working example.

Remaining follow-up work:

- Add `ReminderClientPort` and `createReminderClientService` factory (like setting module)
