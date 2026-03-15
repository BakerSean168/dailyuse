# Governance Refactor Playbook

Use this file as the quickest map when migrating another module to the new pattern.

## Read Order

1. `packages/governance/src/infrastructure-server/governance.module.ts`
   - the canonical `createXModule(deps)` shape
   - shows dependency object, transport-neutral `api`, and lifecycle ownership
2. `packages/governance/src/api/module.ts`
   - shows how API transport chooses concrete adapters and creates the module
3. `packages/governance/src/api/runtime.ts`
   - shows how old global initialization becomes module-owned runtime contribution
4. `packages/governance/src/api/transport-handlers.ts`
   - shows the thin transport mapping layer
5. `packages/governance/src/electron-entry/index.ts`
   - shows the same module reused from a second transport

## What To Copy

### 1. Composition Root Shape

Copy the pattern from `packages/governance/src/infrastructure-server/governance.module.ts`:

```ts
export interface XModuleDependencies {
  readonly repoA: RepoAPort;
  readonly repoB: RepoBPort;
  readonly runtimeContributions?: XRuntimeContribution | readonly XRuntimeContribution[];
}

export interface XApplicationPort {
  doThing(input: Input, cx: ExecutionContext): Promise<Result<Output>>;
}

export function createXModule(deps: XModuleDependencies): XModuleInstance {
  // assemble once
}
```

### 2. API Module Shape

Copy the pattern from `packages/governance/src/api/module.ts`:

- outer app selects Prisma adapters
- outer app passes runtime contributions explicitly
- transport consumes `module.api`
- `destroy()` calls `module.dispose()`

### 3. Runtime Contribution Shape

Copy the pattern from `packages/governance/src/api/runtime.ts`:

- replace global initialization task registration
- create a small object with `start()` / `stop()`
- make repeated start/stop calls safe

### 4. Transport Mapping Shape

Copy the pattern from `packages/governance/src/api/transport-handlers.ts`:

- transport mapping should be boring
- do not instantiate repositories or use cases here
- if `api` already matches the controller port, the mapper can stay tiny

## What To Delete During Migration

- singleton DI container exports
- `Container.getInstance().reset()` cleanup logic
- global initialization registration helpers
- transport-owned business orchestration
- class facades that only wrap the factory API

## Migration Checklist

- add `createXModule(deps)`
- add `XApplicationPort`
- add optional runtime contribution support
- switch API entrypoint to the factory
- switch Electron/IPC entrypoint to the factory
- delete container usage from module internals
- update docs/examples to point at the factory

## Success Criteria

A module is considered migrated when:

- there is one obvious composition root
- transport only chooses adapters and forwards to `module.api`
- lifecycle is explicit via `start()` / `dispose()`
- no singleton container is needed for normal runtime usage
