# Implementation Plan: Governance Module

**Branch**: `001-governance-module` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [specs/001-governance-module/spec.md](spec.md)

## Summary

The Governance module is a living constitution for the monorepo that dogfoods the refactored DDD architecture and turns standards into managed, versioned, and executable rules. Built on the renamed `example-sample` → `governance` package foundation, it provides Rule CRUD with strict lifecycle constraints, tag-based discovery, keyword search with relevance scoring, Good/Bad code example rendering, and immutable audit trails. The module follows vertical-slice architecture within a single Nx library (`packages/governance`), mirroring the Goal module's DDD patterns while consolidating all layers (contracts, domain, application, infrastructure) internally. Primary users are engineers  and tech leads; success is measured by 30-second pattern discovery time, 50% reduction in architecture review comments, and 100% dogfooding compliance.

## Technical Context

**Language/Version**: TypeScript 5.8.3+ with strict mode enabled  
**Primary Dependencies**: 
  - Backend: NestJS (latest LTS), Prisma ORM, Express Router
  - Frontend Web: Vue 3 + Vuetify (latest stable), Pinia state management
  - Frontend Desktop: React + shadcn/ui (latest stable), Electron 30.x+ renderer
  - Shared: Zod (validation), Nx 21.4.1+ (monorepo tooling)
**Storage**: Prisma + SQLite (MVP); governance-local schema integrated into main app database  
**Testing**: Vitest (unit + integration), >80% coverage required for domain layer  
**Target Platform**: 
  - API: Node.js 18+ server (Express/NestJS)
  - Web: Modern browsers (Vue 3 SFC)
  - Desktop: Electron 30.x+ (Windows/macOS/Linux)
**Project Type**: Full-stack monorepo module (vertical-slice Nx library + API adapters + UI presentation layers)  
**Performance Goals**: 
  - Search results: <200ms (tag/keyword filters)
  - Rule detail view: <500ms (including syntax highlighting for TypeScript/JSON/YAML/Prisma)
  - Build time: Nx cache-enabled incremental builds
**Constraints**: 
  - Dogfooding: Governance source code MUST pass all rules it defines (Props Object pattern, private constructors, factory methods)
  - RBAC: Engineers read-only; Tech Leads/Architects can create/publish rules
  - Audit integrity: Append-only RuleRevision table (immutable history)
  - Lifecycle enforcement: MANDATORY rules cannot be deprecated directly (must downgrade to RECOMMENDED first)
  - Deletion policy: Hard delete only for Draft rules without revisions
**Scale/Scope**: 
  - Users: 10-100 active engineers
  - Data: 5 seed rules (MVP), 500+ active rules (post-launch)
  - UI: 3 primary views (list, detail, editor) + search/filter components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Monorepo-First DDD Architecture** | ✅ PASS | Governance follows strict DDD layering: contracts, domain-shared, domain-server, domain-client, application, infrastructure. Vertical-slice package at `packages/governance` prevents circular dependencies. |
| **II. Type-Safe Full Stack (TypeScript Mandatory)** | ✅ PASS | All code in TypeScript strict mode. Prisma schema as single source of truth for Rule, RuleRevision, CodeSnippet types. No `any` types planned. |
| **III. Multi-Platform Support (Web & Desktop Consistency)** | ✅ PASS | Domain logic (`domain-server`, `domain-shared`) is platform-agnostic. Presentation layer separated for Vue 3 (web) and React (desktop renderer). Business logic NOT tied to Vue/React APIs. |
| **IV. Code Consistency & Maintainability** | ✅ PASS | All files use kebab-case: `rule.ts`, `rule-revision.ts`, `governance-crud.routes.ts`, `governance-store.ts`. Module structure mirrors example-sample (now governance) patterns. |
| **V. Test-Driven Quality Assurance** | ✅ PASS | Domain layer requires >80% coverage. Unit tests colocated with source. Integration tests for API endpoints. E2E deferred to post-MVP. |
| **VI. Contract Standardization (Protocol/API/DTOs Layering)** | ✅ PASS | Governance uses Protocol → API → DTOs layering. RPC map in `protocol/governance-rpc-map.ts` imports types from `api/`. Event map in `protocol/governance-event-map.ts` defines domain events. DTOs in `dtos/` for composed types. |
| **VII. Example Modules as Executable Code Standards** | ⚠️ **CRITICAL** | **DOGFOODING REQUIREMENT**: The Governance module IS the new canonical example for DDD patterns. It replaces `example-sample` as the reference implementation. Source code MUST demonstrate: Props Object pattern, private constructors, factory methods, lifecycle state machines, immutable audit trails. Failing to comply undermines the module's core value proposition. |

**Gate Decision**: ✅ **PROCEED** (with critical dogfooding constraint)

**Justification**: All constitution principles pass. Principle VII (Example Modules) triggers the **dogfooding gate**: Governance source code MUST be exemplary quality since it defines the standards. This is not a violation—it's the module's purpose. However, we MUST verify compliance in Phase 1 design and before merge.

**Re-check Post-Design**: After Phase 1 (data-model.md, contracts/), verify:
1. Rule aggregate uses Props Object pattern
2. All domain objects use private constructors + factory methods
3. RuleStatus value object enforces state machine transitions
4. RuleRevision is append-only (no update/delete methods)
5. All contracts follow Protocol → API → DTOs layering exactly

## Project Structure

### Documentation (this feature)

```text
specs/001-governance-module/
├── spec.md              # Feature specification (completed via /speckit.specify)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (entity design)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts + Zod schemas)
│   ├── rpc-map.ts       # RPC operation type map
│   ├── event-map.ts     # Domain event type map
│   ├── requests.ts      # CreateRuleReq, UpdateRuleReq, etc.
│   └── responses.ts     # RuleRes, RuleListRes, etc.
├── checklists/          # Quality validation
│   └── requirements.md  # Spec completeness checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```text
packages/
  governance/                           # Vertical-slice Nx library (renamed from example-sample)
    src/
      contracts/                        # Type definitions, DTOs, Events, API Schemas
        aggregates/                     # Rule, RuleRevision interface definitions
          rule-client.ts                # RuleClientDTO, RuleClient
          rule-server.ts                # RuleServerDTO, RuleServer, RulePersistenceDTO
        entities/                       # Child entities (if any)
        value-objects/                  # RuleStatus, RuleSeverity, RuleTag, CodeSnippet types
          rule-status.ts                # Draft/Active/Deprecated enum + type
          rule-severity.ts              # Mandatory/Recommended enum + type
          rule-tag.ts                   # Tag interface
          code-snippet.ts               # GoodExample/BadExample types
        domain/
          events/                       # Domain events
            rule-created.event.ts       # RuleCreatedEvent
            rule-deprecated.event.ts    # RuleDeprecatedEvent
            rule-status-changed.event.ts
        protocol/                       # RPC/Event maps
          governance-event-map.ts       # 'rule:created', 'rule:deprecated', etc.
          governance-rpc-map.ts         # 'rule:create', 'rule:update', 'rule:search', etc.
        api/                            # Request/Response schemas + Zod validation
          rules.ts                      # CreateRuleSchema, UpdateRuleSchema, GetRuleSchema, DeleteRuleSchema
          search.ts                     # SearchRuleQuerySchema, FilterRuleQuerySchema
        dtos/                           # Composed types for complex queries
          rule-with-history.dto.ts      # RuleWithHistoryDTO (Rule + RuleRevisions)
        configs/                        # Business configuration constants
          config.ts                     # RULE_VALIDATION_CONFIG, RULE_SEARCH_CONFIG
        index.ts                        # Barrel export all contracts
      
      domain-shared/                    # Shared domain layer (client + server)
        value-objects/
          rule-id.ts                    # RuleId branded type (via createIdType)
          rule-status.ts                # RuleStatus companion object (.of(), .isValid(), .canTransitionTo())
          rule-severity.ts              # RuleSeverity companion object
          rule-tag.ts                   # RuleTag class (extends ValueObject)
          code-snippet.ts               # CodeSnippet class (extends ValueObject)
        index.ts
      
      domain-server/                    # Server domain layer
        aggregates/
          Rule.ts                       # Rule aggregate root (extends AggregateRoot<RuleId>)
        entities/
          RuleRevision.ts               # RuleRevision entity (immutable audit record)
        repositories/
          IRuleRepository.ts            # IRule Repository interface + DI token
        services/
          RuleDuplicationService.ts     # Domain service: check duplicate rule codes
          RuleLifecycleService.ts       # Domain service: enforce lifecycle transitions
        index.ts
      
      domain-client/                    # Client domain layer (UI-focused)
        aggregates/
          Rule.ts                       # Client-side Rule (rich view model: displayStatus, canEdit, etc.)
        entities/
          RuleHistory.ts                # RuleHistory entity (UI display of revisions)
        index.ts
      
      application/                      # Application services (use cases)
        RuleApplicationService.ts       # CRUD operations (create, update, delete, get, list)
        RuleSearchApplicationService.ts # Search/filter operations
        RuleRevisionApplicationService.ts # Audit history operations
        index.ts
      
      infrastructure/                   # Infrastructure implementations
        repositories/
          PrismaRuleRepository.ts       # Prisma implementation of IRuleRepository
        mappers/
          rule.mapper.ts                # Map between domain models and Prisma models
        prisma/
          schema.prisma                 # Governance tables: Rule, RuleRevision, RuleTag, CodeSnippet
        index.ts
      
      module.ts                         # Governance module assembly (DI container/Module class)
    
    package.json                        # Package metadata
    project.json                        # Nx project configuration
    tsconfig.json                       # TypeScript config
    vitest.config.ts                    # Vitest test configuration

apps/
  api/
    src/
      modules/
        governance/
          interface/                    # Express routes/controllers
            governance-crud.routes.ts   # CRUD endpoints: POST/PUT/DELETE/GET /api/rules
            governance-search.routes.ts # Search: GET /api/rules/search
            governance-tag.routes.ts    # Tag filter: GET /api/rules/tags/:tag
            governance-revision.routes.ts # History: GET /api/rules/:id/revisions
            index.ts                    # Register all routes
          initialization/
            governanceInitialization.ts # Module bootstrap (DI, event handlers)
  
  web/
    src/
      modules/
        governance/
          presentation/
            stores/
              governanceStore.ts        # Pinia store (rules list, selected rule, isLoading, error)
            composables/
              useRuleEditor.ts          # Composable: rule CRUD operations
              useRuleSearch.ts          # Composable: search/filter logic
            views/
              GovernanceListView.vue    # Rule list with tag filter and search
              GovernanceDetailView.vue  # Rule detail with Good/Bad examples + syntax highlighting
              RuleEditorView.vue        # Rule create/edit form
            components/
              RuleCard.vue              # Rule preview card
              CodeSnippetView.vue       # Syntax-highlighted code block (Good/Bad)
              RuleStatusBadge.vue       # Status indicator (Draft/Active/Deprecated)
            router/
              index.ts                  # Governance routes (/governance, /governance/:id, /governance/new)
            widgets/
              registerGovernanceWidgets.ts
          initialization/
            governanceWebInitialization.ts
  
  desktop/
    src/
      modules/
        governance/
          presentation/
            stores/
              governanceStore.ts        # React state (Zustand or similar)
            components/
              RuleListView.tsx          # React version of list view
              RuleDetailView.tsx        # React version of detail view
              RuleEditorView.tsx        # React version of editor
              CodeSnippetView.tsx       # Syntax-highlighted code (Prism.js or similar)
            hooks/
              useRuleEditor.ts          # React hook for CRUD
              useRuleSearch.ts          # React hook for search
          initialization/
            governanceDesktopInitialization.ts
```

**Structure Decision**: 

The Governance module follows **vertical-slice architecture** as defined in architecture.md:
1. **Single Nx Library**: All contracts, domain, application, and infrastructure layers live inside `packages/governance` to ensure isolation and prevent drift from legacy patterns.
2. **Adapters in Apps**: API routes (`apps/api/src/modules/governance/interface/`) and UI presentation layers (`apps/web`, `apps/desktop`) are thin adapters that wire the Governance module into the main applications.
3. **Reference Strategy**: Domain and contracts mirror the existing `example-sample` (now `governance`) patterns. Application and infrastructure are refactored to higher quality than legacy implementations.
4. **DI-First Assembly**: The module exports a `Module` class (`module.ts`) for dependency injection, making it pluggable without tight coupling to the main app.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No violations to justify.

All constitution principles pass. The Governance module follows established patterns and does not introduce new complexity requiring justification. The dogfooding requirement (Principle VII) is not a violation—it's the module's core purpose and is explicitly designed into the architecture.

## Post-Design Constitution Check

*Phase 1 artifacts generated: research.md, data-model.md, contracts/, quickstart.md*

**Re-evaluation against dogfooding requirement (Principle VII)**:

| Pattern | Implemented in Design | Evidence |
|---------|----------------------|----------|
| **Props Object Pattern** |  YES | Rule aggregate constructor accepts `CreateRuleProps` object, not individual parameters. See `data-model.md` section "Factory Methods". |
| **Private Constructors + Factory Methods** |  YES | All domain objects use `private constructor` + `static create()`, `fromPersistenceDTO()` factories. See `Rule.create()`, `RuleTag.create()`, `CodeSnippet.create()` in `data-model.md`. |
| **Private Backing Fields + Readonly Getters** |  YES | All entity fields stored as `private _fieldName`, exposed via `get fieldName()` getters. No setters. Mutations only through business methods. |
| **Const Object Enums (No TypeScript enum)** |  YES | `RuleStatus`, `RuleSeverity`, `Language`, `SnippetType` all use `const object` pattern. See `contracts/value-objects.ts`. |
| **Branded Types for IDs** |  YES | `RuleId` uses `createIdType` utility (branded type). See `contracts/value-objects.ts` and `data-model.md "Value Object: RuleId"`. |
| **Lifecycle State Machine** |  YES | `RuleStatus.canTransitionTo()` method enforces transitions. See `data-model.md "State Transitions (Lifecycle)"` with Mermaid diagram. |
| **Immutable Audit Entity** |  YES | `RuleRevision` has NO `update()` or `delete()` methods. Append-only by design. See `data-model.md "Entity: RuleRevision"`. |
| **Domain Events** |  YES | Rule aggregate emits events via `this.addDomainEvent()`. Events defined in `contracts/governance-event-map.ts`. |
| **Repository Interface + DI Token** |  YES | `IRuleRepository` interface with `RULE_REPOSITORY_TOKEN` symbol. See `data-model.md "Repository Interface"`. |
| **Protocol  API  DTOs Layering** |  YES | Contracts follow strict layering. `governance-rpc-map.ts` imports types from `api.ts`. No inline types. See `contracts/` directory. |
| **Zod Schemas for Validation** |  YES | `CreateRuleSchema`, `UpdateRuleSchema`, `SearchRulesQuerySchema` defined with validation rules. See `contracts/api.ts`. |
| **Result Pattern** |  YES | All domain methods return `Result<T>` for error handling. See `Rule.create()`, `Rule.deprecate()` examples in `data-model.md`. |

**Gate Decision**:  **PASS**  All dogfooding patterns are implemented in design.

**Remaining Verification**: Source code implementation must match design. Pre-merge checklist in `quickstart.md` ensures compliance.

---

## Planning Summary

### Artifacts Generated

| Artifact | Status | Location | Purpose |
|----------|--------|----------|---------|
| **Implementation Plan** |  Complete | [plan.md](plan.md) | High-level overview, technical context, constitution check, project structure |
| **Technical Research** |  Complete | [research.md](research.md) | 10 technical decisions with rationale and alternatives |
| **Data Model** |  Complete | [data-model.md](data-model.md) | Entity design, relationships, state machines, validation rules, Prisma schema |
| **API Contracts** |  Complete | [contracts/](contracts/) | RPC map, event map, request/response types, Zod schemas |
| **Developer Quickstart** |  Complete | [quickstart.md](quickstart.md) | Phase-by-phase implementation guide with code examples |
| **Task Breakdown** |  Pending | `tasks.md` | Next command: `/speckit.tasks` |

### Key Decisions Summary

| Decision Area | Decision Made | Rationale |
|---------------|---------------|-----------|
| **Package Structure** | Rename `example-sample`  `governance` | Preserves DDD foundation, establishes Governance as canonical example |
| **Architecture** | Vertical-slice (all layers in one package) | Prevents drift, ensures isolation, avoids legacy coupling |
| **Database** | Prisma + SQLite (MVP) | Lightweight, sufficient for 500+ rules, meets performance goals |
| **State Management** | Pinia (web), Zustand/Context (desktop) | Follows constitution, mirrors Goal module patterns |
| **Search Strategy** | Relevance scoring (title > code > description > tags) + status weighting | Prioritizes Active rules, meets 30-second discovery goal |
| **Lifecycle Enforcement** | RuleStatus.canTransitionTo() in domain layer | Business logic in domain, not APIDDD principle |
| **Audit Trail** | Immutable RuleRevision entity (append-only) | Preserves integrity, prevents tampering |
| **RBAC** | API middleware (NestJS guards/Express) | Separation of concernspermissions are infrastructure |
| **Code Snippets** | CodeSnippet value object (embedded JSON in MVP) | Simpler than separate table, sufficient for <10KB snippets |
| **Tag Normalization** | RuleTag.create() auto-normalizes | Prevents fragmentation, enforced in domain |
| **Syntax Highlighting** | Prism.js (MVP), Shiki (optional post-MVP) | Meets <500ms detail view goal, supports TypeScript/JSON/YAML/Prisma |

### Implementation Phases

| Phase | Priority | Description | Output |
|-------|----------|-------------|--------|
| **Phase 0** | P0 | Package Restructuring | Rename `example-sample`  `governance`, update all references |
| **Phase 1** | P1 | Domain Layer | Value objects, Rule aggregate, RuleRevision entity, repository interface |
| **Phase 2** | P1 | Application Layer | RuleApplicationService, RuleSearchApplicationService, RuleRevisionApplicationService |
| **Phase 3** | P1 | Infrastructure Layer | Prisma schema, PrismaRuleRepository, mappers |
| **Phase 4** | P2 | API Layer | Express routes (CRUD, search, revisions), RBAC middleware |
| **Phase 5** | P2 | Web UI | Pinia store, Vue views (list, detail, editor), components |
| **Phase 6** | P3 | Desktop UI | React components, Zustand store, Electron renderer integration |

### Success Criteria Mapping

| Success Criterion (from spec.md) | Implementation Strategy |
|----------------------------------|------------------------|
| **SC-001**: Rule discovery <30 seconds | Search relevance scoring + Pinia store caching |
| **SC-002**: New dev scaffolds Entity in <5 minutes | Governance source code as copyable example + quickstart.md |
| **SC-003**: 50% reduction in architecture review comments | High-quality dogfooding compliance + living documentation |
| **SC-004**: 100% new module compliance | Governance as mandatory reference for all new code |
| **SC-005**: Governance passes all its own rules | Pre-merge dogfooding compliance checklist |
| **SC-006**: Search <200ms, detail view <500ms | SQLite queries + in-memory relevance sorting (MVP <500 rules) |
| **SC-007**: 5 seed rules present on launch | Seed script with Entity Props Pattern, No Logic in DTOs, Layer Isolation, Value Object Collections, Factory Method Pattern |

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Governance source code doesn't follow its own rules** | Pre-merge compliance checklist in `quickstart.md`, code review with dogfooding focus |
| **Search performance degrades with >500 rules** | MVP uses in-memory sorting (meets goal). Post-MVP: SQLite FTS5 or PostgreSQL full-text search |
| **Developers ignore Governance and stick to tribal knowledge** | Integrate into PR template ("link to Governance rule for this pattern"), measure usage via analytics |
| **Stale rules not updated when standards change** | Scheduled job flags rules with missing live references, deprecation workflow enforces replacement |
| **MANDATORY rules block teams without escape hatch** | Exception process field (added in post-MVP) with required approval path |

### Next Steps

1.  **Planning Complete**  `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` generated
2.  **Generate Tasks**  Run `/speckit.tasks` to break down implementation into granular tasks
3.  **Phase 0 Implementation**  Rename `example-sample`  `governance` package
4.  **Phase 1-6 Implementation**  Follow `quickstart.md` phase-by-phase guide
5.  **Testing & Compliance**  Verify dogfooding checklist before merge
6.  **Seed Content**  Create 5 initial rules covering core DDD patterns

---

**Implementation Plan Status**:  **COMPLETE AND READY FOR IMPLEMENTATION**

**Command to proceed**: `/speckit.tasks` (generates granular task breakdown)

