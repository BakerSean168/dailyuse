# Summary: Constitution Amendment - Example Modules as Living Documentation

**Amendment Date**: 2026-02-03  
**Status**: ✅ COMPLETE  
**Constitution Version**: 1.2.0 (Updated from 1.1.0)

---

## What Was Added

### New Constitutional Principle VII: Example Modules as Executable Code Standards

**Core Statement**:
> All code standards and architectural patterns in the DailyUse Constitution are demonstrated by example modules. When in doubt about a pattern, consult the example module. If the example module does something differently, the Constitution principle applies; update the example accordingly.

**Key Rules**:

✅ **MUST HAVE**:
- Every module-bearing package has an `example` module
- Example modules are production-quality code (they compile, test, deploy)
- Example modules demonstrate correct patterns for that context
- Example modules are the source of truth in code reviews
- Example modules are maintained with Constitution changes

✅ **MUST DO**:
- Study example modules before writing code
- Reference example modules in PR descriptions
- Compare your code to example module during review
- Update example module when adding new patterns
- Test example modules >80% coverage

❌ **NEVER DO**:
- Create modules without checking example first
- Ignore example module pattern in code reviews
- Let example modules become stale (update with Constitution)
- Create placeholder examples (must be fully functional)

---

## Scope: Example Modules in All Packages

| Package | Example Module | Purpose |
|---------|---|---------|
| `packages/contracts/` | `src/modules/example/` | Protocol/API/DTOs pattern (Principle VI) |
| `packages/domain-server/` | `src/modules/example/` | Backend DDD structure (Principle I) |
| `packages/domain-client/` | `src/modules/example/` | Platform-agnostic client logic (Principle III) |
| `packages/ui/` | `components/example/` | Reusable component design (Principle IV) |
| `apps/api/src/` | `modules/example/` | NestJS API module structure |
| `apps/web/src/` | `modules/example/` | Vue 3 module pattern |
| `apps/desktop/src/` | `modules/example/` | React/Electron pattern |

**Current Status**: ✅ All 7 packages already have example modules (principle formalizes existing practice)

---

## Why This Principle

### Problem Solved

**Before**:
- Developers guess how to organize code
- Code reviews get stuck on "is this the right pattern?"
- Patterns drift across modules (same problem solved differently)
- New developers have no executable reference
- Static documentation gets out of sync

**After**:
- One source of truth: the example module
- Code reviews reference executable code
- All modules follow proven pattern
- New developers have working template
- Patterns stay in sync (example is production code)

### Benefits

✅ **Faster Onboarding**: New devs study example instead of asking questions  
✅ **Clearer Code Reviews**: "Compare to example module, this diverges"  
✅ **Pattern Consistency**: All modules follow the same structure  
✅ **Executable Specs**: Patterns are proven to work end-to-end  
✅ **Lower Maintenance**: One pattern to maintain, not multiple variants  
✅ **Documentation Sync**: Example stays current (it's production code)  

---

## Implementation Details

### Example Module Structure (by Package)

#### 1. packages/contracts/src/modules/example/

Demonstrates **Principle VI: Contract Standardization**

```
api/
  ├── crud.ts          # Request/response types with Zod validation
  └── index.ts         # Export aggregation

protocol/
  ├── example-rpc-map.ts       # RPC operations (types from ../api)
  ├── example-event-map.ts     # Domain events
  └── index.ts

dtos/
  └── complex-example.dto.ts   # Composed type example

aggregates/
  └── example.aggregate.ts     # Entity types
```

**Shows**:
- ✅ Zod schemas for validation
- ✅ Request/response types structure
- ✅ RPC maps importing from API
- ✅ Event maps with proper typing
- ✅ DTOs composing aggregates

#### 2. packages/domain-server/src/modules/example/

Demonstrates **Principle I: DDD Architecture**

```
domain/
  ├── entities/
  ├── value-objects/
  ├── repositories/      # Interface (abstraction)
  └── services/         # Cross-aggregate logic

application/
  ├── dtos/
  ├── use-cases/
  └── mappers/          # Entity ↔ DTO transformation

infrastructure/
  ├── persistence/      # Prisma/DB implementation
  └── events/          # Event publishing
```

**Shows**:
- ✅ Clear DDD layering
- ✅ Domain entities with business rules
- ✅ Repository pattern
- ✅ Use cases (application logic)
- ✅ Mappers for transformations

#### 3. packages/domain-client/src/modules/example/

Demonstrates **Principle III: Platform-Agnostic Client Code**

```
models/            # Not tied to Vue/React
repositories/      # Data access abstraction
services/         # Business logic
validators/       # Input validation
mappers/         # API response → model
```

**Shows**:
- ✅ Zero Vue/React imports
- ✅ Can be used by web AND desktop
- ✅ Validator pattern with Zod
- ✅ Service layer for logic

#### 4. packages/ui/components/example/

Demonstrates **Component Patterns**

```
ExampleCard.vue        # Vue 3 component (web)
ExampleCard.tsx        # React component (desktop)
ExampleCard.types.ts   # Shared interfaces
ExampleCard.styles.ts  # Shared styles
ExampleCard.stories.ts # Storybook examples
ExampleCard.spec.ts    # Tests
```

**Shows**:
- ✅ Props and slots
- ✅ Accessibility
- ✅ Responsive design
- ✅ Test patterns
- ✅ Storybook documentation

#### 5. apps/api/src/modules/example/

Demonstrates **NestJS API Module Pattern**

```
dto/                  # DTOs with class-validator
guards/              # Custom auth logic
decorators/          # Custom decorators
example.controller.ts # HTTP handlers + OpenAPI docs
example.service.ts    # Business logic
example.module.ts     # NestJS module
example.spec.ts       # Integration tests
```

**Shows**:
- ✅ DTOs with validators
- ✅ Controllers with docs
- ✅ Dependency injection
- ✅ Error handling
- ✅ Integration tests

#### 6. apps/web/src/modules/example/

Demonstrates **Vue 3 Web Module Pattern**

```
components/       # Vue components
views/           # Page components
composables/     # Shared composition logic
stores/          # Pinia state management
services/        # API integration
router/          # Vue Router
```

**Shows**:
- ✅ `<script setup>` syntax
- ✅ Pinia stores with types
- ✅ Composables
- ✅ Router integration
- ✅ State management

#### 7. apps/desktop/src/modules/example/

Demonstrates **React/Electron Module Pattern**

```
components/    # React components
pages/        # Page components
hooks/        # Custom React hooks
context/      # React context for state
ipc/          # Electron IPC handlers
services/     # Business logic
```

**Shows**:
- ✅ React functional components
- ✅ Hooks pattern
- ✅ Context API / Zustand
- ✅ IPC communication
- ✅ Dialog/modal patterns

---

## Code Review Standards

### What to Look For

**Before PR approval, compare to example module**:

```markdown
✅ Structure
- Does module folder layout match example module?
- Are components/services/stores organized the same way?

✅ Types
- Are types imported (not inline defined)?
- Are imports from the right places?

✅ Patterns
- Does it follow the example's pattern?
- Is error handling similar?
- Are tests structured like example tests?

✅ Comments
- Does it explain WHY patterns are used?
- Are JSDoc comments similar style?

⚠️ If divergence
- Did example module need updating?
- Is there a justified reason for difference?
- Should this become a new pattern in Constitution?
```

### Example PR Review Comment

```markdown
**Pattern Alignment**
This module structure differs from the example module in apps/web/src/modules/example/.

Please either:
1. Adjust to match example module structure, OR
2. Explain why your approach is better and update the example module

Reference: [Constitution Principle VII](https://...) - Example modules are the source of truth.
```

---

## Governance

### Maintenance Schedule

| Frequency | Task | Owner |
|-----------|------|-------|
| Per PR | Verify module follows example pattern | Code Reviewer |
| Per Week | Spot-check example modules for drift | Dev Lead |
| Per Sprint | Audit example modules in code review | Architecture Team |
| Per Major Change | Update all example modules if patterns change | Feature Owner |
| Quarterly | Refresh example documentation | Tech Lead |

### How to Update Example Modules

**When adding new pattern**:

1. Implement in example module first
2. Write tests demonstrating pattern
3. Document with JSDoc comments
4. Run tests + build + lint
5. Get code review approval
6. Other modules follow pattern going forward

**When Constitution changes**:

1. Update Constitution first
2. Update relevant example modules
3. Run full test suite
4. Notify team of changes
5. Reference in PR descriptions

---

## Developer Quick Start

**You're starting a new module?**

1. Find example module in this package: [see table above]
2. Copy folder structure from example
3. Read JSDoc comments explaining patterns
4. Study example tests
5. Follow the same organization
6. Build + test + lint before PR

**You're not sure about a pattern?**

1. Find example module in this package
2. Search for similar functionality
3. Follow the same structure/approach
4. If example doesn't show it, add it
5. Update Constitution if it's a new principle

**Example doesn't match Constitution?**

1. Update example module to match Constitution
2. Get code review approval
3. Notify team of pattern change
4. Other modules follow example going forward

---

## Documentation Files Created

1. **[.specify/memory/constitution.md]()**
   - ✅ Principle VI: Contract Standardization (lines 87-139)
   - ✅ Principle VII: Example Modules (lines 142-205)
   - ✅ Version: 1.2.0

2. **[.specify/memory/contracts-code-standards.md]()**
   - Comprehensive guide for Principle VI
   - Examples per layer with code samples
   - Build verification checklist

3. **[.specify/memory/example-modules-governance.md]()** (NEW)
   - Complete governance guide for Principle VII
   - Structure details per package
   - Code review standards
   - Maintenance schedule
   - Pattern hunt process
   - CI/CD integration guidance

4. **[.specify/memory/constitution-amendment-summary.md]()**
   - Updated to track both amendments (VI and VII)
   - Version history (1.0.0 → 1.1.0 → 1.2.0)

---

## Verification

✅ **Constitution updated**:
```bash
grep "### VII" .specify/memory/constitution.md  # Principle VII found
grep "1.2.0" .specify/memory/constitution.md     # Version updated
```

✅ **Governance guide created**:
```bash
ls -la .specify/memory/example-modules-governance.md  # File exists
```

✅ **All packages have example modules** (already exist):
```bash
ls packages/contracts/src/modules/example/
ls packages/domain-server/src/modules/example/
ls packages/domain-client/src/modules/example/
ls packages/ui/components/example/
ls apps/api/src/modules/example/
ls apps/web/src/modules/example/
ls apps/desktop/src/modules/example/
# All directories found ✅
```

✅ **Contracts build success**:
```bash
pnpm nx build contracts  # ✅ Zero errors (verified earlier)
```

---

## Summary

### What This Principle Does

**Principle VII** formalizes existing practice into a governing rule:

> Example modules are **production-quality**, **always-current**, **executable demonstrations** of all code standards. They are the first place to look for patterns, the source of truth in code reviews, and the foundation for onboarding.

### Who This Affects

- **All developers**: Must study example module before coding
- **Code reviewers**: Must reference example in reviews
- **Architects**: Must keep example modules in sync
- **New hires**: Use example as template
- **New packages**: Must include example module

### Why It Matters

Without Principle VII:
- Developers guess at patterns
- Patterns drift and become inconsistent
- Code reviews get stuck discussing patterns
- Documentation goes out of sync
- Onboarding takes longer

With Principle VII:
- One source of truth
- Clear patterns everyone follows
- Code reviews reference production code
- Patterns stay current
- Faster onboarding

---

## Related Documents

- **[Constitution v1.2.0]()** - Principles I-VII with Principle VII detailed
- **[Contracts Code Standards]()** - Details for Principle VI
- **[Example Modules Governance Guide]()** - Complete governance for Principle VII
- **[Constitution Amendment Summary]()** - Version history and amendments

---

**Status**: ✅ Complete and Active  
**Effective Date**: 2026-02-03  
**Version**: 1.2.0  
**Maintainer**: Architecture Team
