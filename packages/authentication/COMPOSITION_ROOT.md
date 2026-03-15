# Authentication Composition Root

`@dailyuse/authentication` server-side DI is now converged to one main path:

```text
outer app / transport
  -> choose concrete adapters
  -> createAuthenticationModule(deps)
  -> consume module.api from controller/router/IPC
  -> expose routes / IPC handlers
```

## Target Pattern

- One factory-style composition root per module
- The composition root only accepts an explicit `deps` object
- Controllers / routes never `new` repositories directly
- No singleton container needed for normal runtime usage
- Resource cleanup goes through `dispose()`

## Authentication Specifics

- API entry point: `packages/authentication/src/api/module.ts`
- Composition root: `packages/authentication/src/infrastructure-server/authentication.module.ts`
- HTTP controller: `packages/authentication/src/controllers/auth.controller.ts`
- PowerSync entry: `packages/authentication/src/infrastructure-server/powersync.ts`
- Runtime contribution: `packages/authentication/src/api/runtime.ts`
- Transport handlers: `packages/authentication/src/api/transport-handlers.ts`

## Why This Is Better Than Before

- Dependencies are explicit: look at `AuthenticationModuleDependencies` to see what the module needs
- Transport is thinner: only does protocol mapping, no implicit injection
- Testing is simpler: pass mock repositories directly
- Lifecycle is clear: event subscriptions via runtime contributions with `start()` / `stop()`
- Domain error mapping (`UserAlreadyExistsError` -> `CONFLICT`, etc.) lives in the `api` facade, not in route handlers

## Dependencies Interface

```ts
export interface AuthenticationModuleDependencies {
  readonly identityRepository: IAuthIdentityRepository;
  readonly sessionRepository: IAuthSessionRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenProvider: ITokenProvider;
  readonly runtimeContributions?: AuthenticationRuntimeContributionsInput;
}
```

## Backward Compatibility

The legacy `AuthenticationModule` class and `AuthenticationContainer` singleton are kept as deprecated re-exports. They will be removed in a future release once all consumers have migrated.
