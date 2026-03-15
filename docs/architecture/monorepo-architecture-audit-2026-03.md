# Monorepo Architecture Audit (2026-03)

## Scope

This audit reviews:

- business modules: `account`, `authentication`, `goal`, `governance`, `reminder`, `repository`, `setting`, `task`, `schedule`, `notification`, `ai`, `editor`
- shared and infrastructure packages: `contracts`, `domain-shared`, `database`, `utils`, `patterns`, `scheduler-server`, `http-client`, `ipc-client`, `test-utils`

The goal is to judge how close the repo is to a clean, repeatable module architecture, with `@dailyuse/governance` as the reference module.

## Executive Summary

The repo already has the right high-level instinct: most business code is organized as bounded-context packages with clear domain, application, infrastructure, and transport folders.

The main architectural problem is not layering, but inconsistency in runtime composition.

Current dominant smells:

- multiple dependency injection styles coexist
- singleton containers are widely used as service locators
- initialization and event subscription are side-effectful and globally registered
- some API modules still perform application orchestration directly
- cross-cutting concerns are split awkwardly across `utils`, `patterns`, and `contracts`

Current best reference:

- `packages/governance/src/infrastructure-server/governance.module.ts`

That file is now the clearest local example of the target direction: explicit dependencies, one composition root, no hidden container lookups.

## Current State by Package Group

### 1. Business Modules

#### Governance

Status: best current reference, but not yet final form.

Strengths:

- explicit composition root in `packages/governance/src/infrastructure-server/governance.module.ts`
- transport mapping kept thinner in `packages/governance/src/api/module.ts`
- shared controller across HTTP and IPC in `packages/governance/src/controllers/governance.controller.ts`
- docs are intentionally used as living architecture material

Remaining issues:

- initialization is still global and side-effectful in `packages/governance/src/api/initialization.ts`
- legacy container still exists in `packages/governance/src/infrastructure-server/di/governance-container.ts`
- HTTP and Electron still duplicate some transport mapping
- controller still performs regex-based business error normalization

Verdict:

- closest to the desired end-state
- should remain the practice module for migration

#### Account / Goal / Setting / Task

Status: easiest migration group.

Strengths:

- package boundaries are mostly clean
- use-cases already exist
- repository ports are already explicit enough

Smells:

- custom singleton containers are still central to runtime composition
- composition roots are split between API modules and module classes
- lifecycle concerns are not instance-owned

Verdict:

- good candidates for the first wave after governance

#### Authentication

Status: structurally mature, composition still mixed.

Strengths:

- already works with explicit runtime dependencies such as token providers and adapters
- more realistic integration boundaries than simpler modules

Smells:

- mixes explicit DI, factory selection, container storage, and event bus adaptation
- runtime config and integration logic leak into transport/module assembly

Verdict:

- needs refactor, but after the simpler modules

#### Reminder / Repository / Editor

Status: transport-heavy modules.

Strengths:

- domain and infrastructure pieces exist
- they already model real business workflows

Smells:

- API modules are too fat
- orchestration logic still lives in transport layer
- some domain mutation or service composition happens directly in API modules

Verdict:

- these need application-layer extraction more than DI cleanup alone

#### Schedule / Notification

Status: cross-module integration hubs.

Strengths:

- clear integration responsibility
- runtime concerns are visible rather than hidden in UI code

Smells:

- static publisher/global config patterns exist
- cross-module reactions are registered from initialization files rather than instance-owned runtime contributions
- they blur the line between domain module and integration runtime

Verdict:

- these should be refactored together with event bus and runtime lifecycle redesign

#### AI

Status: strategically important but architecturally fragile.

Strengths:

- external gateway boundaries are visible
- app-level adapters are already being injected in some places

Smells:

- partial placeholder wiring such as `null` collaborators
- runtime composition is split across package module code and app code
- knowledge/persistence orchestration is not yet fully normalized as ports

Verdict:

- should migrate after runtime and messaging patterns stabilize

### 2. Shared and Infrastructure Packages

#### Contracts

Status: correct core home for protocol-neutral contracts.

Keep here:

- DTOs
- schemas
- event maps
- RPC maps
- `Result` and protocol-neutral result helpers

Issues:

- not all runtime protocols appear to be generated from, or fully aligned with, the contract maps
- some compatibility layers still duplicate older response formats

Verdict:

- should remain authoritative for `Result` and protocol contracts

#### Domain-Shared

Status: conceptually useful, naming is overloaded.

Issue:

- the workspace has both a top-level `domain-shared` package and per-module `domain-shared` folders, which is conceptually confusing

Verdict:

- keep the concept, but treat the top-level package as a true shared kernel only

#### Database

Status: good infrastructure package.

Verdict:

- should stay infra-specific
- should not move into `patterns`

#### Utils

Status: overloaded grab-bag.

Currently contains too many architectural concerns:

- logging
- event bus
- initialization manager
- result re-exports
- DDD/domain helpers

Main issue:

- runtime and architecture-kernel concerns are mixed with plain utilities

Verdict:

- should be slimmed down to generic utilities only

#### Patterns

Status: good direction, under-defined boundary.

Good fit here:

- pure interfaces
- base abstractions
- framework-agnostic architectural helpers

Bad fit here:

- singletons
- concrete event bus runtime
- initialization manager
- Prisma/PowerSync-specific factories

Verdict:

- should become the pure architectural abstraction package, not a runtime package

#### Scheduler-Server / HTTP-Client / IPC-Client / Test-Utils

Verdict:

- `scheduler-server` should remain an infra engine package
- `http-client` and `ipc-client` are already clean transport packages and should stay separate
- `test-utils` is useful, but should gradually separate generic helpers from module-specific fixtures

## Cross-Cutting Findings

### Dependency Injection

Current state:

- explicit constructor injection in some newer code
- singleton container registration in many modules
- factory selection in several infrastructure roots
- static runtime configuration in schedule-related code

Problem:

- the repo has no single, enforced module composition model

### Initialization and Lifecycle

Current state:

- initialization is usually a side-effect registration function
- shutdown/disposal is often incomplete or asymmetric

Problem:

- lifecycle is not owned by module instances
- module registration is not reliably idempotent

### Event Bus

Current state:

- concrete event bus and global registration live in `utils`
- several modules wire listeners through initialization files

Problem:

- event subscriptions are global and hidden
- cross-module integration logic sits in package-local init code instead of a dedicated integration/runtime layer

### Result Pattern

Current state:

- concept is strong and worth keeping
- authoritative home should be `contracts`
- some older wrappers and re-exports still cause conceptual duplication

Problem:

- `Result` is architecture-level, not a utility concern

## Bottom Line

The repo does not need a brand-new architecture. It needs convergence.

The key move is to standardize all business modules on the same runtime composition template that governance now approximates:

- one composition root per module
- explicit dependency object
- thin transport adapters
- no singleton service locators
- lifecycle owned by module instances or runtime contributions

The second key move is to split cross-cutting concerns cleanly:

- `contracts`: result + protocol contracts
- `patterns`: pure abstractions only
- new runtime package: lifecycle/bootstrap concerns
- new messaging package: event bus implementations and integration wiring
- `utils`: plain utilities only
