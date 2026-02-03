# Constitution Amendment Summary (v1.0.0 → v1.2.0)

**Date**: 2026-02-03  
**Amendment ID**: CONSTITUTION-2026-02-03-001, CONSTITUTION-2026-02-03-002  
**Type**: Two MINOR Version Bumps (Principle Additions + Formalization)

---

## What Changed

### Amendment 1: Principle VI - Contract Standardization (Protocol/API/DTOs Layering)

Added formal three-layer architecture for all contracts in `packages/contracts`:

1. **Protocol Layer** - RPC map and event map definitions
2. **API Layer** - Request/Response types with Zod validation
3. **DTOs Layer** - Complex composed types

**Key Formalized Rules**:
- ✅ RPC operations must import types from API layer (never inline)
- ✅ API layer uses Zod for validation
- ✅ Response types must be aggregates
- ✅ DTOs compose aggregates (unidirectional dependency)

### Amendment 2: Principle VII - Example Modules as Executable Code Standards

Added mandatory example modules in every module-bearing package to serve as:

1. **Reference Implementation** - Proves patterns work
2. **Executable Specification** - Compiles, tests, deploys
3. **Living Documentation** - Stays in sync with Constitution
4. **Onboarding Tool** - First stop for developers
5. **Code Review Anchor** - Source of truth for patterns

**Scope**:
- `packages/contracts/src/modules/example/` - Protocol/API/DTOs
- `packages/domain-server/src/modules/example/` - Backend DDD
- `packages/domain-client/src/modules/example/` - Frontend-agnostic logic
- `packages/ui/components/example/` - UI components
- `apps/api/src/modules/example/` - NestJS API
- `apps/web/src/modules/example/` - Vue 3 web
- `apps/desktop/src/modules/example/` - Electron React

---

## Version Bumping Rationale

| Version | Changes | Type | Rationale |
|---------|---------|------|-----------|
| 1.0.0 | Initial constitution (5 principles) | Initial | Baseline governance |
| 1.1.0 | Added Principle VI (Contract Standardization) | MINOR | New principle requiring code awareness |
| 1.2.0 | Added Principle VII (Example Modules) | MINOR | New principle with governance implications |

**All three versions follow Semantic Versioning**:
- ❌ NOT MAJOR: No removals or backward-incompatible changes
- ✅ MINOR: New principles added, no code breaks
- ❌ NOT PATCH: Requires developer action and awareness

---

## Compliance Status

### Principle VI (Contract Standardization)

| Module | Status | Evidence |
|--------|--------|----------|
| example | ✅ COMPLIANT | `api/crud.ts` with Zod, `protocol/example-rpc-map.ts` imports from API |
| account | ✅ COMPLIANT | RPC map references `../api` types |
| goal | ✅ COMPLIANT | API layer exports all types |
| notification | ✅ COMPLIANT | 13 RPC ops with proper imports |
| reminder | ✅ COMPLIANT | 17 RPC ops with proper structure |
| ... (10 more modules) | ✅ COMPLIANT | All build successfully, zero errors |

**Build Status**: ✅ `pnpm nx build contracts` - ZERO ERRORS

### Principle VII (Example Modules)

| Package | Example Module | Status |
|---------|---|--------|
| contracts | `src/modules/example/` | ✅ EXISTS, fully compliant |
| domain-server | `src/modules/example/` | ✅ EXISTS, demonstrates DDD |
| domain-client | `src/modules/example/` | ✅ EXISTS, platform-agnostic |
| ui | `components/example/` | ✅ EXISTS, component patterns |
| api | `modules/example/` | ✅ EXISTS, NestJS patterns |
| web | `modules/example/` | ✅ EXISTS, Vue 3 patterns |
| desktop | `modules/example/` | ✅ EXISTS, React/Electron patterns |

**Current Status**: All packages ALREADY have example modules; new principle formalizes existing practice

---

## Documentation

### New Documents Created

1. **[.specify/memory/constitution.md]()**
   - Principle VI added (lines 87-139)
   - Principle VII added (lines 142-205)
   - Version bumped to 1.2.0

2. **[.specify/memory/contracts-code-standards.md]() (from Amendment 1)**
   - Comprehensive code standards guide
   - Layer-by-layer breakdown with examples
   - Real-world patterns

3. **[.specify/memory/constitution-amendment-summary.md]() (existing, updated)**
   - Amendment tracking for Principle VI

4. **[.specify/memory/example-modules-governance.md]() (NEW, from Amendment 2)**
   - Complete governance guide for example modules
   - Examples per package with structures
   - Code review standards
   - Maintenance schedule
   - Pattern hunt process

---

## Immediate Actions Required

✅ **Completed**:
1. Added Principle VI to constitution
2. Added Principle VII to constitution
3. Created comprehensive code standards guide
4. Created example modules governance guide
5. Updated version to 1.2.0
6. Verified all 13 modules compliant with Principle VI
7. Verified all 7 packages have example modules (Principle VII)

📋 **Recommended Next Steps**:
1. Share [example-modules-governance.md](.specify/memory/example-modules-governance.md) with team
2. Update PR template to reference example modules
3. Add pre-commit hook to validate RPC maps import from API
4. Update onboarding docs to direct new devs to example modules
5. Schedule quarterly review of example module drift

---

## Quick Reference

### Pattern Questions → Find Answers

| Question | Answer | Location |
|----------|--------|----------|
| "How do I structure RPC maps?" | See example module | `packages/contracts/src/modules/example/protocol/` |
| "How do I define request types?" | Study Zod pattern | `packages/contracts/src/modules/example/api/crud.ts` |
| "How do I organize backend modules?" | Check DDD structure | `packages/domain-server/src/modules/example/` |
| "How should Vue 3 modules look?" | Reference web module | `apps/web/src/modules/example/` |
| "How do I use React in Electron?" | Study desktop module | `apps/desktop/src/modules/example/` |

### Constitution Principles

| # | Principle | Enforced By |
|---|-----------|-----------|
| I | Monorepo-First DDD | Architecture reviews, `nx graph` checks |
| II | Type-Safe Full Stack | `pnpm tsc`, ESLint strict rules |
| III | Multi-Platform Support | Package organization, linting |
| IV | Code Consistency | `pnpm lint`, `pnpm format`, kebab-case rule |
| V | Test-Driven QA | `pnpm test`, coverage gates |
| **VI** | **Contract Standardization** | **Example modules, `nx build` checks** |
| **VII** | **Example Modules as Standards** | **Code review, CI/CD, governance** |

---

## Approval & Ratification

**Constitution Version**: 1.2.0  
**Amendments**: CONSTITUTION-2026-02-03-001, CONSTITUTION-2026-02-03-002  
**Approved By**: [Project Maintainers]  
**Ratified Date**: 2026-02-02  
**Last Amended**: 2026-02-03  

**Status**: ✅ ACTIVE


---

## What Changed

### New Principle Added: VI. Contract Standardization (Protocol/API/DTOs Layering)

The constitution now formally defines the three-layer architecture for all contracts in `packages/contracts`:

1. **Protocol Layer** - RPC map and event map definitions
2. **API Layer** - Request/Response types with Zod validation
3. **DTOs Layer** - Complex composed types

### Key Formalized Rules

#### ✅ MUST DO (Protocol Layer)
- Define all RPC operations with types imported from `../api`
- Use naming: `'domain:kebab-case-operation'` for RPC, `'domain:PascalCaseEvent'` for events
- Every type reference MUST be traceable to `api/index.ts`

#### ✅ MUST DO (API Layer)
- Use Zod schemas for request/query validation
- Response types MUST be entity/aggregate types from `aggregates/`
- Export ALL types from `index.ts`

#### ✅ MUST DO (DTOs Layer)
- Compose multiple aggregates only
- Import ONLY from aggregates (never from protocol or API)
- Keep separate from API definitions

#### ❌ NEVER DO (Prohibited)
- ❌ Inline custom objects in RPC maps (MUST move to API)
- ❌ Define custom objects in protocol without API export
- ❌ DTOs importing from Protocol or API layers
- ❌ Unmapped types (types must be traceable)

### Why This Matters

**Problem Being Solved:**
- Previous pattern allowed inline custom objects in RPC maps (anti-pattern)
- Types could be defined without validation (loss of validation boundaries)
- Complex types mixed in protocol layer made maintenance difficult
- No clear path for DTOs or aggregates composition

**Benefits of Formalized Standard:**
- ✅ Type safety enforced at API boundaries (Zod validation)
- ✅ Clear separation of concerns (validation, composition, definitions)
- ✅ Prevents circular dependencies (unidirectional imports)
- ✅ Enables reuse of aggregates across modules
- ✅ Easier debugging (trace type definitions to source file)
- ✅ Scalability (standard pattern applies to all 13+ modules)

---

## Reference Implementation

**Model Module**: [packages/contracts/src/modules/example/](packages/contracts/src/modules/example/)

This module exemplifies the correct pattern:
- ✅ `api/crud.ts` - Zod-validated request/response types
- ✅ `api/index.ts` - Clean export aggregation
- ✅ `protocol/example-rpc-map.ts` - Types imported from API
- ✅ `dtos/complex-example.dto.ts` - Composed types using aggregates

### Pattern Summary

```typescript
// 1. Define request/response in API with Zod
// api/crud.ts
export const CreateExampleSchema = z.object({ name: z.string().min(1) });
export type CreateExampleReq = z.infer<typeof CreateExampleSchema>;
export type CreateExampleRes = ExampleClientDTO;  // from aggregates

// 2. Export from API index
// api/index.ts
export { CreateExampleSchema, type CreateExampleReq, type CreateExampleRes } from './crud';

// 3. Import in protocol RPC map
// protocol/example-rpc-map.ts
import type { CreateExampleReq, CreateExampleRes } from '../api';
export type ExampleRpcMap = {
  'example:create': [CreateExampleReq, CreateExampleRes];
};

// 4. Compose in DTOs if needed
// dtos/complex-example.dto.ts
import type { ExampleClientDTO } from '../aggregates';
export interface ComplexExampleDTO {
  details: ExampleClientDTO;
  // composition fields
}
```

---

## Compliance Status

| Module | Status | Notes |
|--------|--------|-------|
| example | ✅ COMPLIANT | Model implementation, fully standardized |
| account | ✅ COMPLIANT | RPC map updated in Phase 3 |
| goal | ✅ COMPLIANT | RPC map standardized |
| task | ✅ COMPLIANT | RPC map standardized |
| authentication | ✅ COMPLIANT | 17 operations, properly structured |
| ai | ✅ COMPLIANT | 9 operations, properly structured |
| notification | ✅ COMPLIANT | 13 RPC ops, newly created with correct pattern |
| reminder | ✅ COMPLIANT | 17 RPC ops, newly created |
| schedule | ✅ COMPLIANT | 15 RPC ops, newly created |
| repository | ✅ COMPLIANT | 17 RPC ops, newly created |
| sync | ✅ COMPLIANT | 20 RPC ops, newly created |
| setting | ✅ COMPLIANT | NEW API layer created with 7 RPC ops |
| editor | ✅ COMPLIANT | RPC map standardized |

**Total Compliance**: 13/13 modules ✅

---

## Build Verification

```bash
$ pnpm nx build contracts

✅ ESM Build success in 167ms
✅ DTS Build success in 7316ms
✅ All .d.ts files generated correctly
✅ Zero TypeScript errors
```

Status: **VERIFIED COMPLIANT** ✅

---

## Documentation

### New Documents Created

1. **[.specify/memory/constitution.md](.specify/memory/constitution.md#vi-contract-standardization-protocolapidtos-layering)**
   - Principal VI added (lines 87-139)
   - Formal governance for Protocol/API/DTOs layers
   - Non-negotiable rules, dependency flow, rationale

2. **[.specify/memory/contracts-code-standards.md](.specify/memory/contracts-code-standards.md)** (NEW)
   - Comprehensive code standards guide
   - Layer-by-layer breakdown with examples
   - Real-world patterns (Goal module example)
   - Build verification checklist
   - Dependency rules matrix
   - Common errors and fixes

### Templates Checked

- ✅ `.specify/templates/plan-template.md` - No conflicts
- ✅ `.specify/templates/spec-template.md` - No conflicts  
- ✅ `.specify/templates/tasks-template.md` - No conflicts
- ✅ `.specify/templates/commands/*.md` - No conflicts

No template updates required (all existing templates align with new principle).

---

## Version Bumping Rationale

### Old Version: 1.0.0
- Initial constitution with 5 core principles
- Technology stack and code quality sections

### New Version: 1.1.0
- **Bump Type**: MINOR (new principle + formalization)
- **Reason**: 
  - Added Principle VI: Contract Standardization
  - Requires code adjustments for full modules to formalize API layer
  - New mandatory guidance for future modules
  - Does NOT break existing code (all modules already comply)

**Semantic Versioning Rules Applied**:
- ❌ NOT MAJOR (no backward-incompatible removals)
- ✅ MINOR (new principle + expanded guidance requiring code awareness)
- ❌ NOT PATCH (not just wording clarification)

---

## Immediate Actions

✅ **Completed**:
1. Formalized Protocol/API/DTOs layering in constitution
2. Created comprehensive code standards guide
3. Verified all 13 modules are compliant
4. Built packages with zero errors

📋 **Recommended Next Steps**:
1. Share new code standards guide with team
2. Use [.specify/memory/contracts-code-standards.md](.specify/memory/contracts-code-standards.md) as reference in code reviews
3. Reference Principle VI in PR reviews for any new contract changes
4. Consider adding pre-commit hook to validate RPC map imports from API layer

---

## Quick Reference

### Three-Layer Pattern (Copy-Paste Ready)

**api/crud.ts**:
```typescript
import { z } from 'zod';
import type { DomainClientDTO } from '../aggregates';

export const CreateDomainSchema = z.object({
  // validation rules
});
export type CreateDomainReq = z.infer<typeof CreateDomainSchema>;
export type CreateDomainRes = DomainClientDTO;
```

**api/index.ts**:
```typescript
export { CreateDomainSchema, type CreateDomainReq, type CreateDomainRes } from './crud';
```

**protocol/domain-rpc-map.ts**:
```typescript
import type { CreateDomainReq, CreateDomainRes } from '../api';

export type DomainRpcMap = {
  'domain:create': [CreateDomainReq, CreateDomainRes];
};
```

**dtos/complex-domain.dto.ts** (if needed):
```typescript
import type { DomainClientDTO } from '../aggregates';

export interface ComplexDomainDTO {
  domain: DomainClientDTO;
  // composition fields
}
```

---

## Questions & Answers

**Q: Can I define simple inline types in RPC maps?**  
A: No. All types (simple or complex) MUST come from API layer to ensure they're traceable and validated.

**Q: What if I don't have an aggregates folder yet?**  
A: Create it. It should contain your entity types (e.g., `DomainClientDTO`). The API layer re-exports these for RPC map use.

**Q: When should I use DTOs vs. API layer types?**  
A: Use API types for direct RPC operations. Use DTOs when you need to compose multiple aggregates or add presentation-specific fields.

**Q: Can DTOs be used in RPC maps?**  
A: Only in response types if they're aggregates. DTOs in request types are not recommended (add validation to API instead).

**Q: What if my API types don't exist yet?**  
A: Create them first in `api/crud.ts`, then reference in RPC map. Empty modules have empty RPC maps (which is valid).

---

## Approval & Ratification

**Constitution Version**: 1.1.0  
**Approved By**: [Project Maintainers]  
**Ratified Date**: 2026-02-02  
**Last Amended**: 2026-02-03  

**Status**: ✅ ACTIVE
