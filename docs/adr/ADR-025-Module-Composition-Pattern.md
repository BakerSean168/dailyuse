# ADR-025: Module Composition Pattern

**Status:** Accepted
**Date:** 2026-01-21
**Context:** Monorepo architecture optimization and Dependency Injection strategy.

## Context
As we refactor to Clean Architecture (ADR-023), we are moving away from Global Singletons (`Container.getInstance()`) in the Infrastructure layer.
We need a standard pattern for how the `apps/api`, `apps/worker`, and other applications assemble the system.

## Decision
We will adopt the **Module Composition Pattern**.

### 1. Infrastructure Modules
Each domain in `packages/infrastructure-server` will export a **Module Class** (e.g., `GoalModule`, `AccountModule`).
This class is responsible for:
-   Accepting "Global Dependencies" (DB Connection, Event Bus, Config) in its constructor.
-   Instantiating concrete Repositories.
-   Instantiating Application Services with those Repositories.
-   Exposing the instantiated Services as public readonly properties.

### 2. Composition Root (The App)
The Application Entry Point (`main.ts` in `apps/api`) acts as the Composition Root.
-   It initializes the fundamental technical drivers (Prisma, Redis).
-   It instantiates the Infrastructure Modules.
-   It passes the Services from the Modules to the Interface Layer (Controllers/Routes).

## Example

**Infrastructure Module:**
```typescript
export class GoalModule {
  public readonly archiveGoal: ArchiveGoal;
  
  constructor(prisma: PrismaClient) {
     const repo = new PrismaGoalRepository(prisma);
     this.archiveGoal = new ArchiveGoal(repo); // DI Wiring happens here
  }
}
```

**Application Assembly:**
```typescript
// apps/api/src/main.ts
const prisma = new PrismaClient();
const goalModule = new GoalModule(prisma); // Wire the module

// Pass service to route factory
const goalRouter = createGoalRouter(goalModule.archiveGoal); 
```

## Consequences
-   **Explicit Wiring:** No hidden dependencies.
-   **Multi-App Support:** Easy to reuse the same `GoalModule` in CLI or Worker apps.
-   **Testing:** Easy to swap `GoalModule` with `MockGoalModule` in integration tests.
