# ADR-010: Standard - Centralized Contracts

## Status
Accepted

## Date
2026-01-15

## Context
Code duplication of types (e.g., `User`, `TaskDTO`) across Frontend, Backend, and Desktop processes leads to synchronization bugs. If the API changes but the frontend type isn't updated, the app crashes at runtime. Ad-hoc/inline type definitions make refactoring dangerous.

## Decision
All shared types must be defined in the unique source of truth: `packages/contracts`.

### 1. "Single Source of Truth" Rule
*   Any type used by more than one package (e.g., API <-> UI, or Domain <-> Infra) MUST reside in `contracts`.
*   **Forbidden:** Inline definitions in `application-*` or `infrastructure-*`.

### 2. What goes into Contracts?
*   **Entities:** Core business objects (`Task`, `User`).
*   **DTOs:** API Request/Response shapes (`CreateTaskRequest`, `TaskResponse`).
*   **Results:** Operation result wrappers (`ActionResult`, `CountResult`).
*   **Enums:** Shared state indicators (`TaskStatus`, `Priority`).
*   **Interfaces:** Service contracts (`IRepository`, `ILogger`).
*   **Constants:** Shared business rules/magic numbers.

### 3. Usage
```typescript
// Correct
import type { Task, CreateTaskRequest } from '@dailyuse/contracts';

// Incorrect
export interface MyLocalTask { id: string... } // ❌ Don't redefine
```

## Consequences
*   **Positive:** "Change once, update everywhere"; Compiler errors catch integration mismatches immediately; Zero circular dependencies.
*   **Negative:** Developers must run the build/watch process for `contracts` when adding new fields.
