# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. If command templates exist in this repository, consult them for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Vertical package slicing is explicit: feature is implemented in `packages/{domain}` (or domain module package) and split internally by DDD layers
- DDD layering is explicit: business logic in domain layer, orchestration in application layer, I/O in infrastructure
- Contracts-first design is defined: API/request/response/event contracts sourced from `packages/contracts`
- Shared core scope is compliant: shared logic is in `packages/contracts` and `packages/domain-shared`; no new `domain-server/domain-client` central package dependency is introduced
- Application service signatures follow `(input, cx)` and avoid infrastructure coupling
- Domain event lifecycle is compliant:
  - events are raised only inside aggregate business methods
  - repositories auto-dispatch queued aggregate events during persistence
  - application services contain no direct event bus publish/dispatch code
  - event payload typings are imported from `packages/contracts/src/modules/{domain}/protocol/{domain}-event-map.ts` (no local payload types)
- Identifier model is compliant:
  - entity + DTO identifiers use strong typed `xxId` types (not raw string aliases)
  - aggregate identifier fields use `*Id` naming only (no `*Uuid`)
  - account and identity aggregates use canonical `identityId`
- File and folder naming is compliant: all repository paths use `kebab-case` (symbol names may remain `PascalCase` in code)
- Governance module updates are planned: domain package governance checks/docs are updated when standards are changed
- `packages/ui-vue-shadcn/src/components/custom/` boundary is explicit when touched:
  - each component is classified as `pure-ui` or `domain-business`
  - components remain presentational (props/emits only)
  - no Pinia/global state/API call/routing side effects inside `custom/`
- Testing plan includes unit tests for aggregates and repository-level event dispatch behavior
- Nx execution path is defined for validation (`nx build`, `nx test`, `nx affected:*`)

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
