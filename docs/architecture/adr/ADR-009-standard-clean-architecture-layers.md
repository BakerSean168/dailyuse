# ADR-009: Standard - Clean Architecture Layers

## Status
Accepted

## Date
2026-01-15

## Context
Without strict architectural boundaries, business logic leaks into UI components, and database details pollute the domain. This leads to a rigid, hard-to-test codebase where changing a library (e.g., ORM, UI framework) breaks the entire application.

## Decision
We enforce a strict **Clean Architecture** with a unidirectional dependency flow.

### 1. Layers & Dependency Rules (Inner to Outer)

**Domain Layer (Core)**
*   **Contains:** Entities, Value Objects, Domain Services, Repository *Interfaces*, Domain Events.
*   **Dependencies:** ZERO. Must depend on nothing but itself (and shared Contracts).
*   **Forbidden:** Importing from App, Infra, or UI layers.

**Application Layer (Use Cases)**
*   **Contains:** Application Services, Use Case definitions, Command/Query handlers.
*   **Dependencies:** Domain.
*   **Forbidden:** Importing from Infra or UI.

**Infrastructure Layer**
*   **Contains:** Database Implementations (Prisma), External Adapters (Stripe, Email), OS interactions (FileSystem).
*   **Dependencies:** Domain, Application.

**Presentation Layer (UI)**
*   **Contains:** Vue/React Components, Controllers, IPC Handlers.
*   **Dependencies:** Application, Domain.

### 2. Package Responsibilities
*   `contracts`: Shared types (No deps).
*   `domain-server`/`domain-client`: Pure business logic.
*   `application-server`/`application-client`: Use cases.
*   `infrastructure-*`: Technical implementations.
*   `ui-*`: Visuals.

### 3. Code Example
```typescript
// Domain (Interface)
export interface ITaskRepository {
  save(task: Task): Promise<void>;
}

// Application (Use Case)
export class CreateTask {
  constructor(private repo: ITaskRepository) {} // Depends on abstraction
}

// Infra (Implementation)
export class PrismaTaskRepo implements ITaskRepository { ... } // Depends on Domain
```

## Consequences
*   **Positive:** High testability (can mock Domain interfaces); Framework independence; Clear separation of concerns.
*   **Negative:** More boilerplate files (Interfaces, Implementations, DTOs) compared to "Transaction Script" patterns.
