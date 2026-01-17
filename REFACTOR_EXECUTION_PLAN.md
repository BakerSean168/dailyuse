# Comprehensive Refactor Execution Plan: The Atomic Architecture

**Driver**: Agent BMad Master
**Date**: 2026-01-17
**Objective**: Complete adherence to ADR-015, ADR-016, ADR-017.

This document outlines the step-by-step execution plan for transforming the DailyUse codebase into a strict Atomic DDD architecture.

## 1. The Standard Operating Procedure (SOP)

For EACH Feature Module (e.g., `goal`, `task`, `auth`), we will execute the following rigorous process:

### Step 1: Contract Normalization (ADR-017)
**Goal**: The `packages/contracts` module becomes the single source of truth.
1.  **Analyze**: Scan `apps/api/src/modules/<module>` and `apps/web/src/modules/<module>` for locally defined interfaces/types/DTOs.
2.  **Restructure**: Ensure `packages/contracts/src/modules/<module>` exists and follows the strict structure:
    ```text
    contracts/src/modules/<module>/
    ├── index.ts
    ├── domain/           # Entities (Server/Client split)
    ├── api/              # DTOs (Requests/Responses)
    ├── ui/               # Props/State
    └── enums.ts
    ```
3.  **Migrate**: Move all types to contracts.
4.  **Refactor**: Update all imports in the codebase to point to `@dailyuse/contracts/<module>`.

### Step 2: Backend Logic Extraction (ADR-016)
**Goal**: `apps/api` becomes a pure container.
1.  **Application Layer**: Move `apps/api/src/modules/<module>/application/*` to `packages/application-server/src/<module>/*`.
2.  **Infrastructure Layer**: Move `apps/api/src/modules/<module>/infrastructure/*` to `packages/infrastructure-server/src/<module>/*`.
3.  **Result Pattern**: Refactor all Services and Repositories to return `Result<T>` instead of raw data or throwing errors (ADR-015).
4.  **Controller Cleanup**: Functionality in Controllers must be reduced to: `Receive DTO -> Call Service -> Return Result`.

### Step 3: Frontend Feature Extraction (ADR-016)
**Goal**: `apps/web` becomes a pure container.
1.  **Business Logic**: Move Stores (Pinia) and Services to `packages/application-client/src/<module>`.
2.  **UI Components**: Identify "Smart" components in `apps/web/src/modules/<module>/presentation`.
    *   Move reusable/atomic components to `packages/ui-<framework>`.
    *   Move feature-specific complex components to `packages/feature-<module>` (or `packages/ui-features`).
3.  **Routing**: Define route configuration objects in the package, import them in `apps/web`.

### Step 4: Container Wiring
1.  **API**: `apps/api/src/modules/<module>` should only contain `*.module.ts` (NestJS) or `container.ts` (DI) wiring the exported classes from packages.
2.  **Web**: `apps/web` imports the feature roots.

---

## 2. Module Execution Manifest

We will process modules in the following order of complexity and dependency.

### Batch 1: Core Fundamentals (High Dependency)
*These modules define the base for others.*
- [ ] **Authentication (`auth`)**
    - High risk. Touches headers, guards, middleware.
    - Needs strict `contracts/modules/authentication` setup.
- [ ] **Account (`account`)**
    - Base user entity.
- [ ] **System / Setting**
    - Configuration and shared utilities.

### Batch 2: Business Core (The "Meat")
*These are the primary features of the app.*
- [ ] **Goal (`goal`)**
    - *Pilot Module*. Already partially structured. Needs cleanup.
- [ ] **Task (`task`)**
    - Complex aggregates (Recurrence, Subtasks).
- [ ] **Schedule / Calendar**
    - Heavy date logic.
- [ ] **Reminder / Notification**
    - Cross-cutting concerns.

### Batch 3: Specialists
- [ ] **Editor** (Rich Text logic)
- [ ] **Dashboard** (Aggregation logic)
- [ ] **AI** (External service integration)
- [ ] **Metrics / Repository** (Analytics)

---

## 3. Directory Structure Refactor Target

We will enforce file location changes. Here is the mapping:

| Current Location (Example) | Target Location |
| --- | --- |
| `apps/api/src/modules/task/services/TaskService.ts` | `packages/application-server/src/task/services/TaskService.ts` |
| `apps/api/src/modules/task/infrastructure/PrismaRepo.ts` | `packages/infrastructure-server/src/task/repositories/PrismaTaskRepository.ts` |
| `apps/api/src/modules/task/dto/CreateTask.dto.ts` | `packages/contracts/src/modules/task/api/requests/CreateTaskRequest.ts` |
| `apps/web/src/modules/task/store/useTaskStore.ts` | `packages/application-client/src/task/stores/useTaskStore.ts` |
| `apps/web/src/modules/task/components/TaskCard.vue` | `packages/ui-features/src/task/components/TaskCard.vue` |

---

## 4. Conflict Resolution & FAQ

**Q: Where do Controllers go?**
*   **Decision**: Controllers stay in `apps/api` (Container) OR `packages/interface-adapter`.
*   **Plan**: For now, keep them in `apps/api` as the "HTTP Adapter", but strip them of ALL logic. They just translate HTTP <-> Result.

**Q: Where do standard UI components go?**
*   **Decision**: `packages/ui-shadcn` (or similar) for buttons/inputs. `packages/ui-features` for business components.

**Q: Result Pattern implementation?**
*   **SOP**: Every public method in `packages/domain` and `packages/application` MUST return `Result<T>`.

---

## 5. Validation Checklist

Before marking a module as "Done":
- [ ] No `export interface` in `packages/domain-*` or `packages/application-*`.
- [ ] No `prisma` imports in `packages/domain-*`.
- [ ] No business logic in `apps/api` controllers.
- [ ] `contracts` folder has strict `api/domain/ui` structure.
- [ ] Application builds and tests pass.
