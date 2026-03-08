# Desktop Auth Plan

## Goal

Build an elegant desktop authentication flow that supports:

- first-time online registration and cloud login
- offline-first login for previously authenticated users
- persistent guest mode
- local-first data access with optional sync when online

## Target Model

Separate auth identity from network state.

- `AuthMode`
  - `ONLINE_USER`
  - `OFFLINE_USER`
  - `GUEST`
- `ConnectionStatus`
  - `ONLINE`
  - `OFFLINE`

This avoids overloading the current `LOCAL` meaning.

## Product Rules

### 1. Registration

- registration must be online
- successful registration immediately establishes a cloud account session
- after successful registration, the app stores enough local credential material to support future offline unlock

### 2. Online user login

- renderer always calls a single `auth:login`
- main process decides whether to use remote auth or local fallback
- when online, login goes to remote API first
- if remote auth succeeds, store tokens, update local offline credential cache, and enable sync

### 3. Offline user login

- offline login is only available for users who have previously logged in successfully on this device
- if remote login fails because of network failure, main process falls back to local credential verification
- if local verification succeeds, create an `OFFLINE_USER` session and open the local database without sync
- if remote login fails because of invalid credentials, do not fall back to offline login

### 4. Guest mode

- guest mode is a first-class mode, not a fake offline login
- guest identity must be persistent on the device
- guest data stays local until the user explicitly upgrades to a cloud account

### 5. Recovery and sync

- on app launch, restore the most recent valid local identity context
- when network returns, `OFFLINE_USER` should try silent token refresh and resume sync
- `GUEST` should not auto-upgrade to cloud identity

## Current Gaps In The Project

### Authentication orchestration

- `apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts`
  - `login()` does not fully implement network-aware fallback routing
  - `localLogin()` creates a session without real password verification

### Auth mode semantics

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
  - current `authMode` still mixes `ONLINE`, `OFFLINE`, and `LOCAL`
  - successful login currently sets mode to `LOCAL`, which is semantically wrong
  - `enterOfflineMode()` behaves like temporary guest access rather than recoverable offline user mode

### Guest lifecycle

- guest identity is generated ad hoc instead of being persisted and restored
- guest mode and offline-user mode are not clearly separated

### Data layer integration

- `apps/desktop/src/main/database/powersync.ts`
  - current flow assumes authenticated online sync
  - there is no explicit `local-only` database mode for guest or offline-user sessions

### App startup flow

- `apps/desktop/src/main/lifecycle/app-lifecycle.ts`
  - startup routing relies mainly on token validity
  - it does not account for restorable offline-user or guest sessions

### Status reporting

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
  - `getStatus()` should expose both auth mode and connection status
  - frontend currently lacks enough information for precise UX messaging

## Architecture Direction

## Main process as hybrid auth gateway

The renderer should never decide online vs offline auth behavior.

The main process should:

- detect network availability
- try remote authentication when appropriate
- distinguish auth failure from network failure
- perform local verification for offline unlock
- restore guest identity when requested
- return a unified result to the renderer

## Proposed responsibilities

### `AuthDesktopApplicationService`

- orchestrates login, register, auto-restore, guest entry, logout, and status aggregation
- owns high-level auth mode transitions

### `SessionManager`

- becomes the primary auth state machine and routing layer
- handles remote login, offline fallback, session restore, refresh, and local session creation

### `CredentialRepository`

- stores locally usable offline credential data for previously authenticated users
- supports lookup by identifier and identity

### `LocalCredentialVerifier`

- hashes and verifies passwords for offline unlock
- should reuse existing project hashing strategy where possible

### `PowerSync manager`

- supports two runtime modes:
  - `local-only`
  - `sync-enabled`

## Recommended Login Flow

### App launch

1. initialize network state
2. restore persisted auth context
3. decide startup path:
   - valid online session -> `ONLINE_USER`
   - restorable local user without network -> `OFFLINE_USER`
   - persisted guest identity -> `GUEST`
   - otherwise show login window

### Manual login

1. renderer sends `email + password` through `auth:login`
2. main process checks current network status
3. if online, try remote login
4. if remote login succeeds:
   - save tokens
   - save or refresh offline credential cache
   - create online session
   - connect sync-enabled PowerSync
5. if remote login fails because of network failure:
   - verify local credential
   - if valid, create offline session
   - connect local-only PowerSync
6. if remote login fails because of invalid credentials:
   - return auth error

### Guest entry

1. renderer calls a dedicated guest entry API
2. main process restores existing guest identity or creates one once
3. create guest session
4. connect local-only PowerSync

### Network restoration

1. if current mode is `OFFLINE_USER`, attempt silent refresh
2. if refresh succeeds, promote session to `ONLINE_USER`
3. attach sync connector and resume replication

## Security Rules

- never store plaintext passwords
- do not store reversible encrypted passwords as the primary offline mechanism
- store only one-way password hashes for offline unlock
- treat offline login as local device unlock, not as fresh server authentication
- keep password verification in the main process, not in the renderer

## Implementation Roadmap

### Phase 1 - Clarify state model

- replace ambiguous `LOCAL` semantics with explicit auth modes
- add `connectionStatus` to auth status payloads
- rename `enterOfflineMode()` into explicit guest-oriented behavior

### Phase 2 - Add offline credential support

- persist offline credential material after successful online login/register
- implement real local password verification
- distinguish network errors from credential errors during login fallback

### Phase 3 - Support persistent guest mode

- persist guest identity on device
- restore guest context across restarts
- prevent guest from being treated as offline-user session

### Phase 4 - Upgrade startup and recovery

- restore previous identity context during app boot
- stop relying only on token presence for window routing
- support offline-user resume and guest resume

### Phase 5 - Add local-only data runtime

- allow PowerSync-backed local DB access without remote connector
- attach sync only when authenticated online

### Phase 6 - Improve UX and observability

- show precise auth + connection state in UI
- display guest/offline messaging clearly
- log mode transitions and sync recovery paths

## Suggested API And Status Shape

### Auth status

- `mode: 'ONLINE_USER' | 'OFFLINE_USER' | 'GUEST'`
- `connectionStatus: 'ONLINE' | 'OFFLINE'`
- `authenticated: boolean`
- `identityId: string | null`
- `canSync: boolean`
- `needsReauth: boolean`
- `lastOnlineAt?: string`

### IPC actions

- `auth:login`
- `auth:register`
- `auth:auto-login`
- `auth:enter-guest-mode`
- `auth:logout`
- `auth:get-status`

## Priority Files To Change Later

- `apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts`
- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`
- `apps/desktop/src/main/modules/authentication/ipc/auth.ipc-handlers.ts`
- `apps/desktop/src/main/database/powersync.ts`
- `apps/desktop/src/main/lifecycle/app-lifecycle.ts`

## Success Criteria

- first registration requires network
- previously logged-in users can unlock locally while offline
- guest users can work locally across app restarts
- app startup restores the correct identity context automatically
- online and offline behavior are transparent to the renderer
- sync resumes automatically when network returns for offline users
