# Refactoring & Optimization Log

This document tracks system-wide optimization decisions, technical debt payments, and standardization efforts.

## Open Issues

### 1. API Response Unification (ADR-015)
- **Problem**: Mixed usage of `Result` (new) and `Response` (legacy).
- **Solution**: Enforce `Result<T>` everywhere.
- **Status**: [ ] Pending Implementation
- **Action Items**:
    - [ ] Update `docs/standards/patterns.md` to reference ADR-015.
    - [ ] Refactor `packages/utils` to Drop legacy response support.
    - [ ] Scan and fix Application Services returning `{ success: true }`.

### 2. (Next Topic Placeholder)
- **Problem**: ...
- **Solution**: ...

## Completed Items
- **Documentation Restructure**: Split into `docs/standards/*.md` for better AI context. (2026-01-16)

## Epic: The Great Atomic Refactor (Apps as Containers)

**Status**: Planned
**Start Date**: 2026-01-16
**Driver**: Agent BMad Master

###  Goal
Transform \pps/api\ and \pps/web\ into **Pure Containers** by extracting all business logic, data access, and UI features into atomic packages. Ensure perfect adherence to **Type Centralization** (Contracts) and the **Result Pattern**.

###  Strategy
1. **Horizontal Slicing**: Tackle one module at a time (e.g., starts with \goal\ cleanup, then \	ask\, \uth\).
2. **Strict Layering**: Enforce the \Contracts -> Domain -> Application -> Infrastructure\ flow.
3. **Assembly Pattern**: The Apps should only perform DI wiring and routing configuration.

###  Phases

#### Phase 1: Foundation & Contracts (The Legislative Branch)
- [x] Establish Standards (ADR-016, ADR-017).
- [ ] **Task 1.1**: Create/Standardize the \contracts\ folder structure for strict \pi\ vs \domain\ separation.
- [ ] **Task 1.2**: Audit and move ALL shared types from \	ypes.ts\ files in apps/packages to \@dailyuse/contracts\.

#### Phase 2: Logic Extraction (The Executive Branch)
- [ ] **Task 2.1 (Backend)**: Move \pps/api/src/modules/*/application\ Services to \packages/application-server\.
- [ ] **Task 2.2 (Backend)**: Move \pps/api/src/modules/*/infrastructure\ Repositories to \packages/infrastructure-server\.
- [ ] **Task 2.3 (Frontend)**: Extract Frontend Logic (Stores/Services) from \pps/web\ to \packages/application-client/infrastructure-client\.

#### Phase 3: UI & Feature Extraction
- [ ] **Task 3.1**: Move \pps/web/src/modules/*/presentation\ components to \packages/ui-features\ (or specific feature libs).
- [ ] **Task 3.2**: Convert \pps/web\ views to use imported Feature Components.

#### Phase 4: API & Container Cleanup
- [ ] **Task 4.1**: Refactor Controllers in \pps/api\ to use the **Result Pattern** exclusively (ADR-015).
- [ ] **Task 4.2**: Verify \pps/api\ contains NO business logic, only wiring.

###  Question/Conflict Log
*(Record any ambiguous architectural decisions here)*
- [ ] **Q1**: Controllers placement? Should Controllers reside in \pps/api\ (as part of the HTTP adapter) or in a \packages/interface-adapter-server\?
  - *Current thought*: Keep in App for simplicity unless shared with another HTTP entry point, BUT moving to a package makes the App cleaner.
- [ ] **Q2**: Frontend Module Routing? Should routes be defined in the App or the Feature Package?
  - *Proposal*: Feature Package exports a route object/component; App aggregates it.


## 2026-01-17: Goal Module Backend Extraction

- **Moved** Application Services to @dailyuse/application-server/goal.
- **Moved** Infrastructure Repositories to @dailyuse/infrastructure-server/goal.
- **Refactored** GoalContainer to manage both Services and Repositories (IoC).
- **Simplified** GoalController, GoalStatisticsController, GoalFolderController to delegate to GoalContainer.
- **Fixed** GoalEventPublisher and GoalTaskEventHandlers to be pure classes injected via GoalContainer.
- **Result**: pps/api is now a thinner container for the Goal module.
