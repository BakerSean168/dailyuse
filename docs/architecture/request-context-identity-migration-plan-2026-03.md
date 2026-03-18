# Request Context Identity Migration Plan (2026-03)

## Scope

This document defines a repo-wide migration plan for current-user business
operations that currently mix two identity sources:

1. authenticated request context
2. client-supplied `identityId` or equivalent fields

The goal is to standardize one rule:

> For current-user operations, public transport requests must not carry actor
> `identityId`. The actor identity comes only from authenticated `Context`.

This plan complements
`docs/architecture/desktop-ipc-system-remediation-plan-2026-03.md`.

## Executive Summary

The `goal` module is moving in the right direction, but it is not yet the final
pattern.

Current situation:

- some modules already inject `identityId` from `Context`
- some modules still expose `identityId` in public request schemas
- some Electron entries still resolve `identityId` from payloads
- some code paths still fall back to hardcoded identities such as
  `local-user`, `api-user`, or `desktop-user`

Recommended target:

- public HTTP and Electron request payloads contain only business data
- authenticated context provides the actor identity
- controllers or transport handlers assemble internal commands/queries that may
  still include `identityId`
- cross-user operations use explicit `targetIdentityId`, not overloaded
  actor `identityId`

## Why This Pattern

For current-user business operations, `identityId` is not business payload.
It is request context.

Keeping actor identity inside public request DTOs causes four problems:

- duplicated validation logic across renderer, HTTP, IPC, controller, and use case
- spoofing or accidental override risk when payload identity diverges from auth identity
- desktop guest/local mode fragility because renderer and main process can disagree
- polluted contracts where request schemas describe transport internals rather than business intent

This pattern is more elegant because it separates:

- who is acting: `Context`
- what they want to do: request payload

## Decision

### Rule 1: Current-user public request DTOs must not include actor identity

For endpoints such as:

- create my goal
- list my task templates
- query my notifications
- patch my settings
- create my AI conversation

the public request schema must not include:

- `identityId`
- `userId`
- `accountId`

when those fields mean "the currently authenticated actor".

### Rule 2: Actor identity comes from `Context`

Actor identity must be resolved from:

- HTTP auth middleware for API routes
- `ctx.auth.requireRequestContext()` or `ctx.auth.requireIdentityId()` for Electron

It must not be resolved from:

- renderer payloads
- query string overrides
- body fields
- hardcoded fallback values

### Rule 3: Internal application queries may still include identity

This migration does not require removing `identityId` from every internal type.

It is acceptable for internal application-layer commands or queries to include
`identityId` if transport code assembles them from `Context`.

Example:

```ts
// Public transport DTO
interface ListGoalsFilters {
  status?: GoalStatus[];
  folderId?: GoalFolderId;
}

// Internal application query
interface ListGoalsQuery {
  identityId: IdentityId;
  status?: GoalStatus[];
  folderId?: GoalFolderId;
}
```

### Rule 4: Cross-user operations must use explicit target identity

If an operation really targets another user, do not reuse the actor identity field.

Use a separate business field such as:

- `targetIdentityId`
- `subjectIdentityId`
- `ownerIdentityId`

and keep actor identity in `Context`.

### Rule 5: Response DTOs, entities, and events may keep `identityId`

This plan applies to public request payloads and transport boundaries.

It does not require removing `identityId` from:

- response DTOs
- aggregate/entity DTOs
- persistence DTOs
- domain events
- internal repository models

## Important Observation

`RouteRegistrar` does not perform runtime validation for `request.query` or
`request.body`. It registers OpenAPI metadata and binds `expressAdapter`, but it
does not automatically enforce the declared request schemas at runtime.

That means some modules currently "look" stricter in OpenAPI than they actually
are in running code. This is another reason to clean up public request schemas:
they affect documentation and type direction even when runtime behavior still
injects identity from context.

Relevant file:

- `packages/utils/src/result/route-registrar.ts`

## Target Architecture

### HTTP Pattern

```ts
r.route(
  { method: 'get', path: '/', request: { query: ListGoalsFiltersSchema } },
  [auth],
  (req, ctx) => controller.list(parseGoalFilters(req.query), ctx),
);

async list(filters: GoalListFilters, ctx: Context) {
  return useCases.listGoals.execute({
    ...filters,
    identityId: ctx.identityId,
  });
}
```

Properties of the target:

- route parses only business filters
- route does not accept `identityId` from client payload
- controller receives `ctx`
- internal query is assembled inside transport/controller layer

### Electron Pattern

```ts
ipcMain.handle(Ch.LIST, async (_event, params) =>
  withAuthenticatedValue(ctx, async (requestContext) =>
    controller.list(normalizeListParams(params), requestContext),
  ),
);
```

Properties of the target:

- renderer sends only business params
- main process resolves authenticated context
- no `resolveIdentityId(payload)` helper
- no fallback like `local-user`

### Cross-user Pattern

```ts
interface CleanupNotificationsForUserReq {
  targetIdentityId: IdentityId;
  beforeDays: number;
}

async cleanupForUser(input: CleanupNotificationsForUserReq, ctx: Context) {
  permissions.assertCanManageUser(ctx.identityId, input.targetIdentityId);
  return useCases.cleanupForUser.execute(input);
}
```

## Anti-Patterns To Remove

The following patterns should be treated as migration targets:

- `identityId` in `Create*Schema` or `Query*Schema` for current-user operations
- `query.identityId || ctx.identityId`
- `resolveIdentityId(payload)`
- `(req as any).identityId` when typed `ctx.identityId` is available
- `req.user?.identityId || 'api-user'`
- `identityId ?? 'local-user'`
- static Electron contexts like `{ identityId: 'desktop-user' }` for user-scoped flows

## Module Classification

### Fully aligned or close to reference

These modules already follow the intended direction for most current-user
operations and should be used as references:

| Module | Status | Notes |
| --- | --- | --- |
| `account` | aligned | transport and Electron flows use context-driven identity |
| `reminder` | aligned | API routes and authenticated Electron wrapper are context-driven |

### Partially aligned

These modules already inject identity from context in some transport paths, but
their public request schemas or some entry points still leak actor identity:

| Module | Status | Notes |
| --- | --- | --- |
| `goal` | partial | routes and Electron inject context, but public query/import/export contracts still carry `identityId` |
| `task` | partial | routes/controllers inject identity, but task template public request schemas still carry `identityId` |
| `setting` | partial | transport is context-driven, but public request DTOs still expose `identityId` |
| `repository` | partial | HTTP is mostly context-driven, but Electron and some server fallbacks still synthesize identities |
| `editor` | special partial | HTTP uses context, but Electron still uses static `desktop-user` context |
| `governance` | special partial | HTTP uses context for audit-worthy actions, Electron still uses static `desktop-user` context |

### Not aligned yet

These modules still allow or normalize actor identity through payloads or
fallbacks in core request paths:

| Module | Status | Notes |
| --- | --- | --- |
| `notification` | not aligned | create/query/cleanup public schemas still expose `identityId` |
| `schedule` | not aligned | controller allows identity override and public request contracts still expose `identityId` or `userId` |
| `ai` | not aligned | HTTP routes use `(req as any).identityId`; Electron resolves identity from payload and defaults |

### Special cases

| Module | Status | Notes |
| --- | --- | --- |
| `authentication` | n/a | identity source module, not a current-user business consumer |

## Module-by-Module Findings And Work Items

### 1. Account

Status: reference implementation

Why it is close to target:

- transport handlers always call application port with `ctx.identityId`
- Electron entry uses `ctx.auth.requireIdentityId()`
- public update DTOs do not expose `identityId`

Reference files:

- `packages/account/src/api/transport-handlers.ts`
- `packages/account/src/electron-entry/index.ts`
- `packages/contracts/src/modules/account/api/account-profile.dto.ts`

Action:

- use as reference for other current-user modules

### 2. Reminder

Status: aligned

Why it is close to target:

- HTTP routes pass `ctx` into create/list/update/delete paths
- Electron uses authenticated wrapper that resolves request context in main

Reference files:

- `packages/reminder/src/api/routes/reminder-template.routes.ts`
- `packages/reminder/src/electron-entry/authenticated-ipc.ts`

Action:

- run a confirmation audit during Phase 3, but not a top-priority refactor target

### 3. Goal

Status: partial

What is already good:

- HTTP list routes inject `ctx.identityId` into controller inputs
- Electron list routes overwrite payload identity with authenticated context
- create DTO does not expose `identityId`

Current issues:

- public query schemas still require `identityId`
- folder query schemas still require `identityId`
- import/export contracts still carry `identityId`
- controller signatures still encode identity-bearing query DTOs as public inputs

Key files:

- `packages/goal/src/api/routes/goal.routes.ts`
- `packages/goal/src/api/routes/goal-folder.routes.ts`
- `packages/goal/src/electron-entry/index.ts`
- `packages/goal/src/controllers/goal.controller.ts`
- `packages/goal/src/controllers/goal-folder.controller.ts`
- `packages/contracts/src/modules/goal/api/goal-crud.dto.ts`
- `packages/contracts/src/modules/goal/api/goal-folder.dto.ts`

Required changes:

- replace `QueryGoalsSchema` with a public filters schema that excludes `identityId`
- replace `QueryGoalFoldersSchema` with a public filters schema that excludes `identityId`
- split public request types from internal application query types
- review `ExportGoalsSchema` and `ImportGoalsSchema`
  - if they are current-user operations, remove actor identity
  - if they are admin/system operations, rename to `targetIdentityId`
- change controller list signatures toward `(filters, ctx)` instead of `query-with-identity`

Priority: P1

### 4. Task

Status: partial

What is already good:

- HTTP routes inject `ctx.identityId`
- controller composes internal queries from supplied identity

Current issues:

- `CreateTaskTemplateSchema` still exposes optional `identityId`
- `QueryTaskTemplatesSchema` still requires `identityId`
- public contracts still imply the renderer or HTTP client may provide identity

Key files:

- `packages/task/src/api/routes/task-template.routes.ts`
- `packages/task/src/api/controllers/task-template.controller.ts`
- `packages/contracts/src/modules/task/api/task-template.dto.ts`

Required changes:

- remove `identityId` from `CreateTaskTemplateSchema`
- replace `QueryTaskTemplatesSchema` with public filter schema without identity
- keep internal application query type with `identityId`
- audit other task request contracts for similar transport leakage

Priority: P1

### 5. Setting

Status: partial

What is already good:

- API transport handlers consistently use `ctx.identityId`
- Electron entry consistently resolves identity from auth context

Current issues:

- `GetUserSettingSchema` exposes optional `identityId`
- `CreateUserSettingSchema` exposes required `identityId`
- `ResetUserSettingSchema` exposes optional `identityId`

Key files:

- `packages/setting/src/api/transport-handlers.ts`
- `packages/setting/src/electron-entry/index.ts`
- `packages/contracts/src/modules/setting/api/user-setting.dto.ts`

Required changes:

- split public API DTOs from internal application commands
- remove actor `identityId` from public current-user DTOs
- keep response DTOs unchanged

Priority: P1

### 6. Notification

Status: not aligned

Current issues:

- create notification public schema requires `identityId`
- list query public schema accepts optional `identityId`
- cleanup public schema requires `identityId`
- HTTP routes pass body/query identity directly into controller validation

Key files:

- `packages/notification/src/api/routes.ts`
- `packages/notification/src/controllers/notification.controller.ts`
- `packages/contracts/src/modules/notification/api/notification-crud.dto.ts`
- `packages/contracts/src/modules/notification/api/notification-query.dto.ts`
- `packages/contracts/src/modules/notification/api/notification-batch.dto.ts`

Required changes:

- remove actor identity from create/list/cleanup public DTOs
- change controller signatures:
  - `create(input, ctx)`
  - `list(filters, ctx)`
  - `cleanup(input, ctx)`
- inject `ctx.identityId` inside controller or transport layer
- preserve explicit target identity only for true admin/system operations, if any

Priority: P0

### 7. Schedule

Status: not aligned

Current issues:

- public create request still allows optional `identityId`
- conflict detection request uses `userId`
- public list-by-range request allows optional `identityId`
- controller explicitly does `query.identityId || ctx.identityId`
- schedule module internals still do `query.identityId || ctx.identityId`
- protocol and client adapter types still model actor identity as caller-supplied

Key files:

- `packages/schedule/src/controllers/schedule-event.controller.ts`
- `packages/schedule/src/api/schedule-event.routes.ts`
- `packages/schedule/src/infrastructure-server/schedule.module.ts`
- `packages/contracts/src/modules/schedule/api/requests/schedule-requests.ts`
- `packages/contracts/src/modules/schedule/protocol/schedule-rpc-map.ts`
- `packages/schedule/src/infrastructure-client/adapters/http/schedule-event-http.adapter.ts`
- `packages/schedule/src/infrastructure-client/adapters/ipc/schedule-event-ipc.adapter.ts`

Required changes:

- remove actor identity from current-user create/list request DTOs
- forbid query override in controller and server module
- replace `userId` in current-user conflict detection with context-derived actor identity
- if cross-user conflict analysis is required later, add separate admin operation with `targetIdentityId`
- align protocol maps and client adapters with the new public request types

Priority: P0

### 8. AI

Status: not aligned

Current issues:

- HTTP routes use `(req as any).identityId` instead of typed `ctx.identityId`
- Electron resolves identity from payload via `resolveIdentityId(payload)`
- Electron defaults to `local-user`
- payload may still contain `accountId` or `identityId` as actor source

Key files:

- `packages/ai/src/api/routes/ai-provider.routes.ts`
- `packages/ai/src/api/routes/ai-chat.routes.ts`
- `packages/ai/src/api/routes/ai-knowledge-note.routes.ts`
- `packages/ai/src/api/routes/ai-goal-generation.routes.ts`
- `packages/ai/src/electron-entry/index.ts`

Required changes:

- migrate HTTP routes to typed `(req, ctx)` usage
- remove `(req as any).identityId` for current-user flows
- remove `resolveIdentityId(payload)` from Electron for user-scoped operations
- require authenticated request context in main process
- eliminate `local-user` fallback

Priority: P0

### 9. Repository

Status: partial

What is already good:

- many HTTP routes already receive `ctx`

Current issues:

- one route still synthesizes `{ identityId: req.user?.identityId || 'api-user' }`
- Electron uses `resolveIdentityId(params)` and defaults to `local-user`
- infrastructure module still contains `ctx.identityId || 'api-user'` fallbacks

Key files:

- `packages/repository/src/api/routes/repository.routes.ts`
- `packages/repository/src/electron-entry/index.ts`
- `packages/repository/src/infrastructure-server/repository.module.ts`

Required changes:

- remove all hardcoded fallback actor identities
- resolve actor identity only from authenticated context
- keep explicit business identity only where repository truly manages another owner

Priority: P0

### 10. Editor

Status: special partial

What is already good:

- HTTP create/list routes already pass `ctx`

Current issues:

- Electron still uses static `desktop-user` context for most handlers

Key files:

- `packages/editor/src/api/routes/document.routes.ts`
- `packages/editor/src/electron-entry/index.ts`

Decision:

- if editor documents are user-scoped, migrate to authenticated request context
- if editor is intentionally local-workspace scoped, document that explicitly and
  stop pretending the static identity is authenticated user identity

Priority: P2

### 11. Governance

Status: special partial

What is already good:

- HTTP routes already use `ctx` for create/update/delete/search

Current issues:

- Electron still uses static `desktop-user` context

Key files:

- `packages/governance/src/api/routes/governance-rules.routes.ts`
- `packages/governance/src/electron-entry/index.ts`

Decision:

- if governance actions need real audit actor identity, Electron must switch to
  authenticated context
- if governance desktop mode is intentionally local-admin-only, document it as a
  special case rather than copying the fallback elsewhere

Priority: P2

### 12. Authentication

Status: n/a

Role in this migration:

- provide the canonical request-context and identity-resolution helpers
- remain the identity source, not the consumer of this pattern

Action:

- no transport-level migration needed under this plan

## Migration Phases

### Phase 0: Establish The Standard

Deliverables:

- approve this decision as the default transport rule
- add one short standard/ADR note that current-user request DTOs must not carry actor identity
- clarify exceptions for cross-user and local-workspace modules

Exit criteria:

- every module owner can tell whether a field is actor context or business data

### Phase 1: High-Risk Modules

Modules:

- `notification`
- `schedule`
- `ai`
- `repository`

Deliverables:

- remove actor identity from current-user public request DTOs
- remove payload identity resolution in Electron
- remove fallback identities
- align controller signatures with context-driven transport

Exit criteria:

- no current-user request path depends on client-supplied actor identity
- no fallback `local-user`, `api-user`, or equivalent remains in business flows

### Phase 2: Partial Alignment Cleanup

Modules:

- `goal`
- `task`
- `setting`

Deliverables:

- split public transport DTOs from internal application queries
- remove actor identity from public query/create/reset schemas
- keep internal identity-bearing queries assembled from `Context`

Exit criteria:

- public contracts reflect actual transport semantics

### Phase 3: Special Cases

Modules:

- `editor`
- `governance`
- `reminder` confirmation audit

Deliverables:

- decide whether static desktop identities are valid design or temporary shortcuts
- migrate to auth context where user scope matters
- document exceptions where local-workspace scope is intentional

Exit criteria:

- every remaining exception is explicit and documented

### Phase 4: Enforcement

Deliverables:

- regression tests for transport boundaries
- grep-based or lint-based checks for forbidden patterns
- module checklist for future reviews

Exit criteria:

- new modules do not reintroduce payload-driven actor identity

## Detailed Refactoring Rules

### Rule A: Split Public DTOs From Internal Queries

Prefer this:

```ts
export const ListGoalFiltersSchema = z.object({
  status: z.array(z.enum(GoalStatus)).optional(),
  folderId: brandedId<GoalFolderId>().optional(),
});

export type ListGoalFilters = z.infer<typeof ListGoalFiltersSchema>;

interface ListGoalsQuery {
  identityId: IdentityId;
  status?: GoalStatus[];
  folderId?: GoalFolderId;
}
```

Avoid this:

```ts
export const QueryGoalsSchema = z.object({
  identityId: brandedId<IdentityId>(),
  status: z.array(z.enum(GoalStatus)).optional(),
});
```

### Rule B: Use `Context` In Controllers For Current-user Flows

Prefer:

```ts
async list(filters: GoalListFilters, ctx: Context) {
  return this.useCases.listGoals.execute({
    ...filters,
    identityId: ctx.identityId,
  });
}
```

Avoid:

```ts
async list(query: QueryGoalsReq) {
  return this.useCases.listGoals.execute(query);
}
```

### Rule C: Ban Identity Override Logic

Reject all code like:

```ts
identityId: query.identityId || ctx.identityId
```

For current-user flows the correct behavior is:

```ts
identityId: ctx.identityId
```

### Rule D: Ban Transport Fallback Identities

Reject all code like:

- `identityId || 'api-user'`
- `identityId ?? 'local-user'`
- `{ identityId: 'desktop-user' }`

unless the module is explicitly documented as a non-authenticated local-only
special case.

### Rule E: Keep Response Identity Fields

No migration is required for:

- `GoalClientDTO.identityId`
- `TaskTemplateClientDTO.identityId`
- `UserSettingClientDTO.identityId`
- aggregate persistence DTO identity fields

The concern is request boundary semantics, not domain data completeness.

## Acceptance Criteria

The migration is complete when all of the following are true for current-user
business modules:

- no public `Create*`, `Update*`, `Query*`, `List*`, `Reset*`, or `Cleanup*`
  request schema exposes actor identity
- no HTTP route reads actor identity from `req.body`, `req.query`, or
  `(req as any).identityId`
- no Electron entry resolves actor identity from payloads
- no business flow uses hardcoded fallback identities
- all user-scoped controllers receive `Context` when they need actor identity
- internal application queries that still require identity are assembled inside
  transport/controller code

## Recommended Test Strategy

### Contract-level tests

Add tests that assert public request DTOs for current-user flows do not include:

- `identityId`
- `userId`
- `accountId`

### Route and Electron tests

Add tests that assert:

- HTTP routes use `ctx.identityId` rather than request payload actor fields
- Electron handlers use `ctx.auth.requireRequestContext()` or equivalent
- payload actor fields are ignored or rejected where appropriate

### Static checks

Add repo checks for forbidden patterns in user-scoped modules:

- `resolveIdentityId(`
- `query.identityId || ctx.identityId`
- `'local-user'`
- `'api-user'`
- `'desktop-user'`
- `(req as any).identityId`

These checks should be scoped so they do not flag legitimate docs, tests, or
documented special-case modules.

## Recommended Delivery Order

1. approve the architectural rule
2. refactor `notification`, `schedule`, `ai`, and `repository`
3. refactor `goal`, `task`, and `setting`
4. review `editor` and `governance` special cases
5. add automated enforcement

## Final Recommendation

All current-user business modules should move to this pattern.

Not every module should copy `goal` exactly as it is today, because `goal`
itself is only partially aligned. The repo should instead converge on the
stronger rule:

- public requests contain business data only
- actor identity comes from authenticated context only
- cross-user actions use explicit target identity only

Reference modules to copy:

- `account`
- `reminder`

First-wave remediation targets:

- `notification`
- `schedule`
- `ai`
- `repository`

Second-wave cleanup targets:

- `goal`
- `task`
- `setting`
