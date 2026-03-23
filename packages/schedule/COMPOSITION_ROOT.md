# Schedule Composition Root

`@dailyuse/schedule` has been migrated to the governance reference pattern.

## Key Code Locations

| File                                           | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `src/infrastructure-server/schedule.module.ts` | Composition root (`createScheduleModule`)                    |
| `src/infrastructure-server/powersync.ts`       | PowerSync composition root (`createSchedulePowerSyncModule`) |
| `src/api/module.ts`                            | API transport assembly (`ScheduleApiModule`)                 |
| `src/api/runtime.ts`                           | Runtime contribution (lifecycle side-effects)                |
| `src/api/transport-handlers.ts`                | Transport mapping layer                                      |
| `src/electron-entry/index.ts`                  | Electron / IPC transport assembly                            |

## Migration Summary

- `createScheduleModule(deps)` is now the single composition root for the server runtime
  （`createScheduleModule(deps)` 现为服务端运行时的唯一组合根）
- Old `InitializationManager` global hooks replaced by `ScheduleModuleRuntimeContribution` with explicit `start()` / `stop()`
  （旧的全局 `InitializationManager` 钩子已被显式的 `start()` / `stop()` 运行时贡献取代）
- `createScheduleRuntimeContribution()` now owns queue loading, due-task execution, and task lifecycle subscriptions
  （`createScheduleRuntimeContribution()` 现在负责队列加载、到期执行和任务生命周期订阅）
- `src/api/initialization.ts` deprecated — kept only for backward compatibility
  （`initialization.ts` 已标记 `@deprecated`，仅保留用于向后兼容）
- Transport layer (`routes`, `transport-handlers`) only consumes `module.api`, never directly constructs repositories or use cases
  （传输层只消费 `module.api`，不再直接构造仓储或 use case）
- Prisma adapters selected in API module; PowerSync adapters selected in Electron entry
  （API 模块选择 Prisma 适配器；Electron 入口选择 PowerSync 适配器）

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
| `createScheduleUseCases`            | _(no separate helper in governance)_  |
| `createSchedulePowerSyncModule`     | `createGovernancePowerSyncModule`     |

## Next Steps

See `REFACTOR_PLAYBOOK.md` for the full migration checklist and pattern reference.
When migrating the next module, use governance's `REFACTOR_PLAYBOOK.md` as the primary reference
and schedule / setting as working examples.
