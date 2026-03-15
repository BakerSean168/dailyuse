# Repository Composition Root

`@dailyuse/repository` is a HIGH-complexity module migrated to the governance reference pattern.
It was the largest manual transport surface in the codebase — the original `api/module.ts` was
397 lines of inline use-case instantiation and handler wiring, now replaced by a clean 3-step
composition root pattern.

## Key Code Locations

| File                                             | Purpose                                           |
| ------------------------------------------------ | ------------------------------------------------- |
| `src/infrastructure-server/repository.module.ts` | Composition root (`createRepositoryModule`)       |
| `src/api/module.ts`                              | API transport assembly (123 lines, down from 397) |
| `src/api/runtime.ts`                             | Runtime contribution (lifecycle side-effects)     |
| `src/api/transport-handlers.ts`                  | Transport mapping layer (direct pass-through)     |
| `src/api/routes/index.ts`                        | Route registration (split across 3 route files)   |
| `src/electron-entry/index.ts`                    | Electron / IPC transport assembly                 |
| `src/application-client/index.ts`                | Client service facade + port types                |

## Migration Summary

- `createRepositoryModule(deps)` replaced `RepositoryContainer` singleton
- Old global `InitializationManager` registration converted to `start()` / `dispose()` lifecycle
- All 25 use cases assembled once in `createRepositoryUseCases()` helper
- `RepositoryApplicationPort` provides 25+ transport-neutral methods across 4 domains:
  Repository CRUD, Resource CRUD, Folder CRUD, Bookmark CRUD
- Transport only consumes `module.api` — no use-case instantiation in route layer
- Prisma adapters selected at the API transport edge; PowerSync at the Electron edge
- `RepositoryModule` class retained as `@deprecated` facade for backward compatibility
  with `RepositoryPowerSyncModule` and the Electron entry
- Transport handler mapping is a direct pass-through (`api` structurally equals `RepositoryUseCases`)
- Client exports `RepositoryClientService` with `IRepositoryApiClient` port

## Correspondence With Governance

| Repository                            | Governance                            |
| ------------------------------------- | ------------------------------------- |
| `createRepositoryModule`              | `createGovernanceModule`              |
| `RepositoryApplicationPort`           | `GovernanceApplicationPort`           |
| `RepositoryModuleDependencies`        | `GovernanceModuleDependencies`        |
| `RepositoryModuleInstance`            | `GovernanceModuleInstance`            |
| `RepositoryModuleUseCases`            | _(governance keeps use cases inline)_ |
| `createRepositoryUseCases`            | _(governance assembles inline)_       |
| `createRepositoryRuntimeContribution` | `createGovernanceRuntimeContribution` |
| `createRepositoryTransportHandlers`   | `createGovernanceTransportHandlers`   |
| `RepositoryClientService`             | _(no client layer in governance yet)_ |

## Next Steps

See `REFACTOR_PLAYBOOK.md` for the full migration checklist, read order, and pattern reference.
When migrating the next module, use governance's `REFACTOR_PLAYBOOK.md` as the primary reference
and repository as the high-complexity worked example.
