---
tags:
  - analysis
  - architecture
  - contracts
  - error-handling
  - governance
  - review
description: ACR-001/002/010/011/012 shared failure-contract foundation batch review
created: 2026-08-17T00:00:00+09:00
updated: 2026-08-17T00:00:00+09:00
---

# Failure Contract Foundation Batch Review

## 1. Review scope

This review closes the first production implementation batch of the application-contract refactor:

- **ACR-001** — repeatable failure-contract inventory;
- **ACR-002** — fail-new/report-legacy governance;
- **ACR-010** — JSON-safe `PublicFailure` foundation;
- **ACR-011** — public/diagnostic separation;
- **ACR-012** — feature registry and projection validators.

The batch intentionally does not migrate a business feature. It establishes the compatibility and governance foundation required by the Auth vertical slice.

## 2. Protected contracts

The review verified that the batch preserves:

1. the existing `Result<T>` discriminant and helper API;
2. the existing HTTP and IPC outer envelopes;
3. existing `error.code` and `error.message` fields during migration;
4. existing routes, IPC channels, SSE ordering, cookies, sessions, and database schemas;
5. ADR-045 request/trace context ownership;
6. ADR-048 HTTP/IPC adapter ownership and parity direction;
7. existing public package subpaths;
8. existing application callers that still use `mapInfraErrorToResultError`.

The only intentional compatibility extension is:

```ts
error.failure?: PublicFailure;
```

Legacy consumers continue to read `code/message`; migrated consumers can read the nested typed failure. Internal `cause` remains available in process but is never serialized.

## 3. Implemented architecture

### 3.1 Public failure foundation

`@memoflow/contracts/result` now owns transport-neutral primitives only:

```text
FailureCategory
FailureRetryHint
FailureReference
PublicFailure<Code, Details>
OperationRetryPolicy
RecoveryAction
```

It also owns a MemoFlow registry builder that derives:

- code unions;
- typed details;
- runtime Zod schema;
- creation helper;
- complete projection checks;
- HTTP policy completeness.

The builder uses native TypeScript and Zod 4 public APIs; it does not add a Result, matcher, state-machine, or effect runtime.

### 3.2 Compatibility envelope

A typed failure is converted to the current wire envelope with:

```ts
toLegacyResultError(failure, safeMessage);
```

HTTP and IPC preserve the nested failure. HTTP status prefers the typed failure category and then falls back to the legacy global code map. IPC never carries HTTP status.

### 3.3 Diagnostic boundary

New mapping code can use:

```ts
mapInfraErrorToFailure(error, safeMessage, operation);
```

which returns:

```text
publicError  -> safe Result/HTTP/IPC data
diagnostic   -> logger/observer-only cause/provider metadata
```

The legacy mapper remains for unmigrated callers and is explicitly documented as a compatibility path.

### 3.4 Governance boundary

The AST inventory now tracks high-confidence production patterns:

- message-based failure parsing;
- raw Result-message rethrow;
- direct UI ownership of raw error messages;
- provider vocabulary outside adapters;
- new `DomainError` subclasses.

The baseline is owned and expiring. New findings fail immediately; expired findings fail; fixed findings become stale entries that must be removed.

## 4. Review findings and repairs

### FND-01 — Zod object stripping could hide secret/provider fields

**Severity:** P0
**Finding:** Zod objects strip unknown keys by default. A public failure details payload containing a token-like key could parse successfully and silently lose evidence that an unsafe producer attempted to emit it.
**Repair:** Added `strictFailureDetails()` and required every registry definition to use it. Added negative tests for token/provider-body fields.
**Closure evidence:** `public-failure.spec.ts` rejects unknown details fields.

### FND-02 — Registry schema allowed retry-hint drift

**Severity:** P1
**Finding:** An early derived schema validated only the general `FailureRetryHint` union. A caller could send `transient` for a code registered as `not_retryable`.
**Repair:** Derived each code variant with the exact registry-owned retry hint, including literal `afterMs` when applicable.
**Closure evidence:** Auth-like invalid-credentials fixture rejects a transient retry hint.

### FND-03 — Runtime details safety needed a second line of defense

**Severity:** P0
**Finding:** A strict Zod object can still explicitly contain `z.unknown()`, allowing an `Error`, `Date`, `Map`, or other non-JSON value.
**Repair:** Added `isJsonValue` checks after creation and in the derived schema. Restricted generic public failure details to a plain JSON object and reject non-plain prototypes, non-finite numbers, arrays at the details root, `Error`, and `Date`.
**Closure evidence:** creation and schema parsing reject an internal `Error` detail and `Map` values.

### FND-04 — Diagnostic attributes could override reserved correlation fields

**Severity:** P1
**Finding:** Spreading arbitrary attributes after `operation/provider/providerCode` allowed a caller to overwrite the reserved diagnostic identity.
**Repair:** Spread attributes first; write reserved fields last. Added a malicious override fixture.
**Closure evidence:** logger receives the owning operation/provider/providerCode values.

### FND-05 — Unknown IPC errors exposed exception text

**Severity:** P0
**Finding:** IPC adapters returned `err.message` for unstructured errors, exposing database/provider/internal details to the renderer.
**Repair:** Unknown IPC errors now return the fixed MemoFlow safe message `Internal operation failed`; the real error is logged internally. Structured typed failures still preserve safe code/details.
**Closure evidence:** both IPC adapter variants have negative message-leak tests.

### FND-06 — Typed failure did not initially drive every HTTP path

**Severity:** P1
**Finding:** Direct Result conversion, thrown structured errors, and the API global middleware used separate status paths. Some still consulted only the legacy code map.
**Repair:** All three paths now prefer `PublicFailure.category`, with operation policy override support, before falling back to the legacy map.
**Closure evidence:** Express adapter and API middleware project an unregistered test code with category `unavailable` to HTTP 503.

### FND-07 — Inventory message rule was initially noisy

**Severity:** P1
**Finding:** The first scanner treated `typeof err.message === 'string'` and business objects named `message` as machine-protocol branches. Low-confidence findings would undermine the gate.
**Repair:** Restricted comparison detection to direct error-message expressions and suspicious literal comparisons; excluded Playwright report directories and adapter-private Prisma parsing.
**Closure evidence:** unit fixtures distinguish message shape guards/business messages from real failure parsing.

### FND-08 — Governance needed mutation evidence, not only green tests

**Severity:** P1
**Finding:** A scanner can be green because it never detects anything.
**Repair:** Added unit mutation fixtures and performed a repository-level mutation by temporarily adding provider/message leakage under `apps/web`. The audit failed with three new findings, then passed after cleanup.
**Closure evidence:** captured command output in the implementation run; governance unit suite has 86 passing tests.

## 5. Historical inventory

The reviewed baseline contains 219 current production findings:

| Rule                         | Count |
| ---------------------------- | ----: |
| `DOMAIN_ERROR_SUBCLASS`      |    51 |
| `FAILURE_MESSAGE_BRANCH`     |    54 |
| `PROVIDER_CODE_LEAKAGE`      |     6 |
| `RAW_RESULT_MESSAGE_RETHROW` |    26 |
| `UI_RAW_RESULT_MESSAGE`      |    82 |

These entries are not accepted architecture. They are owned migration debt with an expiry date. The baseline cannot absorb new findings without an explicit reviewed update.

## 6. Validation evidence

### Focused and package tests

```text
contracts: 39 files / 588 tests passed
utils: 12 files / 152 tests passed
http-client: 4 files / 27 tests passed
API error middleware: 8 tests passed
API smoke: 3 files / 73 tests passed
failure/governance tools: 9 files / 86 tests passed
```

API smoke was executed with an explicit non-secret override because the machine-local `.env.local` contains the legacy value `LOCAL_VALIDATION=true`, while the schema requires `0|1`:

```bash
LOCAL_VALIDATION=0 node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts
```

The local environment file was not modified.

### Static and repository gates

```text
contracts/utils/http-client/api typecheck: PASS
contracts/utils/http-client/api lint: PASS (existing warnings only)
contracts build: PASS
test inventory: 1,129 files, current and passing
docs-check: PASS
governance-check: PASS
failure inventory: 219 current, 0 new, 0 expired
```

## 7. Residuals and next batch

The foundation does not yet prove feature-level completeness. The next batch must implement Auth end to end:

```text
BetterAuth provider response
  -> adapter-private parse
  -> AuthOutcome/AuthFailure registry
  -> compatible HTTP/IPC envelope
  -> typed application reducer/state owner
  -> Web/Desktop presentation projection
  -> deterministic E2E fixtures
```

The old PR #229 remains blocked because it exposes provider vocabulary as application/UI semantics. It must not be merged as-is; the Auth vertical slice will supersede it.

## 8. Review decision

**Decision:** Approved for PR.
**Blockers:** None.
**Required follow-up:** Auth vertical slice ACR-020–023 immediately after merge.
**Rollback:** The nested `failure` extension, registry exports, transport preference, and governance command are individually revertible without changing stored data or public route names.
