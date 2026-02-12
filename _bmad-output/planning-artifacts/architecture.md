---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/business-process-flows.md
  - docs/deep-dive-refactored-core-packages.md
  - _bmad-output/planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'dailyuse'
user_name: 'Baker'
date: '2026-02-07'
lastStep: 8
status: 'complete'
completedAt: '2026-02-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The Governance (Living Document) module provides Rule CRUD with strict DDD patterns, tag-based discovery, keyword search, lifecycle constraints (MANDATORY to RECOMMENDED to DEPRECATED), and Good/Bad example rendering. It must support live code references and audit trail capture via RuleRevision. Access is role-based, with engineers read-only and tech leads/architects able to publish.

**Non-Functional Requirements:**
- Performance: search under 200 ms; rule detail view under 500 ms.
- Reliability: 99.5% availability during business hours.
- Security: RBAC and append-only audit history.
- Accessibility: mandatory dark mode and keyboard navigation.
- Maintainability: strict adherence to DDD patterns and linting rules defined by the module itself.

**Scale and Complexity:**
Medium complexity driven by lifecycle enforcement, immutable audit logging, and live reference validation.

- Primary domain: internal developer tool (full-stack)
- Complexity level: medium
- Estimated architectural components: domain core + application services + repository + API layer + UI rendering + export pipeline

### Technical Constraints and Dependencies

- Governance is a vertical-slice Nx library in packages/governance with internal contracts, domain, application, and infrastructure layers.
- Reference Goal module patterns for domain/contracts; treat existing infrastructure/application implementations as draft and refactor.
- Module is DI-first and not required to be runnable immediately; it must export a Module class or container configuration.
- Prisma/SQLite is the MVP repository path.
- Must support syntax highlighting for TypeScript, JSON, YAML, Prisma schema.

### Cross-Cutting Concerns Identified

- RBAC enforcement in API layer and domain constraints.
- Rule lifecycle validation across create/update/deprecate flows.
- Immutable audit trail with revision history.
- Search/filter performance and indexing strategy.
- Canonical code reference integrity checks.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack internal module within an Nx monorepo, consumed by web and desktop apps.

### Starter Options Considered

No external starter templates. This is a brownfield extension; we will scaffold a vertical-slice Governance library by mirroring Goal module patterns inside a single Nx package.

### Selected Starter: Existing Codebase Module Template

**Rationale for Selection:**
The monorepo already defines strict DDD conventions, contracts, and utilities. Reusing the Goal module structure ensures architectural consistency, avoids version drift, and preserves established patterns across domain, application, and infrastructure layers.

**Initialization Command:**
No external starter command. Create packages/governance with internal contracts, domain, application, and infrastructure layers, mirroring Goal patterns but refactoring application/infrastructure for higher quality.

**Architectural Decisions Provided by Existing Template:**

**Language and Runtime:**
TypeScript (strict) aligned with monorepo tsconfig rules.

**Backend Framework:**
Express with explicit router/controller/service layering; DDD patterns applied via explicit service instantiation or a lightweight DI container if present.

**Frontend Framework:**
Vue 3 (Composition API) consistent with existing UI architecture.

**Database/ORM:**
Prisma with SQLite for MVP.

**Shared Logic:**
Internalize contracts and domain within packages/governance; reference Goal patterns but avoid splitting across shared packages.

**Code Organization:**
Follow Goal module patterns but keep all layers inside packages/governance to ensure isolation.

**Development Experience:**
Leverages existing Nx build/lint/test workflows and standard monorepo tooling.

**Note:** The Governance module scaffold should be created by copying the Goal module structure and adapting to Governance-specific domain models and contracts.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Nx monorepo alignment: Governance must mirror the Goal module structure and libraries.
- Data persistence: Prisma + SQLite with Prisma Migrate.
- API style: Express REST with Result pattern mapping.
- Frontend: Vue 3 Composition API with Goal module state pattern.
- RBAC: reuse existing Auth module and role model.

**Important Decisions (Shape Architecture):**
- Validation: must follow Goal module validation pattern.
- Eventing: internal EventBus for domain events.
- Audit: append-only RuleRevision persistence.
- Packaging: vertical-slice Nx library with internal layers and DI-first module assembly.

**Deferred Decisions (Post-MVP):**
- Caching strategy (none for MVP; revisit if scale requires).
- Export pipeline (handbook/PDF) to be defined in later phase.

### Data Architecture

- **Database:** Prisma + SQLite (MVP).
- **Migrations:** Prisma Migrate (via existing Nx tasks).
- **Validation:** Follow Goal module validation approach (use the exact same library and patterns).
- **Caching:** None for MVP; SQLite sufficient for 500 active rules.

### Authentication and Security

- **RBAC:** Reuse existing Auth module roles (Admin/Tech Lead/Engineer).
- **Audit Integrity:** Append-only RuleRevision table; no destructive edits in application layer.

### API and Communication Patterns

- **API Style:** REST endpoints via Express Router/Controllers/Services.
- **Error Handling:** Result pattern mapped to HTTP response adapters.
- **Events:** Internal EventBus for domain events (e.g., `rule:deprecated`).

### Frontend Architecture

- **Framework:** Vue 3 Composition API.
- **State Management:** Follow Goal module state pattern (exact same library and store conventions).
- **Routing:** Vue Router using existing app configuration patterns.

### Infrastructure and Deployment

- **Deployment:** Reuse existing web/desktop pipelines.
- **Logging:** Reuse utils logger.

### Decision Impact Analysis

**Implementation Sequence:**
1. Create `packages/governance` with internal contracts, domain, application, and infrastructure layers.
2. Define contracts and domain value objects consistent with Goal patterns.
3. Implement domain aggregates/services/repositories with Prisma.
4. Implement DI-friendly application services and module assembly.
5. Implement Express adapters and Result response mapping.
6. Implement Vue 3 UI and store using Goal module patterns.
7. Wire EventBus domain events and audit logging.

**Cross-Component Dependencies:**
- Validation strategy depends on the Goal module current validation library.
- UI store conventions must mirror Goal module patterns to keep UX consistent.
- Module assembly must be compatible with the main app DI/container conventions.

## Architecture Decision Record: Module Structure & Refactoring Strategy

**Status:** Accepted
**Date:** 2026-02-07

### Context
The Governance module is a brownfield addition to an Nx monorepo. Existing modules are split across global packages, which increases coupling and drift. We need isolation and higher-quality infrastructure/application code than legacy patterns.

### Decision
1. **Packaging Strategy (Nx Vertical Slice):** Create a single, self-contained Nx library at packages/governance. This package must include internal contracts, domain, application, and infrastructure layers. The module is not split across packages/contracts or packages/domain-*.
2. **Reference Strategy (Hybrid):**
  - Domain and contracts: follow Goal module patterns as stable references.
  - Application and infrastructure: treat existing implementations as draft quality and refactor into cleaner, better-structured code.
3. **Assembly & Runnable State:** The module is DI-first and not required to be runnable immediately. It must export a Module class or container configuration so the main app can assemble it later without tight coupling.

### Consequences
- Governance code is isolated from legacy modules, reducing cross-module breakage risk.
- All layers live inside packages/governance with clear internal boundaries.
- Application/infrastructure code will be intentionally refactored above legacy quality.
- Integration into apps/api and apps/web is done via adapters once the module is assembled.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
Naming, API formats, module structure, event naming, and store conventions must mirror Goal to avoid drift.

### Naming Patterns

**Database Naming Conventions:**
- Follow existing Prisma schema conventions: lowercase model names and camelCase fields.
- Use @map only when existing schema uses snake_case.
- Mirror Goal module model naming conventions in Prisma schema.

**API Naming Conventions:**
- REST routes are plural nouns (e.g., /goals, /rules).
- Route params use :id.
- Use kebab-case file names in interface/ (e.g., rule-crud.routes.ts).

**Code Naming Conventions:**
- TypeScript uses camelCase for variables, PascalCase for classes/components.
- Store names: useXStore with defineStore('x', ...).
- DTOs and types follow *DTO naming from contracts.

### Structure Patterns

**Project Organization:**
- Mirror Goal module folder layout for API and web:
  - API: apps/api/src/modules/governance/{interface,initialization}
  - Web: apps/web/src/modules/governance/presentation/{stores,views,router,composables,widgets}
- Aggregate routes in an interface/index.ts router registration file.

**File Structure Patterns:**
- API routes live in interface/ and export registerXRoutes.
- Module initialization goes in initialization/ with registerXInitializationTasks.

### Format Patterns

**API Response Formats:**
- Provide a governance-local response builder that mirrors the Goal response shape and helpers.
- Success: responseBuilder.success(data, message?).
- Error: responseBuilder.error(status, message).

**Data Exchange Formats:**
- JSON fields are camelCase.
- Dates follow the existing DTO conventions from contracts.

### Communication Patterns

**Event System Patterns:**
- Event naming uses module:action (e.g., rule:deprecated).
- Payloads must mirror contracts event schemas when defined.

**State Management Patterns:**
- Pinia store defined in presentation/stores/*Store.ts.
- Store actions mutate state; composables orchestrate async calls and update store.

### Process Patterns

**Error Handling Patterns:**
- API: log error with createLogger, then surface via Result/response builder.
- Domain errors are mapped through Result adapters.

**Loading State Patterns:**
- Store contains isLoading and error fields.
- Composables toggle isLoading and set error consistently.

### Enforcement Guidelines

**All AI Agents MUST:**
- Reuse the same libraries as Goal for validation, stores, and response formatting, but implement governance-local equivalents inside packages/governance.
- Follow Goal module patterns while keeping all layers inside packages/governance.
- Use governance contracts DTOs and Result pattern for API responses.

**Pattern Enforcement:**
- Verify new module structure matches Goal module paths.
- Cross-check response wrapper usage in routes.
- Review store structure and naming against Goal store.

### Pattern Examples

**Good Examples:**
- registerCrudRoutes in interface/*-crud.routes.ts returning responseBuilder.success(...).
- defineStore('governance', ...) with GoalStore-like state and actions.

**Anti-Patterns:**
- Introducing new validation libraries not used by Goal.
- Returning raw payloads without responseBuilder.
- Vuex usage instead of Pinia.

## Project Structure & Boundaries

### Complete Project Directory Structure
```
packages/
  governance/
    src/
      contracts/
        aggregates/
        api/
        domain/
        dtos/
        entities/
        events/
        protocol/
        rules/
        value-objects/
        response/
        index.ts
      domain-shared/
      domain-client/
      domain-server/
        aggregates/
          rule.ts
        entities/
          rule-revision.ts
        repositories/
          rule-repository.ts
        services/
          rule-duplication-service.ts
        value-objects/
          rule-tag.ts
          code-snippet.ts
          rule-status.ts
          rule-severity.ts
        index.ts
      application/
        errors/
        event-handlers/
        RuleApplicationService.ts
        RuleRevisionApplicationService.ts
        RuleSearchApplicationService.ts
        RuleTagApplicationService.ts
        index.ts
      infrastructure/
        mappers/
        repositories/
        prisma/
          schema.prisma
        index.ts
      interface/
        express/
          governance-crud.routes.ts
          governance-search.routes.ts
          governance-tag.routes.ts
          governance-revision.routes.ts
          governance-status.routes.ts
          index.ts
      module.ts
apps/
  api/
    src/modules/
      governance/
        initialization/
          governanceInitialization.ts
        interface/
          index.ts
  web/
    src/modules/
      governance/
        initialization/
        presentation/
          components/
          composables/
            index.ts
          router/
            index.ts
          stores/
            governanceStore.ts
          views/
            GovernanceListView.vue
            GovernanceDetailView.vue
            RuleEditorView.vue
          widgets/
            registerGovernanceWidgets.ts
```

### Architectural Boundaries

**API Boundaries:**
- Governance REST endpoints are defined in packages/governance/src/interface/express and wired into apps/api via adapters.
- Auth middleware enforced at controller layer.
- Response format via governance-local response builder that mirrors Goal response format.

**Component Boundaries:**
- UI logic lives in composables; stores hold state; views are presentation-only.
- Widgets register with the existing widget system in apps/web.

**Service Boundaries:**
- Application services live inside packages/governance/src/application.
- Domain logic is isolated in packages/governance/src/domain.

**Data Boundaries:**
- Prisma schema lives inside packages/governance/src/infrastructure/prisma/schema.prisma.
- Governance tables are isolated within the module schema and integrated during app assembly.

### Requirements to Structure Mapping

**Feature Mapping:**
- Rule CRUD and lifecycle: RuleApplicationService, governance-crud.routes.ts, GovernanceDetailView.vue.
- Tagging and search: RuleSearchApplicationService, governance-search.routes.ts, GovernanceListView.vue.
- Good/Bad snippets: code-snippet.ts VO, RuleEditorView.vue.
- Rule revisions (audit): rule-revision.ts, RuleRevisionApplicationService, governance-revision.routes.ts.

**Cross-Cutting Concerns:**
- RBAC: API middleware in apps/api shared auth middleware.
- Audit append-only: RuleRevision persistence in governance infrastructure repositories.
- Eventing: rule lifecycle events via EventBus.

### Integration Points

**Internal Communication:**
- Application services publish domain events (EventBus).
- Web app consumes API and updates Pinia store through composables.

**External Integrations:**
- None new; reuse existing API and auth modules.

**Data Flow:**
- UI to API routes to application services to domain aggregates to repositories to Prisma.

### File Organization Patterns

**Configuration Files:**
- No new config files; reuse Nx and environment configuration.
- Prisma schema updates live under packages/governance/src/infrastructure/prisma/schema.prisma.

**Source Organization:**
- Governance mirrors Goal module patterns but remains fully contained in packages/governance.

**Test Organization:**
- Follow existing test location conventions per package (co-located or package test folders).

**Asset Organization:**
- UI assets live under module views/components/widgets as needed.

### Development Workflow Integration

**Development Server Structure:**
- API served via existing nx serve api once adapters assemble the module.
- Web module served via nx serve web.

**Build Process Structure:**
- Use existing Nx targets for build, lint, test.
- Prisma migrations for governance run from module-local schema once wired into the main app.

**Deployment Structure:**
- No new pipelines; Governance ships with the existing web and desktop builds.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All selected technologies and patterns align with the existing monorepo (Express, Vue 3, Prisma, Result pattern, EventBus). No contradictions detected.

**Pattern Consistency:**
Implementation patterns mirror the Goal module for routing, response formats, and Pinia store conventions while staying inside the governance package.

**Structure Alignment:**
The proposed Governance structure follows Goal patterns but consolidates all layers into packages/governance.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
CRUD, tag/search, Good/Bad examples, lifecycle rules, and audit logging all map to defined components and services.

**Non-Functional Requirements Coverage:**
Performance, RBAC, auditability, and maintainability are supported through existing architectural patterns and shared utilities.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions are documented; remaining uncertainty is limited to validation library usage and SQLite vs Postgres provider alignment.

**Structure Completeness:**
Directory structure and component boundaries are explicit enough for parallel implementation.

**Pattern Completeness:**
Naming, response formats, event naming, and store patterns are consistent with Goal.

### Gap Analysis Results

**Important Gaps:**
- Prisma provider mismatch risk: MVP requirement specifies SQLite; confirm provider strategy for the governance-local schema.
- Validation library confirmation: Goal module validation approach not yet verified; governance must match it exactly.

### Validation Issues Addressed

- Recorded provider mismatch as a decision to clarify before implementation.
- Recorded validation library match as a required codebase inspection step.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context analyzed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**

- [x] Stack decisions documented
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified

**✅ Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Requirements-to-structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION (with two clarifications noted)

**Confidence Level:** High

**Key Strengths:**
- Strong alignment with existing Goal module conventions
- Clear layering across contracts, domain, application, infrastructure, and apps
- Explicit consistency rules to avoid AI drift

**Areas for Future Enhancement:**
- Confirm validation library used by Goal
- Clarify SQLite provider usage for governance-local schema

### Implementation Handoff

**AI Agent Guidelines:**
- Follow Goal module libraries and patterns exactly
- Use Result pattern and response builder for all API outputs
- Keep EventBus naming consistent (module:action)

**First Implementation Priority:**
- Scaffold packages/governance with internal layers and module assembly, then wire adapters into apps/api and apps/web.
