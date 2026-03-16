# Module Optimization Scope

This document defines the full optimization scope for each business module migration.

The goal is not only to replace server-side DI containers. A module is considered
fully migrated only when its server runtime, client surface, contracts, exports,
and docs all converge on the same architecture pattern.

`@dailyuse/governance` is the current reference implementation.

## What We Did So Far

### Governance

`governance` is now the reference module for the monorepo.

- composition root: `packages/governance/src/infrastructure-server/governance.module.ts`
- API transport assembly: `packages/governance/src/api/module.ts`
- runtime lifecycle: `packages/governance/src/api/runtime.ts`
- transport mapper: `packages/governance/src/api/transport-handlers.ts`
- Electron wiring: `packages/governance/src/electron-entry/index.ts`
- thin docs: `packages/governance/COMPOSITION_ROOT.md`
- migration guide: `packages/governance/REFACTOR_PLAYBOOK.md`

### Setting

`setting` has been migrated mainly on the server/runtime side.

- composition root: `packages/setting/src/infrastructure-server/setting.module.ts`
- API transport assembly: `packages/setting/src/api/module.ts`
- runtime lifecycle: `packages/setting/src/api/runtime.ts`
- transport mapper: `packages/setting/src/api/transport-handlers.ts`
- Electron wiring: `packages/setting/src/electron-entry/index.ts`
- thin docs: `packages/setting/COMPOSITION_ROOT.md`

Remaining work still includes client-side service style, contract/result consistency,
export cleanup, and legacy container retirement.

### Account

`account` has started the same migration.

- composition root: `packages/account/src/infrastructure-server/account.module.ts`
- API transport assembly: `packages/account/src/api/module.ts`
- transport mapper: `packages/account/src/api/transport-handlers.ts`
- event runtime contribution: `packages/account/src/application-server/handlers/register-account-event-listeners.ts`
- Electron wiring: `packages/account/src/electron-entry/index.ts`
- thin docs: `packages/account/COMPOSITION_ROOT.md`

It still needs the same full-scope follow-up as `setting`.

## Full Optimization Surfaces

Every module migration must cover all six surfaces below.

### 1. Server Composition Root / DI

Target:

- `createXModule(deps)` as the single obvious server entrypoint
- explicit dependency object
- optional `runtimeContributions`
- no service locator / singleton container for normal runtime usage

Governance examples:

- `packages/governance/src/infrastructure-server/governance.module.ts`
- `packages/governance/src/infrastructure-server/powersync.ts`

### 2. Runtime Lifecycle / Initialization / Event Subscriptions

Target:

- old global initialization registration replaced with instance-owned `start()` / `dispose()`
- event subscriptions, cron jobs, and background work become runtime contributions
- repeated `start()` / `dispose()` calls should be safe

Governance examples:

- `packages/governance/src/api/runtime.ts`
- `packages/governance/src/infrastructure-server/governance.module.ts`

### 3. API / Electron / IPC Transport Wiring

Target:

- transport chooses concrete adapters only at the edge
- transport consumes `module.api`
- transport mapping is thin and boring
- controllers remain validation/protocol boundaries, not dependency composition roots

Governance examples:

- `packages/governance/src/api/module.ts`
- `packages/governance/src/api/transport-handlers.ts`
- `packages/governance/src/electron-entry/index.ts`

### 4. Client Application Service / Client Adapters

Target:

- consistent client service style across modules
- no ad-hoc singleton proxies or throw-heavy compatibility wrappers unless explicitly intentional
- HTTP and IPC adapters expose the same semantic API
- decide module by module whether client services return DTOs, domain objects, or `Result` wrappers

Governance examples:

- `packages/governance/src/application-client/services/governance-client-service.ts`
- `packages/governance/src/infrastructure-client/adapters/http/rule-http.adapter.ts`
- `packages/governance/src/infrastructure-client/adapters/ipc/rule-ipc.adapter.ts`

### 5. Contracts / Protocol Maps / Result Usage

Target:

- DTOs, RPC maps, event maps, and error semantics stay consistent with runtime code
- client and server should agree on `Result` and error code behavior
- protocol maps must not drift away from real handlers

Governance examples:

- `packages/governance/src/contracts/protocol/governance-rpc-map.ts`
- `packages/governance/src/contracts/protocol/governance-event-map.ts`
- `packages/governance/src/controllers/governance.controller.ts`

### 6. Public Exports / Thin Docs / Refactor Guidance

Target:

- root exports expose stable entrypoints, not every internal helper by default
- every migrated module has a short composition-root doc
- governance remains the canonical code sample set

Governance examples:

- `packages/governance/src/index.ts`
- `packages/governance/README.md`
- `packages/governance/COMPOSITION_ROOT.md`
- `packages/governance/REFACTOR_PLAYBOOK.md`

## Module-by-Module Scope

### Governance

Status: reference implementation.

Still worth polishing:

- settle final policy for protocol-map placement
- continue tightening exports if desired
- keep docs in sync with the now-finished pattern

### Setting

Needs follow-up in addition to server DI work:

- client service cleanup in `packages/setting/src/application-client/index.ts`
- contract/protocol/result consistency review across `packages/contracts/src/modules/setting`
- legacy container cleanup in `packages/setting/src/infrastructure-server/di/setting-container.ts`
- export and README hygiene

### Account

Needs follow-up in addition to server DI work:

- client application service and adapter style review
- error/result consistency across controller and transport wrappers
- legacy container cleanup in `packages/account/src/infrastructure-server/di/account-container.ts`
- export and README hygiene

### Authentication

Needs full-scope migration:

- server DI and container removal
- initialization/runtime extraction
- API transport alignment
- Electron ownership boundary review
- client-service consistency
- contracts/protocol/result review

### Goal

Needs full-scope migration:

- replace `GoalModule + GoalContainer`
- convert initialization to runtime contribution
- simplify API and Electron transport assembly
- reduce client facade complexity
- review protocol/export consistency

### Task

Needs full-scope migration:

- replace Prisma/PowerSync module duplication
- remove container-backed runtime
- simplify transport assembly
- align client service/result semantics

### Schedule

Needs full-scope migration:

- replace container and static publisher configuration
- move schedule lifecycle into runtime contributions
- align transport and client patterns

### Reminder

Needs full-scope migration:

- replace container-backed module roots
- move cron and initialization side effects into lifecycle-owned runtime contributions
- thin out API/Electron orchestration
- review client/protocol consistency

### Notification

Needs full-scope migration:

- replace container-backed module roots
- move event registration into runtime contributions
- finish application behavior where current services are placeholders
- align client/protocol/export surfaces

### Repository

Needs full-scope migration:

- replace class/factory/container mix
- split large manual transport assembly
- revisit client facade and protocol surface
- ensure docs explain the module-specific complexity

### Editor

Needs full-scope migration:

- introduce explicit composition root
- replace global initialization patterns
- decide whether a first-class client layer should exist
- align protocol/export/docs surface

### AI

Needs full-scope migration:

- replace container-backed server assembly
- make external-provider/runtime collaborators explicit
- review client facade consistency
- review contracts/protocol/error semantics

## Governance Sample Map

Use governance as the lookup table when migrating any module.

- composition root pattern: `packages/governance/src/infrastructure-server/governance.module.ts`
- PowerSync variant pattern: `packages/governance/src/infrastructure-server/powersync.ts`
- API transport assembly: `packages/governance/src/api/module.ts`
- runtime contribution pattern: `packages/governance/src/api/runtime.ts`
- transport mapper pattern: `packages/governance/src/api/transport-handlers.ts`
- controller boundary pattern: `packages/governance/src/controllers/governance.controller.ts`
- Electron assembly pattern: `packages/governance/src/electron-entry/index.ts`
- package export pattern: `packages/governance/src/index.ts`
- thin doc pattern: `packages/governance/COMPOSITION_ROOT.md`
- migration guide pattern: `packages/governance/REFACTOR_PLAYBOOK.md`

## Recommended Execution Order

All modules have been migrated. The execution order was:

1. governance polish/freeze — DONE (reference implementation)
2. setting full-scope follow-up — DONE
3. account full-scope follow-up — DONE
4. authentication — DONE
5. goal — DONE
6. task — DONE
7. schedule — DONE
8. reminder — DONE
9. notification — DONE
10. repository — DONE
11. editor — DONE
12. ai — DONE

See `docs/architecture/module-migration-matrix.md` for the detailed per-module status and remaining cleanup items.
