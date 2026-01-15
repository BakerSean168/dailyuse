---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
inputDocuments:
  - docs/PRD-Task-Priority-Simplification.md
  - project-context.md
workflowType: architecture
project_name: dailyuse
user_name: Baker
date: '2026-01-15 07:18'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
*   **FR-001 (Entity Update)**: Task entity must decouple from persisted urgency and priority.
*   **FR-002 (New Field - Importance)**: Task entity enforces importance (User Input: Low/Medium/High/Critical).
*   **FR-003 (New Field - Time Anchor)**: Task entity enforces TaskTimeConfig/DueDate.
*   **FR-004 (Domain Logic)**: Implement PriorityCalculator as a pure Domain Service.
    *   Input: Importance, DueDate, ReferenceTime (passed from controller).
    *   Output: CalculatedPriority (number).
*   **FR-005 (Algorithm)**: Priority ~ Importance * W1 + (1/TimeRemaining) * W2.
    *   *Constraint*: Must handle infinite/null DueDates gracefully.
*   **FR-006 (Contract)**: API TaskDTO preserves priority field but it is now **read-only/computed**.
*   **FR-007 (Sorting)**:
    *   **Active View**: Support dynamic sortBy=priority (High overhead, memory sort or generated column).
    *   **Archive View**: Fallback to sortBy=completedAt (DB Index) to avoid performance cliffs.

**Non-Functional Requirements:**
*   **Dev-Phase Simplicity**: Breaking changes permitted. Focus on cleaner code over backward compatibility for this refactor.
*   **Performance**: Dynamic sorting O(n log n) in application layer is acceptable for N < 2000 active tasks.
*   **UX Stability**: Tasks must **not** auto-reorder while the user is viewing the list (avoids 
jumping UI). Priority re-calculation happens on Data Fetch (Refresh/Action), not real-time 1Hz ticking.

### Technical Constraints & Dependencies

*   **Database**: Postgres/SQL.
*   **Sorting Limitations**:
    *   Cannot standard ORDER BY priority on the DB side effectively without a Computed Column (Generated Column).
    *   *Decision*: For MVP, fetch all **active** tasks and sort in Application (Node.js). Pagination of *Active* tasks acts as a filter, not a hard DB limit.
*   **Legacy Data**: Old priority field can be dropped directly.

### Cross-Cutting Concerns & Strategies

*   **Data Migration Strategy (Breaking)**:
    *   Directly drop priority/urgency columns.
    *   Add importance column (default 'Medium' or mapped via simple script if keeping data).
    *   Prioritize clear domain modeling over complex transition logic.
*   **Client-Side Staleness**:
    *   Priority score decays/grows with time. Frontend treats the score as a snapshot at the time of GET /tasks.
    *   No websockets/timers needed for priority updates.


## Starter / Foundation Evaluation

**Existing Foundation Detected**: Project is an established **Nx Monorepo** with strict **Clean Architecture**.

**Decision**: No new starter template required. We will build upon the existing infrastructure.

**Architectural Alignment for Priority Refactor:**
*   **Domain Logic**: Will reside in \packages/domain-server\.
*   **Orchestration**: Will reside in \packages/application-server\.
*   **Shared Contracts**: Will reside in \packages/contracts\.
*   **Database Access**: Will reside in \packages/infrastructure-server\.

**Key Constraints Confirmed:**
*   **Strict Layering**: No shortcuts. Domain cannot import Infra.
*   **Centralized Types**: DTOs must live in Contracts to be shared with \pps/web\ and \pps/desktop\.


## Core Architectural Decisions (Task Refactor)

### 1. Priority Calculation Strategy
*   **Decision**: Use **Domain Service Pattern** (\PriorityCalculatorService\).
*   **Rationale**: Requires pure domain logic but depends on runtime context (Current Time). A service allows injecting a \TimeProvider\ for deterministic unit testing, adhering to strict DDD/Clean Architecture.
*   **Location**: \packages/domain-server/src/services/priority-calculator.service.ts\

### 2. DTO Assembly & Orchestration
*   **Decision**: Perform calculation in **Application Layer (Use Cases)**.
*   **Rationale**: The Repository must remain pure (Data persistence only). The Use Case orchestrates fetching entities, invoking the Calculator Service, and mapping to the DTO.
*   **Implication**: Sorting by priority happens in memory within the Use Case (Accepted performance trade-off for N < 2000 active tasks).

### 3. API Contract & Data Types
*   **Decision**: 
    *   **Reuse Existing Enum**: \ImportanceLevel\ (Vital, Important, Moderate, Minor, Trivial) from \packages/contracts/src/shared/importance.ts\.
    *   **Modify TaskDTO**: 
        *   Change \priority\: Now a \
umber\ (Calculated Score).
        *   Add \importance\: \ImportanceLevel\ (User Input).
        *   Remove \urgency\: Deprecated/Calculated internally.
*   **Rationale**: Leveraging existing types reduces friction. Explicit score type avoids frontend ambiguity.


## Project Structure & Boundaries

### Concrete File Structure

\\\	ext
packages/
 contracts/
    src/
        modules/                     [CORRECTED: Modular structure]
            task/
                task-defs.ts         [MODIFIED: Entity definition]
                task-dtos.ts         [MODIFIED: DTO/API definition]
 domain-server/
    src/
        task/                        [EXISTING MODULE]
            errors/
               priority-calculation.error.ts [NEW]
            services/
                priority-calculator.service.ts [NEW]
                priority-calculator.service.spec.ts [NEW]
 application-server/
    src/
        task/                        [EXISTING MODULE]
            services/
                task-query.service.ts [MODIFIED]
 infrastructure-server/
     src/
         task/                        [EXISTING MODULE]
             repositories/
                 prisma-task.repository.ts [MODIFIED]
\\\

### Integration Boundaries
*   **API Contract Boundary**: Defined strictly in \contracts/src/modules/task\. All apps (Web, Desktop, API) import from here.
*   **Domain Module Boundary**: \domain-server/src/task\. No logic leaks to global services.


## Project Structure & Boundaries

### Concrete File Structure

\\\	ext
packages/
 contracts/
    src/
        modules/                     [CORRECTED: Modular structure]
            task/
                task-defs.ts         [MODIFIED: Entity definition]
                task-dtos.ts         [MODIFIED: DTO/API definition]
 domain-server/
    src/
        task/                        [EXISTING MODULE]
            errors/
               priority-calculation.error.ts [NEW]
            services/
                priority-calculator.service.ts [NEW]
                priority-calculator.service.spec.ts [NEW]
 application-server/
    src/
        task/                        [EXISTING MODULE]
            services/
                task-query.service.ts [MODIFIED]
 infrastructure-server/
     src/
         task/                        [EXISTING MODULE]
             repositories/
                 prisma-task.repository.ts [MODIFIED]
\\\

### Integration Boundaries
*   **API Contract Boundary**: Defined strictly in \contracts/src/modules/task\. All apps (Web, Desktop, API) import from here.
*   **Domain Module Boundary**: \domain-server/src/task\. No logic leaks to global services.


## Architecture Validation Results

### Coherence & Architecture Health 
*   **Modular Integrity**: The decision to move contracts to \modules/task\ ensures true Bounded Context isolation.
*   **Logic Isolation**: \PriorityCalculatorService\ effectively isolates the complexity of time-based scoring from the rest of the application.

### Requirements Coverage 
*   All Functional Requirements (FR-001 to FR-007) are mapped to specific files.
*   Sorting limitations (FR-007) are addressed via Use Case orchestration.

### Operational Gaps Identified (To Be Addressed During Implementation) 
*   **Data Migration Script**: While the strategy is \
Drop
and
Replace\ (Dev Phase), we explicitly need a script or Prisma command execution plan.
    *   *Action*: Developer must run \
px prisma migrate dev --name refactor_priority\ and manually ensure \importance\ enum types in DB map correctly if existing data needs preservation (or just truncate for dev).

### Final Status
**READY FOR IMPLEMENTATION**. The architecture provides a complete blueprint for the Task Priority Refactor.

