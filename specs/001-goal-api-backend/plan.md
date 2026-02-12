# Implementation Plan: Goal Module API Backend

**Branch**: `001-goal-api-backend` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-goal-api-backend/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Complete the Goal module API backend implementation by developing the application and infrastructure layers following DDD architecture. The contracts and domain layers are already refactored. Implementation strictly follows governance module code patterns with use case-based application services, repository pattern for persistence, and Express API route registration.

## Technical Context

**Language/Version**: TypeScript 5.8.3+ (strict mode)
**Primary Dependencies**: 
- Backend: Express, Prisma ORM
- Domain: @dailyuse/contracts, @dailyuse/utils
- Testing: Vitest
**Storage**: Prisma with SQLite (local persistence), PostgreSQL (production)
**Testing**: Vitest with >70% coverage for business logic
**Target Platform**: Node.js 18+ (API server), Electron 30+ (Desktop main process)
**Project Type**: Monorepo module (Nx workspace with DDD layering)
**Performance Goals**: 
- 95% of progress updates reflected within 2 seconds
- Support 100+ goals and 500+ key results per user without slowdown
**Constraints**: 
- Maximum 5 key results per goal
- Progress values must be 0-100% (sum method may exceed 100%)
- Key result weights must be positive (normalized on calculation)
**Scale/Scope**: 
- Single-user focused (multi-tenant ready via accountUuid)
- CRUD operations for goals, key results, progress records, retrospectives, reminders
- Application and infrastructure layers (domain/contracts already exist)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Monorepo-First DDD Architecture** | ✅ PASS | Goal module follows DDD strictly: domain-server (entities, aggregates, repositories), application-server (use cases, services), infrastructure-server (implementations), api layer (Express routes) |
| **II. Type-Safe Full Stack (TypeScript Mandatory)** | ✅ PASS | All code in TypeScript strict mode; contracts define shared types; Prisma generates database types |
| **III. Multi-Platform Support (Web & Desktop Consistency)** | ✅ PASS | Business logic in packages/goal; platform-specific code in apps/api (Express) and apps/desktop (IPC handlers) |
| **IV. Code Consistency & Maintainability** | ✅ PASS | All files use kebab-case; patterns match governance module (use case classes, repository interfaces, Result pattern) |
| **V. Test-Driven Quality Assurance** | ✅ PASS (Critical Path) | Critical Path Testing approach: tests required for complex domain logic (Goal.calculateProgress, weight normalization) and critical use cases (CreateGoal, UpdateKeyResultProgress) with success/failure flows. Trivial boilerplate (getters, mappers) exempt. Target: >70% coverage for tested components. |
| **VI. Contract Standardization (Protocol/API/DTOs Layering)** | ✅ PASS | Contracts already exist in packages/contracts/src/modules/goal/ with proper layering (protocol, api, aggregates, dtos) |
| **VII. Example Modules as Executable Code Standards** | ✅ PASS | packages/contracts/src/modules/example/ and governance module serve as reference implementations |

**Gate Decision**: ✅ APPROVED - All architectural principles satisfied. Testing coverage will be validated during implementation.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/goal/
├── src/
│   ├── contracts/              # ✅ Already exists (shared type definitions)
│   ├── domain-server/          # ✅ Already exists (entities, aggregates, domain services)
│   │   ├── aggregates/         # Goal, KeyResult, etc.
│   │   ├── entities/
│   │   ├── repositories/       # IGoalRepository interfaces
│   │   ├── services/           # GoalDomainService
│   │   └── index.ts
│   ├── domain-shared/          # ✅ Already exists (shared domain primitives)
│   ├── application-server/     # 🚧 TO IMPLEMENT (use cases, application services)
│   │   ├── services/           # Individual use case classes (CreateGoal, UpdateGoal, etc.)
│   │   ├── mappers/            # Domain ↔ DTO conversion
│   │   ├── event-handlers/     # Domain event handlers
│   │   ├── errors/             # Application-specific errors
│   │   └── index.ts
│   ├── infrastructure-server/  # 🚧 TO IMPLEMENT (persistence, external services)
│   │   ├── repositories/       # PrismaGoalRepository, PrismaKeyResultRepository
│   │   ├── mappers/            # Prisma ↔ Domain mapping
│   │   ├── prisma/             # Prisma schema (if separate)
│   │   └── index.ts
│   └── index.ts                # Package entry point

apps/api/
└── src/modules/goal/           # 🚧 TO IMPLEMENT (Express API registration)
    ├── interface/              # Express route definitions
    │   ├── goal-crud.routes.ts
    │   ├── goal-key-result.routes.ts
    │   ├── goal-progress.routes.ts
    │   ├── goal-reminder.routes.ts
    │   └── index.ts            # Route aggregator
    ├── initialization/         # Module initialization
    │   └── goalInitialization.ts
    └── module.ts               # DI container assembly

apps/desktop/
└── src/main/modules/goal/      # 🚧 TO VERIFY (IPC handler registration)
    └── application/            # Desktop-specific application service facade
```

**Structure Decision**: Following governance module pattern with DDD layering inside packages/goal. Application layer uses individual use case classes (e.g., CreateGoal, UpdateGoal) that can be composed into larger application services. Infrastructure layer implements repository interfaces with Prisma. API module registers Express routes and wires dependencies.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
