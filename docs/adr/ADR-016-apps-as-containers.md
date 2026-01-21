# ADR-016: Apps as Containers & Atomic Architecture

## Status
Accepted

## Context
The project uses an Nx Monorepo structure, but there is a risk of treating it as a "Polyrepo" by putting too much logic inside `apps/`.
This leads to:
1.  Low code reusability (logic trapped in `apps/web` cannot be used in `apps/desktop`).
2.  Slow CI/CD (changing one component rebuilds the whole app).
3.  Blurred architectural boundaries.

## Decision
We adopt the **"Apps as Containers"** philosophy, combined with strict **DDD Layering**.

### 1. The Role of `apps/`
Applications (`apps/api`, `apps/web`, `apps/desktop`) are **strictly containers**.
- **Allowed Content**:
    - Entry points (`main.ts`, `index.tsx`).
    - Dependency Injection configuration (Wiring Domain to Infrastructure).
    - Environment variables config.
    - Global routing maps.
- **FORBIDDEN Content**:
    - Business Logic.
    - Domain Entities.
    - Complex UI Components (move to `packages/ui-*` or `packages/feature-*`).

### 2. Atomic Packages with DDD
We organize our `packages/` to support both horizontal scaling (Features) and vertical layering (DDD).

- **Feature Modules** (e.g., `packages/domain-server/src/goal`) are the atomic units of business logic.
- **Layers**:
    - `contracts`: **Type Definitions ONLY**.
    - `domain`: **Pure Logic ONLY**.
    - `infrastructure`: **Implementation ONLY**.
    - `ui`: **Presentation ONLY**.

### 3. Dependency Rule
Apps depend on Packages. Packages do NOT depend on Apps.
`apps/api` -> imports -> `packages/application-server` -> imports -> `packages/domain-server`.

## Consequences
- **Positive**:
    - Sharing `goal` logic between API and Desktop becomes trivial.
    - Enforces loose coupling.
- **Negative**:
    - Requires more boilerplate to "wire up" the app in `main.ts`.
