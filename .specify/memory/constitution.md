<!-- SYNC IMPACT REPORT (2026-02-02)
Version: 0.0.0 → 1.0.0 (Initial Release)
This is the first formal constitution establishing governance for the DailyUse project.
New Principles: 5 core principles + 2 additional sections
Added Sections: Technology Stack Requirements, Code Quality & Review Standards
Files Updated: .specify/templates/ (already compliant)
Templates Status: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md (all align with principles)
Follow-up TODOs: None - all placeholders resolved
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

**Version**: 1.0.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-02
