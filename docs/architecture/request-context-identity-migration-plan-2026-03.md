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

As of 2026-03-18, the repo is substantially aligned with this rule in code.

Current implementation status:

- current-user HTTP routes in `goal`, `task`, `setting`, `notification`,
  `schedule`, `ai`, and `repository` use authenticated `Context` as the actor
  identity source
- current-user Electron handlers in `goal`, `setting`, `notification`,
  `schedule`, `ai`, `repository`, `editor`, and `governance` use authenticated
  request context helpers instead of payload identity resolution
- public transport request DTOs for `goal`, `task`, and `setting` are split
  from internal identity-bearing query/command types
- the remaining compatibility request schemas and RPC request aliases that still
  leaked actor identity have been removed in this cleanup pass

Remaining work is no longer wave-by-wave transport refactoring. It is mostly
Phase 4 enforcement:

- contract-level regression tests
- route/Electron boundary tests
- static checks for forbidden patterns

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

## Current Implementation Status (2026-03-18)

### Module Classification

| Module | Status | Notes |
| --- | --- | --- |
| `account` | aligned | transport and Electron flows use context-driven identity |
| `reminder` | aligned | API routes and authenticated Electron wrapper are context-driven |
| `goal` | aligned | public list/import/export request DTOs are business-only; internal queries are assembled from `Context` |
| `task` | aligned | public create/list DTOs are business-only; controller assembles internal identity-bearing queries |
| `setting` | aligned | public API and RPC request DTOs are business-only; auth context provides actor identity |
| `notification` | aligned | create/list/cleanup flows inject `ctx.identityId` in controller/transport layer |
| `schedule` | aligned | public request DTOs are business-only; controller assembles internal queries from `Context` |
| `ai` | aligned | HTTP uses typed `ctx.identityId`; Electron uses authenticated request context helper |
| `repository` | aligned | HTTP and Electron use authenticated context; fallback actor identities have been removed from business flows |
| `editor` | aligned | Electron user-scoped handlers use authenticated request context |
| `governance` | aligned | Electron write/search handlers use authenticated request context |
| `authentication` | n/a | identity source module, not a current-user business consumer |

### Changes Completed In This Cleanup Pass

- removed compatibility request schemas that reintroduced actor identity into
  contracts:
  - `QueryGoalsSchema`
  - `QueryGoalFoldersSchema`
  - `ExportGoalsSchema`
  - `ImportGoalsSchema`
  - `QueryTaskTemplatesSchema`
  - `GetUserSettingSchema`
  - `CreateUserSettingSchema`
  - `ResetUserSettingSchema`
- updated RPC request types so public IPC contracts now expose only business
  payloads:
  - `goal:list` uses `ListGoalFilters`
  - `goal-folder:list` uses `ListGoalFolderFilters`
  - `task:list-templates` uses `ListTaskTemplateFilters`
  - `setting:all` uses `GetUserSettingPublic`
  - `setting:reset` uses `ResetUserSettingPublic`
- updated `goal` application-layer signatures to use explicit internal
  identity-bearing query types:
  - `ListGoalsQuery`
  - `ListGoalFoldersQuery`

### Remaining Work

The migration is effectively in the enforcement stage.

Remaining deliverables:

- add contract-level tests that assert current-user public request DTOs do not
  include actor identity fields
- add route/Electron tests that assert actor identity comes from authenticated
  context
- add static checks for forbidden patterns such as:
  - `resolveIdentityId(`
  - `query.identityId || ctx.identityId`
  - `(req as any).identityId`
  - fallback identities like `'local-user'`, `'api-user'`, and `'desktop-user'`
- keep any future local-only exceptions explicit and documented instead of
  reintroducing transport-level fallback identities

## Migration Phases

### Phase 0: Establish The Standard

Status: completed in practice

Outcome:

- the architectural rule is implemented across current-user business modules
- public request DTOs and internal identity-bearing queries are now separated

### Phase 1: High-Risk Modules

Modules:

- `notification`
- `schedule`
- `ai`
- `repository`

Status: completed in code

Outcome:

- no current-user request path in these modules depends on client-supplied actor
  identity
- payload identity resolution and business-flow fallback identities were removed

### Phase 2: Partial Alignment Cleanup

Modules:

- `goal`
- `task`
- `setting`

Status: completed in code

Outcome:

- public transport DTOs are business-only
- internal identity-bearing query types are assembled from authenticated
  `Context`
- compatibility request schemas that leaked actor identity have been removed

### Phase 3: Special Cases

Modules:

- `editor`
- `governance`
- `reminder` confirmation audit

Status: completed in code

Outcome:

- Electron handlers for user-scoped flows now use authenticated request context
- no static desktop actor identity remains in active user-scoped paths

### Phase 4: Enforcement

Status: pending

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

1. add contract-level tests that assert current-user public request DTOs do not
   expose actor identity
2. add route and Electron tests that assert actor identity comes from
   authenticated context
3. add static checks for forbidden patterns
4. keep future exceptions explicit and documented instead of reintroducing
   transport-level identity fallbacks

## Final Recommendation

This pattern should now be treated as established repo standard for
current-user business operations:

- public requests contain business data only
- actor identity comes from authenticated context only
- cross-user actions use explicit target identity only

Reference modules that already express the rule clearly:

- `account`
- `reminder`

The remaining work is enforcement, not further transport redesign.
