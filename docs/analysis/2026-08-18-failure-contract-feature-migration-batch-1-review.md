# Failure Contract Feature Migration — Batch 1 Review Evidence

> Date: 2026-08-18  
> Branch: `refactor/acr-core-failures`  
> Baseline: `4a0e49518`  
> Scope: ACR-030, AI server/runtime portion of ACR-031, and shared HTTP/IPC/CORS message-classification cleanup.

## 1. Review outcome

This batch removes provider/message-driven control flow from the highest-risk server/application paths without changing public routes, IPC channels, authentication storage, repository product policy, or AI approval semantics.

The ADR-049 inventory moves from **219** grandfathered production findings to **163**:

| Rule                         |  Before |   After |   Delta |
| ---------------------------- | ------: | ------: | ------: |
| `DOMAIN_ERROR_SUBCLASS`      |      51 |      47 |      -4 |
| `FAILURE_MESSAGE_BRANCH`     |      54 |       8 |     -46 |
| `PROVIDER_CODE_LEAKAGE`      |       6 |       0 |      -6 |
| `RAW_RESULT_MESSAGE_RETHROW` |      26 |      26 |       0 |
| `UI_RAW_RESULT_MESSAGE`      |      82 |      82 |       0 |
| **Total**                    | **219** | **163** | **-56** |

`failure-contract-baseline.json` was rewritten only after the implementation and focused validation passed. The scanner reported 56 retired entries and zero new/expired production findings before the rewrite.

## 2. Repository / GitHub boundary

### Before

Application services received a `GitHubAppClientError` with a numeric provider HTTP status and branched on 401/403/404/413/422.

### After

The GitHub infrastructure adapter owns HTTP interpretation and exposes a provider-neutral capability failure:

- `not_found`
- `unauthorized`
- `payload_too_large`
- `conflict`
- `rate_limited`
- `unavailable`
- `invalid_response`

Application services branch only on these MemoFlow-owned semantic kinds. Provider body text and provider status are not behavioral contracts outside the adapter.

Review checks:

- no `PROVIDER_CODE_LEAKAGE` remains in the production inventory;
- repository application code does not branch on GitHub HTTP status;
- commit conflict and unavailable paths return stable application messages rather than provider response text;
- repository full suite: **219/219**.

## 3. Account closure

The closure saga no longer determines `NOT_FOUND` by parsing persisted diagnostic text. It now persists a machine-readable `lastErrorCode` alongside the diagnostic `lastError` and exposes `failureCode` in the internal receipt.

`ACCOUNT_NOT_FOUND` is a typed application failure; unexpected closure failures become `ACCOUNT_CLOSURE_FAILED` and are mapped to a safe public internal-error message.

The Prisma schema and generated client include `last_error_code`. Local deployments use schema reconciliation; the existing saga/idempotency/lease model is unchanged.

Account full suite: **203/203**.

## 4. AI server/runtime

AI now has an internal provider-neutral `AIExecutionError` taxonomy. The infrastructure gateway owns provider HTTP interpretation. Application/runtime code branches on structured category rather than message fragments.

Removed behavioral message parsing includes:

- provider unavailable / not found detection;
- abort/cancel message regexes;
- host `task.create` invariant messages;
- proposal duplicate messages;
- controller fallback parsing.

Host task-create invariants use `HostTaskCreateRuntimeError(kind)` and the proposal kernel uses a typed conflict error. The shared abort predicate accepts structured `aborted` category or `AbortError` name only; arbitrary English text does not drive cancellation behavior.

The AI package now has zero `FAILURE_MESSAGE_BRANCH` and zero `DOMAIN_ERROR_SUBCLASS` findings. Presentation ownership is intentionally deferred to ACR-032, so ACR-031 is not yet marked fully complete.

AI full suite: **867/867**.

## 5. Shared transport cleanup

- API CORS uses a typed `CorsRejectionError`, not equality against `"Not allowed by CORS"`.
- HTTP network classification uses error `code` / `name` / timeout metadata, not message regexes.
- Email-verification circuit no longer falls back to parsing a message string.
- IPC bridge errors are transport failures; Electron's human-readable rejection text is not parsed to infer a missing-handler business code.

Validation:

- HTTP client: **27/27**
- IPC client: **13/13**
- API: **294/294**

## 6. Type and lint evidence

Passed:

- `repository:typecheck`
- `ai:typecheck`
- `account:typecheck`
- `http-client:typecheck`
- `ipc-client:typecheck`
- `api:typecheck`
- corresponding six lint targets
- database Prisma generation/build after adding `lastErrorCode`

Nx reported several already-known flaky build tasks during dependency closure runs, but the requested targets completed successfully after the workspace dependency artifacts were present. CI remains the authoritative clean-workspace confirmation.

## 7. Review findings resolved during the batch

1. Repository source-surface assertions depended on Prettier single-line formatting; changed to whitespace-tolerant structural regexes without weakening identity-scoping requirements.
2. The AI dual-registry test still required abort/cancel message fragments even though ADR-049 forbids message-driven behavior; updated it to assert the new structured-only invariant.
3. Provider response text was read but no longer used after semantic mapping; removed the dead reads.
4. Account persisted diagnostic text needed a separate machine field; added `lastErrorCode` rather than overloading `lastError`.
5. Public-facing repository/AI mapping uses stable safe text; provider detail remains infrastructure diagnostic data only.

## 8. Remaining work

The 163 remaining findings are deliberate next-batch work, not accepted end-state debt:

- 82 UI raw-message ownership findings;
- 26 raw result-message rethrows;
- 47 remaining `DomainError` subclasses;
- 8 message branches in app-vue / Goal / Reminder / Schedule.

Next batches must drive those counts to zero before ADR-049 can be marked implemented and the active plan archived.
