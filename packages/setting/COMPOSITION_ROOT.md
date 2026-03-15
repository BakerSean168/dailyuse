# Setting Composition Root

`@dailyuse/setting` is the second module migrated to the governance reference pattern.

## Key Code Locations

| File                                          | Purpose                                       |
| --------------------------------------------- | --------------------------------------------- |
| `src/infrastructure-server/setting.module.ts` | Composition root (`createSettingModule`)      |
| `src/api/module.ts`                           | API transport assembly                        |
| `src/api/runtime.ts`                          | Runtime contribution (lifecycle side-effects) |
| `src/api/transport-handlers.ts`               | Transport mapping layer                       |
| `src/electron-entry/index.ts`                 | Electron / IPC transport assembly             |
| `src/application-client/index.ts`             | Client service facade + factory               |

## Migration Summary

- `createSettingModule(deps)` replaced `SettingContainer`
- Old global initialization converted to `start()` / `dispose()` lifecycle
- Transport only consumes `module.api`
- Prisma / PowerSync adapters selected at the transport layer
- Client service returns `Result<T>` without throwing
- Singleton proxy removed

## Correspondence With Governance

| Setting                            | Governance                            |
| ---------------------------------- | ------------------------------------- |
| `createSettingModule`              | `createGovernanceModule`              |
| `createSettingRuntimeContribution` | `createGovernanceRuntimeContribution` |
| `createSettingTransportHandlers`   | `createGovernanceTransportHandlers`   |
| `SettingClientService`             | _(no client layer in governance yet)_ |

## Next Steps

See `REFACTOR_PLAYBOOK.md` for the full migration checklist and pattern reference.
When migrating the next module, use governance's `REFACTOR_PLAYBOOK.md` as the primary reference
and setting as the minimal working example.
