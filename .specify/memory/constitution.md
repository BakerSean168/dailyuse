<!-- SYNC IMPACT REPORT (2026-02-19)
Version: 2.0.0 → 2.1.0 (MINOR: Added mandatory UI component boundary governance for ui-vue-shadcn custom components)
Modified Principles:
- III. Multi-Platform Support (Web & Desktop Consistency) → III. Multi-Platform Support (Web & Desktop Consistency)
- X. Presentational Component Boundary (ui-vue-shadcn/custom) (new)
- Code Quality & Review Standards (review checklist expanded)
Added Sections:
- X. Presentational Component Boundary (ui-vue-shadcn/custom)
Removed Sections:
- None
Templates Requiring Updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ pending: .specify/templates/commands/*.md (directory not found in repository)
Runtime Guidance Updates:
- ✅ packages/ui-vue-shadcn/src/components/custom/README.md
- ✅ packages/ui-vue-shadcn/src/components/custom/goal/README.md
Follow-up TODOs:
- TODO(COMMAND_TEMPLATES): Add .specify/templates/commands/ if Speckit command templates are introduced later, then mirror Principle X checks there.
-->

# DailyUse Constitution

A multi-platform intelligent personal productivity management platform unifying goal management,
task tracking, knowledge curation, and habit building into a seamless user workflow.

## Core Principles

### I. Monorepo-First DDD Architecture (Vertical Slice Module Packages)

Domain-driven design with strict separation of concerns and vertical domain slicing at package level.

**Non-negotiable rules:**
- Every business domain MUST be organized by vertical module package first (for example,
  `packages/{domain}/`), then split internally by layers (domain/application/infrastructure/presentation)
- Shared foundations MUST be limited to `packages/contracts/` and `packages/domain-shared/`; domain
  behavior MUST NOT be centralized in removed `domain-server`/`domain-client` mega-packages
- Each module in `apps/{api,web,desktop}/src/modules/{domain}/` MUST mirror DDD boundaries with clear
  folder hierarchy
- Circular dependencies between modules or packages are FORBIDDEN; dependency graph MUST remain acyclic
  (verified via `nx graph`)
- Shared contracts (interfaces, types) MUST be defined in `packages/contracts/` for frontend-backend
  alignment

**Rationale:** Vertical slicing isolates change impact and reduces the blast radius of build failures.
Layered structure inside each package preserves DDD boundaries without creating over-centralized,
high-coupling core packages.

### II. Type-Safe Full Stack (TypeScript Mandatory)

All code MUST be written in TypeScript with strict mode enabled. No JavaScript files are permitted in source.

**Non-negotiable rules:**
- `tsconfig.json` MUST include `"strict": true` at all levels (root, `tsconfig.base.json`, and per-project)
- Every function signature MUST have explicit parameter and return type annotations
- No use of `any` type except when explicitly justified in code comments
- Shared types MUST flow from `packages/contracts/` to both backend and frontend; clients MUST NOT
  re-invent types
- Prisma schema MUST be the single source of truth for database types; generated types MUST be used in
  application code

**Rationale:** TypeScript prevents entire categories of runtime errors at compile time, accelerating
development and reducing production incidents.

### III. Multi-Platform Support (Web & Desktop Consistency)

Code MUST be platform-agnostic where possible; platform-specific concerns are isolated in presentation layers.

**Non-negotiable rules:**
- Business logic (domain + application layers) MUST NOT depend on platform-specific APIs (Vue, React,
  Electron)
- Platform-agnostic client-side business logic MUST be placed in domain module packages and/or
  `packages/domain-shared/`, not in framework view layers
- Presentation layer (`presentation/components/`, `presentation/views/`) is the ONLY place where
  framework-specific code (Vue, React) is permitted
- Electron main process (IPC, native APIs) MUST NOT contain business logic; it delegates to backend API or
  domain services in module packages
- Shared UI packages (`packages/ui-*`) MUST be framework-specific by adapter and MUST NOT embed domain
  business rules
- Components in `packages/ui-vue-shadcn/src/components/custom/` MUST follow presentational boundaries:
  they accept props, emit events, and MUST NOT own state-management concerns

**Rationale:** Separating business logic from presentation enables reuse across web and desktop, reduces
duplication, and makes the codebase resilient to framework changes.

### IV. Code Consistency & Maintainability

Naming conventions, folder structures, and shared package contracts MUST be applied uniformly.

**Non-negotiable rules:**
- All file names and folder names in the repository MUST use `kebab-case` (lowercase with hyphens)
- Uppercase/lowercase mixed filenames are FORBIDDEN to prevent cross-platform path mismatch bugs
- Symbol-level naming MAY use language/framework idioms: Vue/React component exports, class names,
  interface/type names, and enum names MAY be `PascalCase`
- File naming MUST remain `kebab-case` even when the exported symbol is `PascalCase`
  (for example, `user-service.ts` exports `UserService`)
- Test files MUST use `*.spec.ts` (or framework-equivalent) in `kebab-case`
- All code MUST pass linting (`pnpm lint`) and formatting (`pnpm format`) with zero errors
- Breaking changes to shared APIs (contracts, domain services) MUST be documented in PR description and
  CHANGELOG

**Rationale:** Strict filename normalization removes case-sensitivity defects between Windows/macOS/Linux while
keeping symbol naming expressive and idiomatic inside code.

### V. Test-Driven Quality Assurance

Unit tests and integration tests MUST be written for all business logic. Coverage MUST exceed 70% for new features.

**Non-negotiable rules:**
- Domain layer code MUST have unit tests (>80% coverage); test files SHOULD be colocated with source
- Application service tests MUST verify business logic in isolation
- Cross-module contracts (API endpoints, repository interfaces, protocol contracts) MUST have integration tests
- E2E tests MUST cover critical user journeys (goal creation, task management, note saving)
- Unit, integration, smoke, contract, IPC, main-process, and benchmark suites MUST use Vitest
- Browser E2E and sync regression suites MUST use Playwright
- Fast suites MUST be executable via `pnpm nx run <project>:test` and `pnpm nx affected -t test` for CI/CD

**Rationale:** Tests are executable specifications that prevent regressions and provide confidence during refactoring.

### VI. Contract Standardization & Domain Architecture (Package Structure Specification)

All inter-module communication contracts MUST follow the standardized
`packages/contracts/src/modules/{domain}/` architecture as exemplified by the `authentication` module.

**Non-negotiable rules:**

**Required Directory Structure** (`packages/contracts/src/modules/{domain}/`):
```
{domain}/
├── aggregates/           # Domain aggregate contracts (client/server separated)
├── api/                  # Request/Response types with Zod validation schemas
├── domain/               # Domain layer contracts
│   └── events/           # Domain event definitions
├── dtos/                 # Complex composed/presentation DTOs
├── entities/             # Entity contracts and interfaces
├── protocol/             # Type-safe RPC and Event maps
│   ├── {domain}-event-map.ts
│   └── {domain}-rpc-map.ts
├── value-objects/        # Value object contracts
└── index.ts              # Public API exports
```

**Protocol Layer** (`protocol/`):
- MUST contain `{domain}-rpc-map.ts` with signatures: `'domain:kebab-case-operation': [RequestType, ResponseType]`
- MUST contain `{domain}-event-map.ts` with signatures: `'domain:PascalCaseEvent': EventPayloadType`
- Domain/application/infrastructure code that raises or dispatches events MUST use payload types from
  `protocol/{domain}-event-map.ts`
- ALL types MUST be imported from API, domain, aggregates, DTOs, entities, or value-objects layers; inline
  custom object definitions are FORBIDDEN in protocol maps

**Identifier Typing & Naming Rules** (MANDATORY):
- Entity identifiers and transfer DTO identifiers MUST use strong typed IDs (`xxId` branded/type-safe forms),
  not raw `string` aliases
- Identifier field names MUST use `*Id` suffix only; `*Uuid` suffix is FORBIDDEN in entities, DTOs,
  contracts, and service signatures
- For account and identity aggregate roots, canonical primary identifier field MUST be `identityId`
- Aggregate identifier naming MUST remain consistent across entity, contract DTO, persistence DTO,
  repository mapping, and API boundaries

**Dependency Flow** (unidirectional, enforced by imports):
```
Protocol → API → Aggregates → Entities
       ↘ DTOs → Aggregates → Value Objects
Domain/Events → (imports nothing, pure domain)
```

**Authentication Module as Reference**:
- New domain modules MUST replicate `packages/contracts/src/modules/authentication/` structure
- If ambiguity exists, authentication module patterns take precedence

**Prohibited Patterns:**
- ❌ Request/response types inline in RPC maps
- ❌ API types not exported from `api/index.ts`
- ❌ DTOs importing from Protocol or API layers
- ❌ Domain events importing application-layer concerns
- ❌ Mixed client/server DTOs in one file
- ❌ Local event payload interfaces where event-map payload type exists
- ❌ Any `*Uuid` identifier names or untyped raw string identifiers where `xxId` exists

**Verification Commands:**
- `pnpm nx build contracts` MUST pass with zero TypeScript errors
- Type exports in `api/index.ts` MUST match all protocol usage
- Aggregate `addDomainEvent<...>` payload generics MUST resolve to
  `protocol/{domain}-event-map.ts`
- Contract/module reviews MUST verify identifier fields use `*Id` and exclude `*Uuid`
- `nx graph` MUST show no circular dependencies in contracts package

**Rationale:** A strict contracts architecture creates a predictable place for every contract type, enforces
clean boundaries, and scales with module growth.

### VII. Governance Module as Executable Code Standard (Living Documentation)

Every business domain package MUST include a `governance` module that acts as executable policy baseline,
replacing the old `example` module pattern.

**Non-negotiable rules:**

**Creation & Maintenance**:
- Each business package (`packages/*` containing domain modules) MUST include a `governance/` directory or
  `{domain}/governance/` subtree
- Governance module MUST be buildable and testable; stubs/placeholders are FORBIDDEN
- Governance module MUST define and keep updated: naming policy checks, architectural boundary checks,
  required type constraints, and module conventions
- Governance module content MUST be updated whenever Constitution principles change

**Reference Authority**:
- During review, governance module policies are the source of truth for module compliance
- New modules MUST explicitly align to governance module rules in PR descriptions
- Refactors MUST update governance rules and tests in the same change set

**Minimum Governance Contents**:
- Policy docs (`README`/rules) describing mandatory structure and boundaries
- Executable checks (lint/type/test assertions or scripted checks) for key principles
- Identifier policy checks (`xxId`, no `*Uuid`) and event lifecycle policy checks
- Filename policy checks for repository-wide `kebab-case`

**CI/CD Integration**:
- Governance module checks MUST run in CI and MUST block merge on failure
- Governance checks MUST be runnable through Nx targets (`nx test`, `nx lint`, or dedicated governance targets)

**Rationale:** Governance modules keep standards executable and local to each vertical domain package,
preventing drift while avoiding centralized coupling.

### VIII. Application Layer Service Parameter Conventions

Application layer services (use cases/handlers) MUST follow standardized parameter conventions.

**Non-negotiable rules:**
- Service methods MUST accept exactly two parameters: `input` and `cx`
- `input` MUST represent API contract data (from `packages/contracts/src/modules/{domain}/api/`)
- `cx` MUST carry contextual metadata (identity/session/device/trace), separated from request payload
- Context identity field MUST use canonical `identityId`
- Application services MUST NOT access request/session globals directly
- Application services MUST NOT call `publish`/`dispatch` APIs for domain events directly

**Prohibited Patterns:**
- ❌ Mixed input+context DTO as a single payload
- ❌ Multiple primitive context arguments instead of `cx`
- ❌ Optional/partial context for authenticated flows
- ❌ Infrastructure concerns embedded into `input`

**Rationale:** `input` + `cx` creates clear API/context separation, improves testability, and preserves layer
boundaries.

### IX. Domain Event Lifecycle Ownership

Domain events MUST be created inside aggregate business methods, queued on aggregate roots, and dispatched by
repository workflows.

**Non-negotiable rules:**
- Domain events MUST be recorded inside aggregate business behavior (after invariant checks + state mutation)
- Event payload generic/type arguments MUST reference contracts event-map entries
- Aggregate event queues MUST be aggregate-owned and not mutable from external layers
- Repository `save`/`upsert` MUST extract queued events and dispatch them automatically in persistence workflow
- Queue clear MUST happen only after successful persistence + dispatch coordination
- Application services MUST NOT publish/dispatch domain events directly

**Verification checklist:**
- PR review MUST reject application-layer imports of event bus abstractions for domain publication
- Static checks SHOULD verify no `publish`/`dispatch` in application layer
- PR review MUST reject local payload interfaces duplicating protocol event-map definitions
- Repository tests MUST assert queued events are dispatched and cleared on save
- PR review MUST verify identifiers are strong `xxId` and never `*Uuid`

**Rationale:** This keeps domain intent in aggregates, delivery mechanics in repositories, and orchestration in
application services.

### X. Presentational Component Boundary (ui-vue-shadcn/custom)

Components in `packages/ui-vue-shadcn/src/components/custom/` MUST remain presentational and container-free,
regardless of whether they are generic UI or domain-oriented UI assemblies.

**Non-negotiable rules:**
- Each custom component MUST declare category as either `pure-ui` or `domain-business` in local docs and PR
  description
- `pure-ui` components MUST be domain-agnostic and driven only by props/emits; props MUST use primitives or
  local UI interfaces
- `domain-business` components MAY import domain DTO/entity types from `@dailyuse/contracts` for typed props,
  but MUST still remain presentational (props/emits only)
- Components in `custom/` MUST NOT use Pinia stores, global state containers, or framework store composables
- Components in `custom/` MUST NOT perform API calls, persistence operations, or routing side effects
- All interaction outcomes MUST be exposed via emitted events or callback props for parent/container handling

**Rationale:** Keeping `custom/` components stateless and declarative enforces Presentational vs. Container
separation, improves reusability, and makes components testable without app-level runtime dependencies.

## Technology Stack Requirements

The following technology versions and tools are standardized across the project:

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| **Runtime** | Node.js | 22+ | All services and build tools |
| **Package Manager** | pnpm | 10+ | Workspace monorepo management |
| **Build System** | Nx | 22+ | Task orchestration and caching |
| **Language** | TypeScript | 5.9+ | Strict mode mandatory |
| **Backend Framework** | Express | Latest stable | API service architecture |
| **Frontend (Web)** | Vue 3 + Vuetify | Latest stable | Web application UI framework |
| **Frontend (Desktop Renderer)** | React + shadcn/ui | Latest stable | Desktop renderer process |
| **Desktop Framework** | Electron | 39.x+ | Cross-platform desktop shell |
| **Database** | Prisma + PostgreSQL | Latest stable | ORM and persistence |
| **Testing** | Vitest + Playwright | Latest stable | Vitest for fast/boundary suites, Playwright for browser E2E |
| **Linting** | ESLint | Latest (flat config) | Code quality enforcement |
| **Formatting** | Prettier | Latest stable | Code style consistency |

**Constraints:**
- All packages MUST be pinned in `pnpm-lock.yaml`
- Breaking changes to Nx/TypeScript/framework versions MUST be reviewed in architecture review
- New major dependencies MUST be approved via architectural review

## Code Quality & Review Standards

All code changes MUST follow these review and quality gates:

**Before Merge:**
- `pnpm lint` MUST pass with zero errors
- `pnpm format --check` MUST pass
- `pnpm nx affected -t test` MUST pass for changed projects
- Type checking (`pnpm tsc`) MUST pass with zero errors
- No `console.log()` in production code except explicit logging services

**Code Review Checklist:**
- Change follows DDD boundaries and vertical package slicing
- File/folder names are strict `kebab-case`; symbol names use idiomatic `PascalCase` only at symbol level
- Types are explicit and do not use unjustified `any`
- Tests are included for new business logic
- If domain events are involved, event ownership and dispatch rules are respected
- If identifiers are involved, `xxId` + `*Id` naming is enforced with no `*Uuid`
- Governance module checks and docs are updated with the same PR when standards are touched
- `packages/ui-vue-shadcn/src/components/custom/` changes are presentational only (props/emits), with no
  Pinia/global store/API-side effects

**Complexity Justification:**
- Complexity additions MUST explain why simpler alternatives are insufficient
- Large refactors MUST include architectural review in PRs or ADRs (`docs/architecture/adr/`)

## Governance

### Amendment Procedure

1. **Proposal**: Open a GitHub issue or PR referencing this constitution
2. **Rationale**: Explain why the change is needed and impact scope
3. **Approval**: Changes require agreement from core maintainers and project leads
4. **Migration**: Breaking updates MUST include migration plan and rollout checkpoints
5. **Documentation**: Update this file and any dependent templates/docs in the same change set

### Versioning Policy

Constitution versions follow **Semantic Versioning**:
- **MAJOR**: Backward-incompatible principle changes, principle removals, or governance restructuring
- **MINOR**: New principle/section or substantial expansion requiring process/code updates
- **PATCH**: Clarifications/typos/non-semantic wording changes

### Compliance Review

- Constitution compliance MUST be verified in PR review before merge
- Circular dependency violations MUST be resolved before CI passes
- Failing lint/test/governance checks MUST block merge
- Application layers MUST be periodically audited for direct event dispatch violations
- Regular compliance audits SHOULD run via `pnpm nx affected -t lint,test`

### Guidelines for Developers

- Consult this constitution when uncertain about architecture, naming, or organization
- Use `docs/standards/` and package governance modules for implementation standards
- Report violations or ambiguities as GitHub issues labeled `constitution`
- Update CHANGELOG when constitution changes to preserve governance history

---

**Version**: 2.1.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-19
