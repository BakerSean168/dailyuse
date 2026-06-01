# ADR-031: Server Feature Standard Shape

## Status
Accepted

## Date
2026-05-25

## Context
The monorepo has 12 business feature packages (account, ai, authentication, editor, goal, governance, notification, reminder, repository, schedule, setting, task) that share a common internal structure. However, there is no formal documentation of this shape, leading to inconsistent new modules and confusion about where code belongs.

Additionally, `dashboard` is a read-model module that intentionally does NOT follow the full server feature shape — it has no write side, no controllers, no infrastructure-server.

## Decision

### Standard Server Feature Shape

Every business feature package follows this internal structure:

```
packages/<feature>/
├── src/
│   ├── domain-server/          # Pure business logic
│   │   ├── aggregates/         # Aggregate roots
│   │   ├── entities/           # Entities
│   │   ├── value-objects/      # Value objects
│   │   ├── services/           # Domain services
│   │   ├── repositories/       # Repository interfaces
│   │   └── index.ts
│   ├── domain-client/          # Client-side domain (DTOs, view models)
│   │   ├── aggregates/
│   │   ├── entities/
│   │   └── index.ts
│   ├── domain-shared/          # Shared between server and client
│   │   ├── value-objects/
│   │   └── index.ts
│   ├── application-server/     # Server-side use cases
│   │   ├── use-cases/
│   │   │   ├── commands/       # Write operations
│   │   │   └── queries/        # Read operations
│   │   └── index.ts
│   ├── application-client/     # Client-side service interface + factory
│   │   └── index.ts            # exports createXxxServiceFromHttpClient()
│   ├── infrastructure-server/  # Server-side implementations
│   │   ├── adapters/
│   │   │   ├── prisma/         # Prisma repository implementations
│   │   │   └── powersync/      # PowerSync repository implementations
│   │   ├── <feature>.module.ts # Composition root
│   │   └── index.ts
│   ├── infrastructure-client/  # Client-side transport adapters
│   │   ├── adapters/
│   │   │   ├── http/           # HTTP adapter
│   │   │   └── ipc/            # Electron IPC adapter
│   │   └── index.ts
│   ├── api/                    # Express route definitions
│   │   ├── routes/
│   │   ├── module.ts           # API module registration
│   │   └── index.ts
│   ├── controllers/            # Request handlers
│   │   └── index.ts
│   └── index.ts                # Root barrel
├── project.json                # Nx config (tagged layer:domain)
└── package.json
```

### Layer Responsibilities

| Layer | Contains | Depends On |
|-------|----------|------------|
| `domain-server` | Entities, VOs, domain services, repo interfaces | `contracts`, `domain-shared` |
| `domain-client` | Client-side DTOs, view models | `contracts`, `domain-shared` |
| `domain-shared` | Shared VOs, enums, primitives | `contracts` |
| `application-server` | Use cases, command/query handlers | `domain-server` |
| `application-client` | Client service interface, factory functions | `domain-client`, `contracts` |
| `infrastructure-server` | Prisma repos, PowerSync repos, external adapters | `domain-server`, `application-server` |
| `infrastructure-client` | HTTP adapters, IPC adapters | `application-client` |
| `api` | Express routes, module registration | `infrastructure-server`, `application-server` |
| `controllers` | Request/response handling | `application-server` |

### Composition Root Pattern

The `infrastructure-server/<feature>.module.ts` is the composition root. It wires concrete repository implementations to domain interfaces. This is allowed within a `layer:domain` tagged package because:
- The composition root is infrastructure assembly code, not domain logic
- The ESLint `layer:domain -> layer:infra` rule exists specifically for this pattern
- Package-internal boundary enforcement is now implemented as a repo-level governance audit
  (`tools/governance/package-internal-boundary-audit.mjs`) and runs via
  `pnpm nx run daily-use:governance-check`
- Some tracked known violations may still exist temporarily, but they are treated as
  explicit technical debt to remove, not as absence of the rule

### Client Creation Language

All client-side services expose a unified factory function:

```typescript
export function createXxxServiceFromHttpClient(httpClient: IResultHttpClient): XxxClientService
```

This pattern is used by all 12 feature packages (account, ai, authentication, editor, goal, governance, notification, reminder, repository, schedule, setting, task). The factory internally composes the HTTP adapter and client service, hiding the two-step wiring from consumers.

### Read-Model Exception

Modules that are pure read-models (like `dashboard`) use a simplified shape:
- `src/domain/` — projection logic and port interface (`DashboardReadSource`)
- No infrastructure-server, no controllers, no api
- API/Desktop adapters wire their own data sources to the port interface

## Consequences

- New feature packages have a clear template to follow
- The composition root pattern is documented and justified
- Read-model modules have a recognized exception path
- Package-internal layering is already guarded by repo-level governance audit
- A future enhancement is to decide whether parts of that audit should also move into ESLint
