# Story 1.1: Scaffold Governance Module from Goal Template

Status: ready-for-dev

## Story

As a Tech Lead,
I want the Governance module scaffolded by mirroring the Goal module structure,
so that new governance features follow existing DDD conventions from day one.

## Acceptance Criteria

1. Governance module scaffold is created by mirroring the Goal module structure across packages and apps.
2. packages/governance contains internal layers and entrypoints aligned to DDD: contracts, domain, application, infrastructure, interface, and module assembly.
3. apps/api has governance initialization and interface wiring files in place, following existing module conventions.
4. apps/web has governance presentation structure (stores, views, router, composables, widgets) aligned to Goal module patterns.
5. Route aggregation and module assembly entrypoints exist, with kebab-case filenames for interface routes.

## Tasks / Subtasks

- [x] Task 1: Baseline Goal module reference structure (AC: 1, 2, 3, 4)
  - [x] Identify Goal module folder layout and entrypoints to mirror
  - [x] Note naming conventions and route aggregation patterns
- [ ] Task 2: Scaffold packages/governance vertical slice (AC: 2)
  - [ ] Create folders: contracts, domain, application, infrastructure, interface
  - [ ] Add module assembly file (module.ts) and indexes for each layer
- [ ] Task 3: Scaffold API module wiring (AC: 3, 5)
  - [ ] Add apps/api/src/modules/governance/interface/index.ts
  - [ ] Add apps/api/src/modules/governance/initialization/governanceInitialization.ts
- [ ] Task 4: Scaffold Web module wiring (AC: 4)
  - [ ] Add apps/web/src/modules/governance/presentation/{stores,views,router,composables,widgets}
  - [ ] Add governance store and routing entrypoints mirroring Goal patterns

## Dev Notes

- Governance is a vertical-slice Nx library at packages/governance with internal contracts, domain, application, infrastructure, and interface layers.
- Mirror Goal module patterns for domain and contracts; treat application/infrastructure as higher-quality refactors but keep APIs consistent.
- DI-first module: not required to be runnable immediately; must export a Module class or container config for app assembly.
- API style: Express REST with explicit router/controller/service layering, Result pattern mapping, and response builder consistent with Goal.
- File naming: kebab-case in interface/ routes, plural noun endpoints with :id params, aggregated via interface/index.ts.
- UI: Vue 3 Composition API with Pinia stores and composables orchestration following Goal conventions.

## Developer Context

- This story is purely scaffolding: establish folders, entrypoints, and module wiring; do not implement domain logic yet.
- The Governance module must be isolated in packages/governance with all layers inside that package; avoid splitting across shared packages.
- Treat Goal module as the reference for naming, routing, store conventions, and response formatting.

## Technical Requirements

- TypeScript (strict), aligned to monorepo tsconfig.
- Express REST routing with explicit router/controller/service layering.
- Result pattern mapping for API responses; use the same response shape as Goal.
- Vue 3 Composition API with Pinia stores and composables orchestration.
- Prisma + SQLite is the MVP data path, but no schema is required in this scaffold story.

## Architecture Compliance

- Maintain DDD layering: contracts -> domain -> application -> infrastructure -> interface -> module assembly.
- Ensure DI-first module assembly (module.ts or container config) and keep it decoupled from app wiring.
- Follow EventBus naming (module:action) for future events; no events created yet.

## Library / Framework Requirements

- Reuse the same validation and response utilities as Goal; confirm the exact import path in Goal before scaffolding helpers.
- Use existing Nx targets and conventions; no new tooling or external scaffolds.

## File Structure Requirements

- Use kebab-case for interface route files (e.g., governance-crud.routes.ts).
- Aggregate routes in packages/governance/src/interface/express/index.ts and apps/api/src/modules/governance/interface/index.ts.
- Scaffold apps/web/src/modules/governance/presentation folders to match Goal's module layout.

## Testing Requirements

- No new tests required for scaffolding, but do not break existing lint/test expectations.

## Project Context Reference

- Governance is a brownfield module; mirror Goal's structure to prevent drift and align with existing DDD conventions.
- This module should be DI-first and not required to be runnable until wired into apps/api and apps/web.

## Story Completion Status

- Status set to ready-for-dev after context creation.

### Project Structure Notes

- Target structure from architecture doc:
  - packages/governance/src/{contracts,domain,application,infrastructure,interface,module.ts}
  - apps/api/src/modules/governance/{interface,initialization}
  - apps/web/src/modules/governance/presentation/{stores,views,router,composables,widgets}
- Keep governance local response builder aligned with Goal response format or reuse createResponseBuilder if Goal does.

### References

- _bmad-output/planning-artifacts/epics.md (Epic 1, Story 1.1)
- _bmad-output/planning-artifacts/architecture.md (Project Structure & Boundaries; Implementation Patterns & Consistency Rules)
- _bmad-output/planning-artifacts/prd.md (Architecture alignment, UI structure, response format, API routes)

## Dev Agent Record

### Agent Model Used

GPT-5.2-Codex

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Task 1 baseline: API routes aggregate in apps/api/src/modules/goal/interface/index.ts over kebab-case goal-*.routes.ts; API init in apps/api/src/modules/goal/initialization/goalInitialization.ts. Web module layout in apps/web/src/modules/goal/presentation/{stores,router,composables,widgets} with router/index.ts and stores/goalStore.ts; module exports in apps/web/src/modules/goal/index.ts. DI-first module class in packages/infrastructure-server/src/goal/goal.module.ts.

### File List

- packages/governance/src/... (scaffold folders and index/module files)
- apps/api/src/modules/governance/interface/index.ts
- apps/api/src/modules/governance/initialization/governanceInitialization.ts
- apps/web/src/modules/governance/presentation/... (scaffold folders and entrypoints)
- _bmad-output/implementation-artifacts/sprint-status.yaml
