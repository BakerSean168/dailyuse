# ADR-008: Standard - API Response Format

## Status
Accepted

## Date
2026-01-15

## Context
Inconsistent API response formats make frontend integration and cross-service communication error-prone. Different modules using `success: true`, `ok: true`, or just returning raw data leads to confusion and defensive programming overhead.

## Decision
All operations must return a unified response object structure. We adopt the `ok: boolean` pattern defined in `@dailyuse/contracts`.

### 1. Unified Response Structure
```typescript
interface BaseResponse<T> {
  ok: boolean;      // ✅ REQUIRED: Indicates operation success/failure
  data?: T;         // OPTIONAL: Result payload on success
  error?: ErrorInfo;// OPTIONAL: Error details on failure
}
```

### 2. Forbidden Patterns
*   ❌ `success: boolean` (Do not use "success")
*   ❌ Raw data return (e.g., returning just `User` object instead of `{ ok: true, data: User }` for operations prone to failure)

### 3. Usage of Contract Types
Implementations must use the exact types from `@dailyuse/contracts`:

*   **Simple Actions:** `ActionResult`
*   **Data Retrieval:** `ActionWithDataResult<T>`
*   **Batch Operations:** `BatchActionResult`
*   **Counts:** `CountResult`
*   **IPC:** `IpcResult<T>`
*   **HTTP:** `HttpResponse<T>`

### 4. Code Example
```typescript
import type { ActionWithDataResult } from '@dailyuse/contracts';

// Correct
export async function getUser(id: string): Promise<ActionWithDataResult<User>> {
  try {
    const user = await db.find(id);
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: toErrorInfo(e) };
  }
}
```

## Consequences
*   **Positive:** Predictable client-side error handling; Type safety across the stack.
*   **Negative:** Legacy endpoints returning raw JSON must be refactored to wrap responses.
