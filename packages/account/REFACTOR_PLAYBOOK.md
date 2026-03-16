# Account Refactor Playbook

Status: **Migration complete** — matches governance reference pattern.

## What Was Done

### 1. Legacy Container Retirement

Deleted `src/infrastructure-server/di/account-container.ts` and the empty `di/` directory.
The singleton `AccountContainer` was unused in code — only referenced in architecture docs.

### 2. Client Service Cleanup

Removed the singleton proxy pattern (`setAccountApplicationService` / `accountApplicationService`)
from `src/application-client/index.ts`. This was an unused service-locator anti-pattern. Consumers
construct `AccountClientService` with an injected `IAccountApiClient` adapter.

### 3. Result Consistency

**transport-handlers.ts**: Removed all `as any` casts. Each handler now:

- Wraps success in `ok()` with the correct contract type
- Maps `null` profile to `fail({ code: 'ACCOUNT_NOT_FOUND', ... })`
- Extracts `.account` from `UpdateProfileResult` to return `AccountClientDTO`

**account.module.ts**: Replaced conditional `infer R` types on `AccountApplicationPort` with
explicit `UpdateProfileResult` and `CloseAccountResult` types. Exported those types from the
`application-server` commands barrel.

### 4. Export Hygiene

Updated `src/index.ts` to follow governance layered export pattern:

- Contracts → Domain → Application → Infrastructure ordering with section headers
- `@internal` JSDoc on concrete repository implementations
- ASCII architecture diagram in module docstring
- Conflict note for domain-client re-exports

### 5. Documentation

- Updated `COMPOSITION_ROOT.md` with English docs and a table of key files
- Created this `REFACTOR_PLAYBOOK.md`

## Architecture Overview

```
createAccountModule(deps)
  ├── useCases   — assembled use-case instances (for tests / diagnostics)
  ├── api        — AccountApplicationPort (transport-neutral facade)
  ├── start()    — activates runtime contributions (event listeners)
  └── dispose()  — tears down runtime contributions in reverse order
```

### Transport Wiring

```
API transport:        PrismaAccountRepository → createAccountModule → module.api → transport-handlers → controller → routes
Electron transport:   PowerSyncAccountRepository → createAccountModule → module.api → ipcMain handlers
Client (web):         AccountHttpAdapter → AccountClientService
Client (desktop):     AccountIpcAdapter → AccountClientService
```

## Files Changed

| File                                                 | Change                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `src/infrastructure-server/di/account-container.ts`  | **Deleted**                                              |
| `src/infrastructure-server/account.module.ts`        | Explicit return types on `AccountApplicationPort`        |
| `src/application-server/use-cases/commands/index.ts` | Export `UpdateProfileResult`, `CloseAccountResult` types |
| `src/application-client/index.ts`                    | Removed singleton proxy pattern                          |
| `src/api/transport-handlers.ts`                      | Removed `as any` casts, proper null→fail mapping         |
| `src/index.ts`                                       | Governance-style layered exports with `@internal`        |
| `COMPOSITION_ROOT.md`                                | Updated to English, added usage example                  |

## Remaining Considerations

- **Use-case Result wrapping**: Server use cases currently throw on not-found instead of returning
  `Result`. This is handled in the transport layer for now. A future pass could push `Result`
  into the use cases themselves for full consistency.
- **`AccountApplicationService` alias**: Kept for backward compatibility. Can be removed once
  all consumers have migrated to `AccountClientService`.
