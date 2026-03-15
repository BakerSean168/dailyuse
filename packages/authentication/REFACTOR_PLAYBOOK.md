# Authentication Refactor Playbook

Use this file as a quick reference for reviewing and understanding the authentication module migration.

## Read Order

1. `packages/authentication/src/infrastructure-server/authentication.module.ts`
   - the canonical `createAuthenticationModule(deps)` shape
   - shows dependency object, transport-neutral `api`, and lifecycle ownership
   - domain error mapping (UserAlreadyExistsError -> CONFLICT, etc.) in the `api` facade
2. `packages/authentication/src/api/module.ts`
   - shows how API transport chooses concrete Prisma adapters and creates the module
3. `packages/authentication/src/api/runtime.ts`
   - shows how old global initialization becomes module-owned runtime contribution
   - auth event logging subscribers (login, logout, password change, session revoke)
4. `packages/authentication/src/api/transport-handlers.ts`
   - shows the thin transport mapping layer (identity mapping since api matches controller port)
5. `packages/authentication/src/electron-entry/index.ts`
   - shows the deprecated shared electron entry (desktop owns its own auth composition)

## What Was Migrated

### 1. Composition Root (authentication.module.ts)

- `AuthenticationModuleDependencies` — explicit dependency interface
- `AuthenticationApplicationPort` — transport-neutral facade returning `Promise<Result<T>>`
- `createAuthenticationModule(deps)` — factory function, assembles once
- `createAuthenticationUseCases(deps)` — pure assembly helper for tests
- Domain error mapping moved from route handlers into `api` facade
- Legacy `AuthenticationModule` class kept as `@deprecated`

### 2. API Module (api/module.ts)

- 3-step pattern: composition root -> transport handlers -> mount routes
- `destroy()` calls `module.dispose()`
- No more container usage

### 3. Runtime Contribution (api/runtime.ts)

- `createAuthenticationRuntimeContribution()` with idempotent `start()` / `stop()`
- Auth event logging subscribers moved from `initialization.ts`
- Subscribes to: UserLoggedIn, UserLoggedOut, PasswordChanged, SessionRevoked

### 4. Transport Handlers (api/transport-handlers.ts)

- `createAuthenticationTransportHandlers(api)` — identity mapping
- Since `AuthenticationApplicationPort` already matches the controller port, the mapping is trivial

### 5. Root Barrel (src/index.ts)

- Layer-organized exports with `@internal` tags for concrete repos
- Composition root types and factories exported
- Legacy exports marked `@deprecated`

### 6. Desktop App (apps/desktop)

- Removed dead `AuthenticationContainer.getInstance().reset()` call from `destroy()`
- Desktop already uses direct DI (no container)

## What Was NOT Changed

- All use case classes (Login, Register, Logout, etc.) — untouched
- All domain aggregates (AuthIdentity, AuthSession) — untouched
- All repository implementations (Prisma, PowerSync) — untouched
- Controller validation logic — untouched
- Route paths and IPC channels — untouched
- Client-side services and adapters — untouched (only deprecation annotations added)

## What To Delete Later

When all consumers have migrated:

- `infrastructure-server/di/authentication-container.ts` — singleton container
- `infrastructure-server/di/authentication-repository.factory.ts` — legacy factory
- `api/initialization.ts` — deprecated initialization task registration
- `application-client/index.ts` singleton proxy (`setAuthenticationApplicationService`, `authenticationApplicationService`)

## Success Criteria

The module is considered migrated when:

- There is one obvious composition root (`createAuthenticationModule`)
- Transport only chooses adapters and forwards to `module.api`
- Lifecycle is explicit via `start()` / `dispose()`
- No singleton container is needed for normal runtime usage
- Domain error mapping is centralized in the `api` facade
