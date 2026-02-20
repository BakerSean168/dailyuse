# ADR-012: Standard - Error Handling

## Status
Accepted

## Date
2026-01-15

## Context
Random error throwing (strings, generic Errors) and inconsistent catching make debugging impossible. A unified error strategy is needed for reliable operation.

## Decision
We adopt a typed classification of errors and a structured handling pattern.

### 1. Custom Error Types
Use specific error classes extending a base `AppError`.
*   `NotFoundError`: Resource missing (404).
*   `ValidationError`: Bad input (422).
*   `AppError`: Generic application base.

### 2. Error Codes
Errors must carry a machine-readable `code` (e.g., `AUTH_TOKEN_EXPIRED`, `TASK_NOT_FOUND`) to allow frontend localization and logic.

### 3. Try/Catch & Result Pattern
*   **Service Layer:** Throw specific errors (`throw new NotFoundError()`) to abort logic flow.
*   **Boundary Layer (Controller/IPC):** Catch exceptions and convert them to `ActionResult`.
    ```typescript
    try {
       await service.doIt();
       return { ok: true };
    } catch (e) {
       // Convert exception to serializable object
       return { ok: false, error: toErrorInfo(e) };
    }
    ```

### 4. Forbidden
*   ❌ `throw "string"`
*   ❌ Silent `catch (e) { }` (swallowing errors).
*   ❌ Returning generic "Error" without codes.

## Consequences
*   **Positive:** Frontend can react to specific errors (e.g., show login modal on `AUTH_EXPIRED`); Logs are meaningful.
*   **Negative:** Requires wrapping external library errors (e.g., catching Prisma errors and re-throwing AppErrors).
