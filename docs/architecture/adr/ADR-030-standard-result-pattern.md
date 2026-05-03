# ADR-030: Unifying API Responses with Result Pattern

## Status
Accepted

## Date
2026-01-16

## Context
Currently, the codebase suffers from "Type Schizophrenia":
- `contracts/src/result`: A modern, Rust-inspired `Result<T, E>` pattern (`ok: boolean`).
- `contracts/src/response`: A legacy, HTTP-coupled pattern (`success: boolean`).
- `utils/src/response`: Tools that mix both, confusing developers and AI agents.

This duality causes:
1. Inconsistent error handling (some return objects, some throw).
2. Confusion on which type to use in new features.
3. Leaking HTTP concerns (status codes) into the Domain layer types.

## Decision
We will **unify all operation results** using the **Result Pattern** defined in `@dailyuse/contracts/result`.

### 1. The Single Source of Truth
- **Module**: `@dailyuse/contracts/result` is the **ONLY** legal way to return outcomes from Application-facing boundaries and external APIs.
- **Legacy**: `@dailyuse/contracts/response` is **DEPRECATED** and will be removed.

### 2. Standard Schema
All internal operations (Functions, Services) and External APIs (HTTP REST) must conform to:

```typescript
type Result<T> = Success<T> | Failure;

interface Success<T> {
  ok: true;
  data: T;
  code?: string; // Optional metadata
}

interface Failure {
  ok: false;
  error: {
    code: ResultCode; // Standard Error Code (e.g., 'RESOURCE_NOT_FOUND')
    message: string;
    details?: unknown;
  };
}
```

### 3. Separation of Concerns
- **Domain Layer**: May return domain-specific `Result<T>` for validation/business-rule operations, but repositories and low-level persistence ports are allowed to throw structured exceptions.
- **Application Layer / Module API**: Returns `Result<T>` to callers and is the preferred boundary for converting thrown exceptions into failures.
- **Infrastructure (Web) Layer**: Maps `Result.code` to HTTP Status.
    - `ResultCode.NOT_FOUND` -> 404
    - `ResultCode.PERMISSION_DENIED` -> 403
    - `ResultCode.SUCCESS` -> 200

## Consequences
- **Positive**:
    - "Thinking in Results" becomes the universal language.
    - AI Agents can reliably generate correct return types.
    - Frontend data fetching becomes predictable (`if (!res.ok) handle(res.error)`).
- **Negative**:
    - Requires refactoring existing code using `ResponseBuilder` or `success: boolean`.

## Migration Strategy
1. Update transport adapters to consume `Result<T>` instead of legacy types.
2. Keep persistence interfaces free to throw structured errors where that keeps use cases simpler.
3. Mark `contracts/src/response` as `@deprecated`.
4. Bulk refactor Controllers/module APIs to use shared Result helpers.
