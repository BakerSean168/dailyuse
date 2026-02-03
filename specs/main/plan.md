# Implementation Plan: Define base contracts for RPC/events across all modules

**Branch**: `main` | **Date**: 2026-02-02 | **Spec**: [specs/main/spec.md](specs/main/spec.md)
**Input**: Feature specification from [specs/main/spec.md](specs/main/spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Standardize contracts for all modules in packages/contracts by defining base RPC/event maps in protocol, API request/response schemas in api, and composed/aggregate response DTOs in dtos. Provide consistent structure and references so RPC request/response types align with API schemas.

## Technical Context

**Language/Version**: TypeScript ~5.9 (Node >=22)  
**Primary Dependencies**: Nx 22.x, pnpm 10.x, zod 4.x  
**Storage**: N/A (contracts only)  
**Testing**: Vitest (workspace)  
**Target Platform**: Node (monorepo packages)  
**Project Type**: Monorepo (Nx)  
**Performance Goals**: N/A (schema-only changes)  
**Constraints**: Keep backward-compatible contract shapes when possible  
**Scale/Scope**: 13 modules under packages/contracts/src/modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file contains placeholders only; no enforceable gates. Proceeding with no additional constraints.

Post-Phase 1 re-check: No changes; still no enforceable gates.

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
packages/
└── contracts/
    └── src/
        └── modules/
            ├── account/
            │   ├── api/
            │   ├── protocol/
            │   ├── dtos/
            │   └── ...
            ├── ai/
            ├── authentication/
            ├── editor/
            ├── example/
            ├── goal/
            ├── notification/
            ├── reminder/
            ├── repository/
            ├── schedule/
            ├── setting/
            ├── sync/
            └── task/
```

**Structure Decision**: Use Nx monorepo packages structure; scope limited to contracts package modules.

## Complexity Tracking

No Constitution violations. Complexity is inherent to multi-module standardization but is justified by the need for consistent contract integration across 13 modules.
