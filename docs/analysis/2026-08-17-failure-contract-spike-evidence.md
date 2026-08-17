---
tags:
  - analysis
  - architecture
  - contracts
  - error-handling
  - spike
  - xstate
  - typescript
description: ACR-R02 isolated spike evidence and ACR-R03 library/design gate decision
created: 2026-08-17T00:00:00+09:00
updated: 2026-08-17T00:00:00+09:00
---

# Failure Contract Spike Evidence and Design Gate

## 1. Purpose

This document records the executed evidence for:

- **ACR-R02** — isolated mapper, state-model, registry, and retry-policy spikes;
- **ACR-R03** — final library-adoption and ADR-049 implementation gate.

The spikes ran outside the repository in `/tmp/memoflow-failure-spikes`. They did not modify production code, workspace dependencies, the lockfile, Docker configuration, or database schemas.

The repository baseline was:

```text
repository: /home/ubuntu/projects/memoflow
branch: docs/failure-contract-architecture
base revision: 8258d415e93afb9bb79e161f4f13d0bcdc8a3519
TypeScript: 6.0.3
Zod: 4.4.3
```

Candidate versions resolved from npm on 2026-08-17:

```text
ts-pattern 5.9.0
neverthrow 8.2.0
xstate 5.32.5
zod 4.4.3
typescript 6.0.3
```

## 2. Spike A — Exhaustive provider mapper

### 2.1 Scope

A ten-member `ProviderFailure` union was mapped into MemoFlow-owned `AuthOutcome | AuthFailure` using three implementations:

1. native TypeScript `switch` plus `assertNever`;
2. `ts-pattern` with `.exhaustive()`;
3. neverthrow `Result` plus an exhaustive native switch.

The fixture matrix covered:

- invalid credentials;
- email verification required;
- duplicate account;
- rate limiting;
- provider unavailable;
- network timeout;
- account closed;
- invalid verification token;
- expired verification token;
- unknown provider failure.

All three implementations produced byte-for-byte equivalent JavaScript objects for all ten fixtures.

### 2.2 Source size

| Implementation                | Lines | Source bytes |
| ----------------------------- | ----: | -----------: |
| native switch + `assertNever` |    29 |        1,864 |
| `ts-pattern`                  |    16 |        1,783 |
| neverthrow + native switch    |    19 |        1,610 |

The line-count advantage of `ts-pattern` was real, but the source-byte difference was small because fluent matcher expressions are dense.

### 2.3 Isolated TypeScript check timing

Seven no-emit checks were executed for each isolated configuration.

| Implementation |   Median |     Mean |
| -------------- | -------: | -------: |
| native switch  | 0.6515 s | 0.6591 s |
| `ts-pattern`   | 0.9409 s | 0.9384 s |
| neverthrow     | 0.7036 s | 0.7019 s |

In this small experiment, `ts-pattern` increased median type-check time by approximately 44% compared with the native switch. The absolute difference is small, but MemoFlow already has a large contracts graph and extensive type-level governance; adding matcher-heavy types globally would increase risk without changing architecture ownership.

### 2.4 Exhaustiveness mutation

A new provider variant was injected without updating the mappers:

```ts
{
  kind: 'mfa_required';
  challengeId: string;
}
```

All three implementations failed compilation.

Native switch diagnostic:

```text
Argument of type '{ kind: "mfa_required"; challengeId: string; }'
is not assignable to parameter of type 'never'.
```

`ts-pattern` diagnostic:

```text
Type 'NonExhaustiveError<{ kind: "mfa_required"; challengeId: string; }>'
has no call signatures.
```

The native diagnostic is direct and already compatible with MemoFlow's TypeScript conventions. `ts-pattern` does not provide a correctness capability that MemoFlow cannot obtain with a small shared `assertNever` helper.

### 2.5 Decision

- **Adopt:** native discriminated unions, `switch`, and `assertNever` as the default mapper pattern.
- **Defer:** `ts-pattern`; it may be reconsidered for a narrowly bounded mapper only when a separate benchmark shows a material readability benefit and no meaningful affected type-check regression.
- **Reject for this program:** neverthrow as a runtime dependency. MemoFlow retains its existing `Result<T, E>` and may implement small local combinators without adding a second Result abstraction.

## 3. Spike B — Auth state model

### 3.1 Scope

The same Auth state graph was implemented twice:

- a pure typed reducer;
- an XState v5 machine.

The graph contained:

```text
idle
submitting
invalid_credentials
awaiting_email_verification
verification_sending
verification_sent
provider_unavailable
authenticated
canceled
```

Events covered submit, invalid credentials, verification required, send verification, verification sent, provider unavailable, authenticated, retry, cancel, and reset.

Both implementations passed the same behavior sequence and ignored an illegal `AUTHENTICATED` event after `verification_sent`.

### 3.2 Size and type-check cost

| Implementation | Lines | Source bytes | Median type-check | Mean type-check |
| -------------- | ----: | -----------: | ----------------: | --------------: |
| typed reducer  |    53 |        2,530 |          0.6530 s |        0.6546 s |
| XState v5      |    52 |        2,194 |          1.0628 s |        1.0667 s |

Installed package footprint in the isolated experiment:

```text
xstate: 2.6 MiB
ts-pattern: 584 KiB
neverthrow: 132 KiB
zod: 6.4 MiB
```

The XState source was not substantially smaller than the reducer for this Auth flow, while the isolated type-check median was approximately 63% higher. XState would also introduce a second actor/snapshot lifecycle that must remain subordinate to MemoFlow's existing durable receipts, Pinia/application state, and Web/Desktop host boundaries.

### 3.3 Decision

- **Adopt for Auth:** a pure feature-owned typed reducer/state transition function, with effects invoked by the application service/composable boundary.
- **Do not adopt for Auth:** XState.
- **Defer XState generally:** it may be reconsidered for a workflow that has invoked actors, nested/parallel states, durable resume, and a statechart that is materially easier to review than a reducer. XState actor snapshots must never become the durable source of truth.

## 4. Spike C — Single-source failure registry and retry policy

### 4.1 Scope

A registry was implemented using TypeScript and Zod only. One descriptor object owned:

- public code;
- category;
- strict details schema;
- retry hint;
- HTTP projection metadata;
- i18n key;
- telemetry label.

The experiment derived the public failure union and runtime schema from the same descriptor object. It also evaluated retry as the intersection of a failure hint and operation policy.

### 4.2 Findings

#### Zod public API boundary

The first implementation attempted to depend on an internal discriminated-union option type. Zod 4 did not export that type as a supported public API. The corrected design hides the minimum audited tuple cast inside a MemoFlow-owned registry builder and exposes only a typed `z.ZodType<PublicFailure>`.

MemoFlow must not import Zod internal types or make them part of a public contract.

#### Strict object schemas are mandatory

Zod object schemas strip unknown keys by default. A negative test containing a secret-like field initially passed parsing:

```ts
{
  code: 'AUTH_RATE_LIMITED',
  category: 'rate_limited',
  details: {
    retryAfterMs: 1,
    token: 'secret'
  }
}
```

Adding `.strict()` to every public details object made the negative test fail as required.

Therefore:

- all public failure detail objects must be strict;
- the registry builder must reject non-strict schemas or wrap a safe strict-object constructor;
- secret/provider-body negative tests are mandatory.

#### Unknown codes fail closed

A provider-shaped code such as `BETTER_AUTH_X` was rejected by the derived schema. Provider vocabulary therefore cannot enter public failure data through the compatibility serializer.

#### Retry policy must remain operation-owned

A rate-limited failure with a transient retry hint was not retried when the write operation required an idempotency key and none was present. It was retried only when:

```text
failure hint permits retry
AND operation policy permits retry
AND required idempotency key exists
AND attempt budget remains
```

### 4.3 Decision

- **Adopt:** a MemoFlow-owned registry builder based on TypeScript and Zod 4 public APIs.
- **Adopt:** strict details schemas and negative secret/provider-field tests.
- **Adopt:** `FailureRetryHint`, `OperationRetryPolicy`, and `RecoveryAction` as separate types with separate owners.
- **Reject:** a single `RetryDirective` that mixes transient facts, automatic retry execution, and UI recovery.

## 5. ACR-R03 design gate

### 5.1 Library decision matrix

| Candidate                       | Decision                | Allowed use                                                              |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| TypeScript discriminated unions | Adopt                   | Domain faults, outcomes, failures, reducers, mapper exhaustiveness       |
| Zod 4                           | Adopt                   | Wire/runtime schema and strict public details validation                 |
| native `switch` + `assertNever` | Adopt                   | Default exhaustive mapping and state reducers                            |
| `ts-pattern`                    | Defer                   | No dependency in this program; reconsider only with a bounded benchmark  |
| neverthrow                      | Reject                  | Do not add a second Result runtime; borrow combinator ideas only         |
| XState                          | Defer                   | Not used for Auth; future complex workflow requires a separate ADR/spike |
| Effect                          | Reject for this program | No global runtime/DI/Result migration                                    |
| Connect / RFC 9457              | Borrow                  | Error-code/detail principles; do not replace existing HTTP/IPC envelopes |
| Temporal                        | Borrow                  | Retry/transaction semantics; do not introduce a workflow engine here     |

### 5.2 Frozen foundation types

The implementation foundation is approved as:

```ts
type PublicFailure<Code extends string, Details = never> = {
  readonly code: Code;
  readonly category: FailureCategory;
  readonly details?: Details;
  readonly retryHint?: FailureRetryHint;
  readonly reference?: FailureReference;
};
```

The following remain separate:

```text
FailureRetryHint     -> failure classification
OperationRetryPolicy -> application/executor policy
RecoveryAction       -> presentation/application guidance
DiagnosticFailure    -> observer-only cause/provider detail
```

### 5.3 Implementation authorization

ADR-049 is approved for implementation with the decisions above. Production implementation may proceed from ACR-001 onward, subject to the protected contracts and per-PR review/repair loop in the active plan.

## 6. Executed commands and evidence

The isolated project executed:

```bash
npm install
npm run typecheck
npm run run
./node_modules/.bin/tsc -p tsconfig.native.json --noEmit
./node_modules/.bin/tsc -p tsconfig.pattern.json --noEmit
./node_modules/.bin/tsc -p tsconfig.neverthrow.json --noEmit
./node_modules/.bin/tsc -p tsconfig.reducer.json --noEmit
./node_modules/.bin/tsc -p tsconfig.xstate.json --noEmit
```

Behavior result:

```json
{
  "fixtures": 10,
  "reducerFinal": "verification_sent",
  "xstateFinal": "verificationSent",
  "registryCodes": 6,
  "status": "PASS"
}
```

The temporary spike remains outside version control and is not a production dependency.
