<!-- SYNC IMPACT REPORT (2026-02-03)
Version: 1.1.0 → 1.2.0 (Example Modules as Living Documentation)
Added Principle VII: Example modules as executable code standards and authoritative reference
New Guidance: Example modules required in every module-bearing package with strict governance
Templates Updated: None (constitution-only change; example modules already exist and compliant)
Reference Implementation: packages/contracts/src/modules/example/ (currently exemplifies principle)
Follow-up Action: Document example module governance in developer guide
-->

# DailyUse Constitution

A multi-platform intelligent personal productivity management platform unifying goal management, task tracking, knowledge curation, and habit building into a seamless user workflow.

## Core Principles

### I. Monorepo-First DDD Architecture

Domain-driven design with strict separation of concerns across frontend, backend, and shared packages.

**Non-negotiable rules:**
- Every business domain MUST be organized following DDD principles: domain layer (entities, repositories, services), application layer (use cases, DTOs), infrastructure layer (implementations), and presentation layer (UI components)
- Core business logic MUST reside in `packages/domain-server/` (backend) and `packages/domain-client/` (frontend), NOT scattered across app directories
- Each module `apps/{api,web,desktop}/src/modules/{domain}/` must mirror DDD structure with clear folder hierarchy
- Circular dependencies between modules are FORBIDDEN; dependency graph must remain acyclic (verified via `nx graph`)
- Shared contracts (interfaces, types) MUST be defined in `packages/contracts/` for frontend-backend alignment

**Rationale:** DDD ensures code remains maintainable and understandable as the codebase grows. Clear layering prevents business logic leakage into presentation, making code testable and portable across platforms.

### II. Type-Safe Full Stack (TypeScript Mandatory)

All code MUST be written in TypeScript with strict mode enabled. No JavaScript files permitted in source.

**Non-negotiable rules:**
- `tsconfig.json` MUST include `"strict": true` at all levels (root, `tsconfig.base.json`, and per-project)
- Every function signature MUST have explicit parameter and return type annotations
- No use of `any` type except when explicitly justified in code comments
- Shared types MUST flow from `packages/contracts/` to both backend and frontend; client must never re-invent types
- Prisma schema MUST be the single source of truth for database types; generated types MUST be used in application code

**Rationale:** TypeScript prevents entire categories of runtime errors at compile time, accelerating development and reducing production incidents. Strict mode ensures consistency across the monorepo.

### III. Multi-Platform Support (Web & Desktop Consistency)

Code MUST be platform-agnostic where possible; platform-specific concerns isolated in presentation layers.

**Non-negotiable rules:**
- Business logic (domain + application layers) MUST NOT depend on platform-specific APIs (Vue, React, Electron)
- `packages/domain-client/` MUST contain platform-agnostic client-side business logic (used by both web and desktop)
- Presentation layer (`presentation/components/`, `presentation/views/`) is the ONLY place where framework-specific code (Vue, React) is permitted
- Electron main process (IPC, native APIs) MUST NOT contain business logic; delegate to backend API or shared domain services
- Shared UI components (`packages/ui/`) MUST be framework-agnostic when possible, or provide adapter implementations for both Vue and React

**Rationale:** Separating business logic from presentation enables code reuse across web and desktop, reduces duplication, and makes the codebase more resilient to framework changes.

### IV. Code Consistency & Maintainability

Naming conventions, folder structures, and shared packages MUST be applied uniformly across all apps and modules.

**Non-negotiable rules:**
- All Files & Folders: MUST use `kebab-case` (lowercase with hyphens). No PascalCase or camelCase allowed for filenames.
- Components: MUST use `kebab-case` (e.g., `user-profile.vue`, `submit-button.tsx`)
- Classes/Services: File name MUST be `kebab-case`, even if the class inside is `PascalCase` (e.g., `user-service.ts` containing `UserService` class)
- Repositories: MUST use `kebab-case` (e.g., `goal.repository.ts`)
- Utilities: MUST use `kebab-case` (e.g., `date.utils.ts`, `validation.utils.ts`)
- Data Transfer Objects: MUST use `kebab-case` (e.g., `create-goal.dto.ts`)
- Test files: MUST use `*.spec.ts` naming convention in kebab-case (e.g., `user-service.spec.ts`)
- All code MUST pass linting: `pnpm lint` (ESLint) and formatting: `pnpm format` (Prettier) with no errors
- Breaking changes to shared APIs (contracts, domain services) MUST be communicated in PR descriptions and documented in CHANGELOG

**Rationale:** Strict kebab-case enforcement reduces cognitive load, eliminates naming ambiguity, speeds up onboarding, and makes refactoring safer. Enforced linting prevents code quality drift. Consistent file naming follows Unix/Linux conventions and improves filesystem consistency across Windows, macOS, and Linux.

### V. Test-Driven Quality Assurance

Unit tests and integration tests MUST be written for all business logic. Coverage MUST exceed 70% for new features.

**Non-negotiable rules:**
- Domain layer code MUST have unit tests (>80% coverage); test files MUST be colocated in same folder as source
- Application service (use case) tests MUST verify business logic in isolation
- Cross-module contracts (e.g., API endpoints, repository interfaces) MUST have integration tests
- E2E tests MUST cover critical user journeys (goal creation, task management, note saving)
- All tests MUST use Vitest framework (configured in `vitest.workspace.ts`)
- Tests MUST be executable via `nx test {project}` and `nx affected:test` for CI/CD

**Rationale:** Tests serve as executable specifications, prevent regressions, and give confidence during refactoring. High coverage ensures reliability across platforms.

### VI. Contract Standardization (Protocol/API/DTOs Layering)

All inter-module communication contracts MUST follow a strict three-layer architecture: Protocol (RPC/Event definitions) → API (Request/Response types with validation) → DTOs (Complex composed types).

**Non-negotiable rules:**

**Protocol Layer** (`packages/contracts/src/modules/{domain}/protocol/`):
- MUST contain `{domain}-rpc-map.ts` defining all RPC operations as a discriminated union type
- MUST contain `{domain}-event-map.ts` defining all domain events with timestamp, aggregateId, and event-specific payload
- RPC map signature format MUST be: `'domain:operation': [RequestType, ResponseType]` where RequestType and ResponseType are ALWAYS imported from `../api`, NEVER defined inline
- ALL types in RPC maps and event maps MUST be imported from API or aggregates layers; inline custom object definitions are FORBIDDEN
- Namespace format for operations MUST be `domain:kebab-case-operation` (e.g., `'goal:create'`, `'task:update'`, `'notification:batch-notify'`)
- Event naming format MUST be `domain:PascalCaseEvent` (e.g., `'goal:GoalCreated'`, `'task:TaskCompleted'`)

**API Layer** (`packages/contracts/src/modules/{domain}/api/`):
- MUST export all Request types (`*Req`), Response types (`*Res`), and Query types (`*Query`) used by Protocol layer
- MUST use Zod schemas for complex request/query types (e.g., `CreateGoalSchema`, `ListGoalQuerySchema`) with validation rules
- MAY re-export aggregates and DTOs needed for API type composition; MUST NOT define new types not re-exported
- Response types (`*Res`) MUST be entity/aggregate types from aggregates layer, NEVER inline objects
- Simple types (like `void`) MAY be used directly; complex responses MUST come from aggregates or be typed interfaces
- MUST have an `index.ts` that exports all types used by protocol and consumers

**DTOs Layer** (`packages/contracts/src/modules/{domain}/dtos/`):
- MUST contain composed/complex types that combine multiple aggregates or add presentation-layer concerns
- DTOs are INTERMEDIATE types between API responses and presentation/consumption code
- DTOs MUST import from aggregates; MUST NOT be imported by API or Protocol layers (unidirectional dependency)
- Use case: When a view needs data from multiple entities, compose it in a DTO; API exports the base entity, DTO adds the composition
- Example: `ComplexExampleDTO` imports `ExampleClientDTO` from aggregates and adds `clientDetails` composition

**Dependency Flow** (unidirectional):
```
Protocol → imports types from → API
API → imports types from → Aggregates, DTOs
DTOs → imports from → Aggregates
```

**Prohibited:**
- ❌ Defining request/response types inline in RPC map (MUST move to API layer)
- ❌ Custom objects in protocol layer without API layer re-export (MUST be defined in API with Zod schema or as typed interface)
- ❌ DTOs importing from Protocol or API layers
- ❌ API layer creating types not defined in files (MUST be traceable and re-exportable)

**Verification:**
- Every type in an RPC map entry MUST be traceable to a file in the `../api` directory
- `pnpm nx build contracts` MUST pass with zero TypeScript errors
- Type exports in `api/index.ts` MUST match all types used in `protocol/{domain}-rpc-map.ts`

**Rationale:** This strict layering ensures type contracts between modules are explicit, validated, and compose cleanly. Moving complex types to API layer (with Zod schemas) enables validation at boundaries, preventing invalid data from crossing module boundaries. DTOs enable custom compositions for specific use cases without polluting core API definitions. This prevents the anti-pattern of inline custom object types that lose validation and become difficult to maintain as the codebase scales.

### VII. Example Modules as Executable Code Standards (Living Documentation)

Every package and app containing business modules MUST include an `example` module that serves as the reference implementation, demonstrating correct patterns for all code standards and architectural principles.

**Non-negotiable rules:**

**Creation & Maintenance**:
- Each module-bearing package (`packages/*`, `apps/*/src/`) MUST include an `example/` or `{package}-example/` directory
- The example module MUST be fully functional and buildable; it cannot be a stub or placeholder
- The example module structure MUST mirror the real modules in the same package exactly (same layering, same file organization, same patterns)
- Example modules MUST be updated whenever code standards change (e.g., when new Principle is added to Constitution)
- Example modules are FORBIDDEN from being feature-specific; they MUST be generic/reusable patterns that apply to all modules in that context

**Reference Authority**:
- When code reviews identify a pattern question, the example module IS the source of truth
- All new developers MUST study the example module before writing code in that package
- PR descriptions MUST explicitly reference the example module when introducing patterns (e.g., "Following `packages/contracts/src/modules/example/` pattern")
- Refactoring efforts MUST ensure example modules remain compliant with changes

**Scope by Package**:

| Package | Example Module | Demonstrates |
|---------|---|---|
| `packages/contracts/` | `src/modules/example/` | Protocol/API/DTOs layering, RPC maps, event maps, Zod schemas, type organization |
| `packages/domain-server/` | `src/modules/example/` | Backend DDD structure: domain layer, application services, repositories, DTOs, use cases |
| `packages/domain-client/` | `src/modules/example/` | Frontend-agnostic client logic: state management, services, models, validation, composition |
| `packages/ui/` | `components/example/` | Component patterns: props, slots, styling, accessibility, testing, storybook |
| `apps/api/src/` | `modules/example/` | API server module: NestJS controller, service, guards, decorators, DTOs, API routes |
| `apps/web/src/` | `modules/example/` | Vue 3 module: views, composables, components, state (Pinia), API integration, patterns |
| `apps/desktop/src/` | `modules/example/` | Electron renderer module: React components, IPC patterns, main-process communication, state |

**Code Quality**:
- Example modules MUST have >80% test coverage (unit + integration)
- Example modules MUST pass all linting, formatting, and type checking (`pnpm lint`, `pnpm format`, `pnpm tsc`)
- Example modules MUST build successfully with zero warnings: `nx build {package}` or equivalent
- Comments in example modules MUST explain WHY patterns are used, not just WHAT they do
- Example modules SHOULD include edge cases and error handling (to guide developers on completeness)

**CI/CD Integration**:
- All example modules MUST be built and tested in CI (not excluded)
- Failing example module builds/tests MUST block PR merge (treated as production code)
- Example module compliance SHOULD be verified via linting rule or pre-commit hook (tooling optional)

**Governance**:
- Changes to example modules MUST undergo same code review rigor as production code
- Example modules MAY receive separate CHANGELOG entries: `docs(example): update {module} pattern`
- Example module refactors MUST be documented in `docs/guides/` for developer awareness

**Rationale:** Making example modules mandatory and authoritative ensures every developer learns from a single, tested source of truth. This prevents pattern drift where different modules solve the same problem differently, reduces code review friction ("does this match the pattern?"), accelerates onboarding, and creates living documentation that evolves with the codebase. By treating examples as production-quality code, they stay relevant and trustworthy. This principle directly supports Principle IV (Code Consistency & Maintainability) by anchoring all patterns to an executable reference.

## Technology Stack Requirements

The following technology versions and tools are standardized across the project:

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **Runtime** | Node.js | 18+ | All services and build tools |
| **Package Manager** | pnpm | 8+ | Workspace monorepo management |
| **Build System** | Nx | 21.4.1+ | Task orchestration and caching |
| **Language** | TypeScript | 5.8.3+ | Strict mode mandatory |
| **Backend Framework** | NestJS | Latest LTS | API service architecture |
| **Frontend (Web)** | Vue 3 + Vuetify | Latest stable | Web application UI framework |
| **Frontend (Desktop Renderer)** | React + shadcn/ui | Latest stable | Desktop application renderer process |
| **Desktop Framework** | Electron | 30.x+ | Cross-platform desktop shell |
| **Database** | Prisma + SQLite | Latest | ORM and local persistence |
| **Testing** | Vitest | Latest | Fast unit testing framework |
| **Linting** | ESLint | Latest (flat config) | Code quality enforcement |
| **Formatting** | Prettier | Latest | Code style consistency |

**Constraints:**
- All packages MUST be pinned to exact versions in pnpm-lock.yaml
- Breaking changes to Nx, TypeScript, or framework versions MUST trigger a patch bump in constitution (PATCH)
- New major dependencies MUST be approved via architectural review

## Code Quality & Review Standards

All code changes MUST follow these review and quality gates:

**Before Merge:**
- `pnpm lint` MUST pass with zero errors
- `pnpm format --check` MUST pass (no reformatting needed)
- `pnpm nx affected:test` MUST pass for all changed projects
- Git history MUST be clean (squashed/rebased commits, descriptive messages)
- Type checking: `pnpm tsc` MUST show zero errors
- No console.log() statements in production code (except in services that explicitly manage logging)

**Code Review Checklist:**
- Does the change align with DDD principles? (Is business logic in the right layer?)
- Is the change platform-agnostic where applicable?
- Are types fully specified? (No `any` without justification)
- Are tests included for new business logic?
- Does the change maintain or improve code consistency (naming, structure, linting)?

**Complexity Justification:**
- Any change adding complexity to existing modules MUST include a comment explaining why simpler alternatives were insufficient
- Large refactors MUST be preceded by architectural design review in PRs or ADRs (docs/architecture/adr/)

## Governance

### Amendment Procedure

1. **Proposal**: Open a discussion in a GitHub issue or PR, referencing this constitution
2. **Rationale**: Clearly document why the change is needed and impact on existing code
3. **Approval**: Changes require agreement from core maintainers (@BakerSean168 and project leads)
4. **Migration**: If changes conflict with existing code, a migration plan MUST be documented
5. **Documentation**: Update this file and notify team via project communication channels

### Versioning Policy

Constitution versions follow **Semantic Versioning**:
- **MAJOR**: Backward-incompatible principle changes, removal of principles, or fundamental governance restructure
- **MINOR**: New principle added, major clarification, or section expansion that requires code adjustments
- **PATCH**: Wording clarifications, typo fixes, or non-semantic refinements; does not require code changes

### Compliance Review

- Constitution compliance MUST be verified in PR reviews before merge
- Nx graph violations (circular dependencies) MUST be resolved before CI passes
- Failing linting or tests MUST block merge
- Monthly (or as-needed) compliance audits via `nx affected:lint` and `nx affected:test` to catch drift

### Guidelines for Developers

- Consult this constitution when unsure about architecture, naming, or code organization
- Use [docs/guides/development/coding-standards](docs/guides/development/coding-standards) for runtime development guidance
- Report violations or ambiguities as GitHub issues (tag with `constitution`)
- Update CHANGELOG.md when Constitution changes to track history

---

**Version**: 1.2.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-03
