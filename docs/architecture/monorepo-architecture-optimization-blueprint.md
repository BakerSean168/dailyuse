# Monorepo Architecture Optimization Blueprint

## Goal

Define the most elegant architecture this repo should converge toward, using `@dailyuse/governance` as the practice module.

This blueprint is intentionally pragmatic:

- preserve the existing package-per-bounded-context model
- standardize composition and lifecycle patterns
- move shared runtime concerns into better homes
- migrate incrementally, not with a big-bang rewrite

## Guiding Principles

### 1. One Module, One Composition Root

Every business package should expose one primary server-side assembly API.

Preferred shape:

```ts
export interface GovernanceModuleDeps {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
  readonly eventPublisher?: DomainEventPublisher;
}

export function createGovernanceModule(deps: GovernanceModuleDeps) {
  const useCases = {
    createRule: new CreateRuleUseCase(deps.ruleRepository, deps.revisionRepository),
    getRule: new GetRuleUseCase(deps.ruleRepository),
  };

  return {
    ...useCases,
    async start() {},
    async stop() {},
  };
}
```

Rules:

- no `Container.getInstance()`
- no hidden `resolve()` call chain
- no `null` placeholders for dependencies
- no static `.configure(...)` patterns for runtime collaborators

### 2. The App Chooses Adapters; the Module Assembles Use-Cases

Boundary rule:

- app/bootstrap layer chooses Prisma, PowerSync, filesystem, HTTP gateway, scheduler engine
- module composition root accepts already-chosen ports/adapters
- controller/routes only map transport input to application calls

This means:

- transport may instantiate concrete adapters at the outermost edge
- transport may not own business orchestration

### 3. Lifecycle Is Explicit

All runtime-owned side effects must have a reversible lifecycle.

Preferred shape:

```ts
export interface ModuleRuntimeContribution {
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

Examples of side effects that must become lifecycle-owned:

- event subscriptions
- scheduler registrations
- initialization hooks
- background jobs
- file watchers

### 4. Cross-Cutting Abstractions and Runtime Implementations Must Be Split

Do not mix ports with singletons.

- abstraction belongs in `patterns`
- protocol contract belongs in `contracts`
- concrete runtime implementation belongs in `runtime`, `messaging`, or another infra package

## Package Taxonomy Target

The physical layout can stay under `packages/*`, but conceptually the repo should converge to this taxonomy.

### Business Modules

- `account`
- `authentication`
- `goal`
- `governance`
- `reminder`
- `repository`
- `setting`
- `task`
- `schedule`
- `notification`
- `ai`
- `editor`

### Shared Contracts

- `contracts`

Owns:

- DTOs
- schemas
- protocol maps
- event maps
- RPC maps
- `Result`

### Shared Kernel

- `domain-shared` (conceptually a shared kernel package)

Owns only truly cross-module primitives.

### Pure Architecture Patterns

- `patterns`

Owns:

- base abstractions
- ports and helpers for composition
- generic repository and mapper contracts
- event publisher/subscriber ports
- scheduler abstractions that are framework-agnostic

Must not own:

- global singleton runtime state
- initialization manager implementations
- concrete event buses
- database-specific factories

### Runtime Packages

Introduce conceptually new homes:

- `runtime` for lifecycle, app bootstrap, module contribution orchestration
- `messaging` for in-memory event bus, typed dispatch, outbox-ready messaging runtime

These can start as new packages or as a staged extraction from `utils`.

### Infrastructure / Transport Packages

- `database`
- `scheduler-server`
- `http-client`
- `ipc-client`
- `test-utils`

## Governance as the Practice Module

Governance should remain the reference bounded context because it is already closest to the target shape.

### Governance End-State

#### Composition Root

Keep `packages/governance/src/infrastructure-server/governance.module.ts` as the authoritative assembly point, but evolve it toward a factory-style module API:

- `createGovernanceModule(deps)` as the primary public API
- optional thin class facade only if it adds clear value

#### Transport Mapping

Extract a shared handler mapper once:

```ts
export function createGovernanceTransportHandlers(module: GovernanceModuleRuntime) {
  return {
    createRule: (req, ctx) => module.createRule.execute(req, ctx),
    getRule: (req) => module.getRule.execute(req),
  };
}
```

Then both:

- `packages/governance/src/api/module.ts`
- `packages/governance/src/electron-entry/index.ts`

should consume the same mapper instead of duplicating it.

#### Initialization

Replace `registerGovernanceInitializationTasks()` with instance-owned contributions.

Preferred direction:

```ts
const module = createGovernanceModule(deps);

await module.start();
// registers listeners/jobs

await module.stop();
// unregisters listeners/jobs
```

or, if bootstrap owns orchestration:

```ts
const module = createGovernanceModule(deps);
runtime.register(module.runtime);
```

#### Error Taxonomy

Move business semantics below controller level.

Current controller regex normalization should be replaced by:

- canonical business error codes
- optional typed details in `Result.error.details`

That keeps transport thin and predictable.

## The Most Elegant Injection Scheme for This Repo

### Standard Template

```ts
export interface XModuleDeps {
  readonly repoA: RepoAPort;
  readonly repoB: RepoBPort;
  readonly eventPublisher?: DomainEventPublisher;
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
}

export interface XModuleRuntime {
  readonly useCases: {
    readonly createX: CreateXUseCase;
    readonly getX: GetXUseCase;
  };
  readonly runtime?: ModuleRuntimeContribution;
  dispose(): Promise<void> | void;
}

export function createXModule(deps: XModuleDeps): XModuleRuntime {
  const useCases = {
    createX: new CreateXUseCase(deps.repoA, deps.eventPublisher),
    getX: new GetXUseCase(deps.repoA),
  };

  return {
    useCases,
    runtime: undefined,
    dispose() {},
  };
}
```

### Why This Is Better Than Containers

- all dependencies are visible at the edge
- module tests can inject fakes without container resets
- lifecycle can be managed per instance
- app bootstrap can compose modules deterministically
- there is no hidden mutable global state

## Initialization Pattern

### Current Problem

Initialization currently tends to be:

- globally registered
- string-name based
- side-effectful at import/register time
- only partially reversible

### Target Pattern

Initialization should become runtime contributions returned by modules or integrations.

Recommended interfaces:

```ts
export interface RuntimeContribution {
  readonly name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface RuntimeRegistry {
  register(contribution: RuntimeContribution): void;
  startAll(): Promise<void>;
  stopAll(): Promise<void>;
}
```

Placement:

- implementation belongs in a dedicated runtime package
- not in `patterns`
- not in `utils`

## Event Bus Pattern

### Decision

Yes, the event bus should be abstracted more cleanly, but not by moving the concrete singleton into `patterns`.

### Correct Split

#### `contracts`

Owns:

- event payload types
- event maps

#### `patterns`

Owns:

- `DomainEventPublisher`
- `DomainEventSubscriber`
- `EventHandler` signatures

Example:

```ts
export interface DomainEventPublisher {
  publish<TEvent>(event: TEvent): Promise<void>;
}

export interface EventSubscriber<TName extends string, TPayload> {
  subscribe(name: TName, handler: (payload: TPayload) => Promise<void> | void): Unsubscribe;
}
```

#### `messaging`

Owns:

- in-memory event bus implementation
- typed bus adapters
- integration dispatch runtime
- future outbox support

### Migration Rule

Business modules should depend on publisher/subscriber ports, not the global bus singleton.

Cross-module reactions should move out of package-local init files into dedicated integration runtime registrations.

## Result Pattern Placement

### Decision

`Result` should stay in `contracts`, not in `patterns`, not in `utils`.

Reason:

- `Result` is a protocol-neutral contract type, shared across domain, application, HTTP, IPC, and UI clients
- it defines a cross-boundary semantic contract, not a design-pattern helper

### Correct Split

#### `contracts`

Owns:

- `Result<T>`
- `ResultError`
- canonical error codes
- protocol adapters like IPC/HTTP result envelopes if kept lightweight

#### `utils`

Should only temporarily re-export during migration.

Target state:

- new code imports from `@dailyuse/contracts/result`
- old `@dailyuse/utils/result` becomes deprecated compatibility only

## What Should Move Out of `utils`

Move out:

- event bus implementation
- initialization manager/runtime orchestration
- domain base abstractions if they are architectural rather than utility-like
- result re-export surface

Keep in `utils`:

- logging helpers
- date/time helpers
- plain string/object/array helpers
- frontend convenience helpers

## What Should Move Into `patterns`

Move in only if framework-agnostic and runtime-free:

- module factory helper types
- repository base abstractions
- mapper interfaces
- event publisher/subscriber ports
- unit-of-work or outbox ports
- scheduler interfaces and simple in-memory data structures

Do not move in:

- app bootstrap logic
- concrete event bus runtime
- initialization registry implementation
- concrete persistence factories

## Migration Sequence

### Phase 1: Freeze the Standard

- declare governance the reference module
- document the standard module template
- ban new singleton containers in new code

### Phase 2: Extract Runtime and Messaging

- create a dedicated runtime package from `utils` initialization logic
- create a dedicated messaging package from `utils` event bus logic
- mark utility re-exports deprecated

### Phase 3: Migrate Simple Modules

- `setting`
- `account`
- `goal`
- `task`

Pattern:

- replace container-backed modules with `createModule(deps)`
- keep transport thin

### Phase 4: Migrate Transport-Heavy Modules

- `reminder`
- `repository`
- `editor`

Pattern:

- move orchestration into application/module layer first
- then normalize composition root

### Phase 5: Migrate Integration Hubs

- `schedule`
- `notification`

Pattern:

- replace static publisher/configuration with explicit event ports and runtime-owned contributions

### Phase 6: Migrate Advanced Integrations

- `authentication`
- `ai`

Pattern:

- make every runtime collaborator explicit
- remove `null` placeholder wiring

### Phase 7: Remove Legacy Compatibility

- delete old containers once no callers remain
- remove duplicate response wrappers
- shrink `utils` to true utilities

## Governance-Specific Next Moves

To make governance the fully finished reference implementation, the next cleanup should be:

1. replace global initialization registration with instance-owned runtime contribution
2. extract one shared transport handler mapper for HTTP and Electron
3. remove or internalize the legacy governance container
4. align protocol maps with real runtime channels
5. push business error semantics fully below controller layer

## Final Target State

The repo reaches its most elegant form when these statements are true:

- every business module has one explicit composition root
- no module needs a singleton service locator
- side effects are owned by runtime contributions with start/stop symmetry
- transport adapters are thin and dumb
- cross-module integration is handled by messaging/runtime, not by ad-hoc init files
- `contracts` is the single source of truth for result and protocol contracts
- `patterns` contains only pure reusable abstractions
- `utils` contains only actual utilities
