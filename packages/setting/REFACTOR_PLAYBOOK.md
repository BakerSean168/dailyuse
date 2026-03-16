# Setting Refactor Playbook

Use this file as the quickest map when reviewing or extending the setting module migration.

## Read Order

1. `packages/setting/src/infrastructure-server/setting.module.ts`
   - the canonical `createSettingModule(deps)` shape
   - shows dependency object, transport-neutral `api`, and lifecycle ownership
2. `packages/setting/src/api/module.ts`
   - shows how API transport chooses concrete adapters and creates the module
3. `packages/setting/src/api/runtime.ts`
   - shows how old global initialization becomes module-owned runtime contribution
4. `packages/setting/src/api/transport-handlers.ts`
   - shows the thin transport mapping layer
5. `packages/setting/src/electron-entry/index.ts`
   - shows the same module reused from a second transport (IPC)
6. `packages/setting/src/application-client/index.ts`
   - shows the client-side service facade and factory

## What To Copy

### 1. Composition Root Shape

```ts
export interface SettingModuleDependencies {
  readonly userSettingRepository: IUserSettingRepository;
  readonly runtimeContributions?: SettingRuntimeContributionsInput;
}

export interface SettingApplicationPort {
  getUserSetting(identityId: string): Promise<...>;
  patchUserSetting(identityId: string, category: ..., patch: ...): Promise<...>;
  // ...
}

export function createSettingModule(deps: SettingModuleDependencies): SettingModuleInstance {
  // assemble once
}
```

### 2. API Module Shape

- Outer app selects Prisma adapters
- Outer app passes runtime contributions explicitly
- Transport consumes `module.api`
- `destroy()` calls `module.dispose()`

### 3. Runtime Contribution Shape

- Replaces global initialization task registration
- Small object with `start()` / `stop()`
- Repeated start/stop calls are safe (idempotent)

### 4. Transport Mapping Shape

- Transport mapping should be boring
- Does not instantiate repositories or use cases
- If `api` already matches the controller port, the mapper stays tiny

### 5. Client Service Shape

- `SettingClientService` wraps any `ISettingApiClient` (HTTP or IPC adapter)
- Returns `Result<T>` — no throwing, no singleton proxies
- Factory: `createSettingClientService(adapter)`

## What Was Deleted During Migration

- `SettingContainer` singleton DI container (`infrastructure-server/di/setting-container.ts`)
- `settingApplicationService` global singleton proxy (`application-client/index.ts`)
- `setSettingApplicationService` manual initialization helper

## Correspondence With Governance

| Setting                            | Governance                             |
| ---------------------------------- | -------------------------------------- |
| `createSettingModule`              | `createGovernanceModule`               |
| `SettingApplicationPort`           | `GovernanceApplicationPort`            |
| `SettingModuleDependencies`        | `GovernanceModuleDependencies`         |
| `SettingModuleInstance`            | `GovernanceModuleInstance`             |
| `createSettingRuntimeContribution` | `createGovernanceRuntimeContribution`  |
| `createSettingTransportHandlers`   | `createGovernanceTransportHandlers`    |
| `SettingClientService`             | _(governance has no client layer yet)_ |

## Migration Checklist

- [x] Add `createSettingModule(deps)` composition root
- [x] Add `SettingApplicationPort` transport-neutral surface
- [x] Add optional runtime contribution support
- [x] Switch API entrypoint to the factory
- [x] Switch Electron/IPC entrypoint to the factory
- [x] Delete legacy `SettingContainer` singleton
- [x] Clean up client service (remove throw wrappers, singleton proxy)
- [x] Add `SettingClientPort` and `createSettingClientService` factory
- [x] Export hygiene — layered re-exports in `src/index.ts`
- [x] Contract consistency — add missing `dtos` + `domain` barrels
- [x] Update docs (COMPOSITION_ROOT.md, REFACTOR_PLAYBOOK.md)

## Success Criteria

A module is considered fully migrated when:

- There is one obvious composition root (`createSettingModule`)
- Transport only chooses adapters and forwards to `module.api`
- Lifecycle is explicit via `start()` / `dispose()`
- No singleton container is needed for normal runtime usage
- Client service returns `Result<T>` without throwing
- Exports are layered: Contracts → Domain → Application → Infrastructure
