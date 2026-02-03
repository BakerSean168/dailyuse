# Example Modules as Executable Code Standards (Living Documentation)

**Constitutional Principle**: VII  
**Version**: 1.0.0  
**Effective Date**: 2026-02-03  
**Status**: Active

---

## Overview

Every package and app in the DailyUse monorepo containing business modules **MUST** include an `example` module that serves as:

1. **Reference Implementation** - Demonstrates correct patterns for that context
2. **Executable Specification** - Proves patterns work end-to-end
3. **Living Documentation** - Stays in sync with code standards
4. **Onboarding Tool** - First stop for new developers
5. **Code Review Anchor** - Source of truth in pattern discussions

Unlike static documentation that drifts, example modules **are production code** that must compile, test, and deploy successfully.

---

## Principle Statement

> All code standards and architectural patterns in the DailyUse Constitution are **demonstrated by example modules**. When in doubt about a pattern, consult the example module. If the example module does something differently, the Constitution principle applies; update the example accordingly.

---

## Required Example Modules by Package

### 1. `packages/contracts/src/modules/example/`

**Demonstrates**: Contract architecture (Protocol/API/DTOs layering)

**Structure**:
```
packages/contracts/src/modules/example/
├── api/
│   ├── crud.ts              # Request/response types with Zod schemas
│   └── index.ts             # Export aggregation
├── dtos/
│   └── complex-example.dto.ts  # Composed type example
├── protocol/
│   ├── example-rpc-map.ts   # RPC operations (types from API)
│   ├── example-event-map.ts # Domain events
│   └── index.ts             # Export protocol types
├── aggregates/
│   └── example.aggregate.ts # Entity types (ExampleClientDTO, etc.)
└── index.ts                 # Package export
```

**Key Patterns Shown**:
- ✅ Request types with Zod validation
- ✅ Response types as aggregate references
- ✅ RPC maps importing from API layer
- ✅ DTOs composing aggregates
- ✅ Event maps with proper structure
- ✅ Type traceability (all types import from api/index.ts)

**Current Status**: ✅ Fully Compliant (lines 1-100 in example-rpc-map.ts comment block)

---

### 2. `packages/domain-server/src/modules/example/` (Backend DDD)

**Demonstrates**: Backend domain-driven design structure

**Structure**:
```
packages/domain-server/src/modules/example/
├── domain/
│   ├── entities/
│   │   └── example.entity.ts        # Domain entity with business rules
│   ├── value-objects/
│   │   └── example-status.vo.ts     # Immutable value objects
│   ├── repositories/
│   │   └── example.repository.ts    # Repository interface (abstraction)
│   └── services/
│       └── example.service.ts       # Domain service (cross-aggregate logic)
├── application/
│   ├── dtos/
│   │   └── create-example.dto.ts    # Input/output DTOs
│   ├── use-cases/
│   │   ├── create-example.use-case.ts
│   │   └── list-examples.use-case.ts
│   └── mappers/
│       └── example.mapper.ts        # Entity ↔ DTO transformation
├── infrastructure/
│   ├── persistence/
│   │   └── example.repository.impl.ts  # Prisma/DB implementation
│   └── events/
│       └── example.event-publisher.ts # Event publishing
└── index.ts                          # Public API (only export use cases + entities)
```

**Key Patterns Shown**:
- ✅ Domain layer with entities and value objects
- ✅ Repository pattern (interface + implementation)
- ✅ Use cases with dependency injection
- ✅ DTOs for application boundaries
- ✅ Mappers for entity transformations
- ✅ Clear separation: domain → application → infrastructure
- ✅ Event publishing pattern

**Verification**:
```bash
# Must compile and test without errors
pnpm nx build domain-server
pnpm nx test domain-server --include="**/example/**"
```

---

### 3. `packages/domain-client/src/modules/example/` (Frontend-Agnostic Client Logic)

**Demonstrates**: Platform-agnostic client-side business logic

**Structure**:
```
packages/domain-client/src/modules/example/
├── models/
│   └── example.model.ts           # Client-side entity (not tied to Vue/React)
├── repositories/
│   └── example.repository.ts      # Data access abstraction
├── services/
│   └── example.service.ts         # Business logic (validation, composition)
├── validators/
│   └── example.validator.ts       # Input validation
├── mappers/
│   └── example.mapper.ts          # API response → model transformation
└── index.ts                        # Public exports (no framework dependencies)
```

**Key Patterns Shown**:
- ✅ No Vue/React imports anywhere
- ✅ Platform-agnostic models
- ✅ Repository pattern for data
- ✅ Service layer for logic
- ✅ Validators using Zod
- ✅ Can be used by both web and desktop apps

**Verification**:
```bash
# Should NOT import @vue or @react
grep -r "@vue\|@react" packages/domain-client/src/modules/example/ || echo "✅ No framework deps"

# Must compile and test
pnpm nx build domain-client
pnpm nx test domain-client --include="**/example/**"
```

---

### 4. `packages/ui/components/example/` (UI Component Pattern)

**Demonstrates**: Reusable component design (framework-agnostic when possible)

**Structure**:
```
packages/ui/components/example/
├── ExampleCard.vue              # Vue 3 example (web)
├── ExampleCard.tsx              # React example (desktop)
├── example-card.styles.ts       # Shared styles
├── example-card.types.ts        # Shared TypeScript interfaces
├── ExampleCard.stories.ts       # Storybook examples
└── ExampleCard.spec.ts          # Component tests

# Or framework-agnostic:
├── composable/
│   └── useExampleCard.ts        # Shared composition logic
├── ExampleCard.vue
├── ExampleCard.tsx
├── ExampleCard.spec.ts
└── README.md
```

**Key Patterns Shown**:
- ✅ Props interface clearly defined
- ✅ Slots for composition
- ✅ Accessibility attributes (a11y)
- ✅ Responsive design patterns
- ✅ Storybook documentation
- ✅ Unit tests for all props/slots
- ✅ Error states demonstrated

**Verification**:
```bash
pnpm nx build ui
pnpm nx test ui --include="**/example/**"
pnpm storybook build  # ExampleCard visible in Storybook
```

---

### 5. `apps/api/src/modules/example/` (NestJS API Module)

**Demonstrates**: RESTful API module structure with NestJS

**Structure**:
```
apps/api/src/modules/example/
├── dto/
│   ├── create-example.dto.ts
│   └── update-example.dto.ts
├── guards/
│   └── example.guard.ts           # Custom auth/business logic guard
├── decorators/
│   └── example.decorator.ts       # Custom decorator example
├── example.controller.ts           # HTTP handlers + documentation
├── example.service.ts              # Business logic
├── example.module.ts               # NestJS module definition
└── example.spec.ts                 # Integration tests
```

**Key Patterns Shown**:
- ✅ DTOs with class-validator decorators
- ✅ Controller with OpenAPI/Swagger docs
- ✅ Service with dependency injection
- ✅ Guard/decorator examples
- ✅ Error handling (BadRequest, Unauthorized, etc.)
- ✅ Logging and monitoring
- ✅ Integration tests with supertest

**Verification**:
```bash
pnpm nx test api --include="**/example/**"
pnpm nx build api
pnpm nx serve api  # Should start without errors
```

---

### 6. `apps/web/src/modules/example/` (Vue 3 Web Module)

**Demonstrates**: Vue 3 module pattern for web app

**Structure**:
```
apps/web/src/modules/example/
├── components/
│   ├── ExampleDetail.vue
│   └── ExampleList.vue
├── views/
│   ├── ExamplePage.vue            # Page component
│   └── ExampleEditPage.vue        # Edit page
├── composables/
│   └── useExampleModule.ts        # Shared composition logic
├── stores/
│   └── example.store.ts           # Pinia state management
├── services/
│   └── example.api.ts             # API integration
├── router/
│   └── example.routes.ts          # Vue Router configuration
└── example.module.ts              # Module initialization
```

**Key Patterns Shown**:
- ✅ Single-file Vue 3 components with `<script setup>`
- ✅ Pinia stores with type-safe getters/actions
- ✅ Composables for shared logic
- ✅ Router integration
- ✅ API service layer
- ✅ Error handling and loading states
- ✅ Component composition and slots

**Verification**:
```bash
pnpm nx serve web  # Should load and render example module
pnpm nx test web --include="**/example/**"
pnpm nx lint web   # Must pass linting
```

---

### 7. `apps/desktop/src/modules/example/` (Electron React Module)

**Demonstrates**: React module pattern for Electron renderer

**Structure**:
```
apps/desktop/src/modules/example/
├── components/
│   ├── ExampleDetail.tsx
│   └── ExampleList.tsx
├── pages/
│   └── ExamplePage.tsx
├── hooks/
│   └── useExample.ts              # Custom React hooks
├── context/
│   └── ExampleContext.tsx         # React context for state
├── ipc/
│   └── example.ipc.ts             # Electron IPC handlers
├── services/
│   └── example.service.ts         # Business logic
└── example.module.tsx             # Module component
```

**Key Patterns Shown**:
- ✅ React functional components with hooks
- ✅ Context API for state management (or Zustand)
- ✅ IPC communication to main process
- ✅ Error boundaries
- ✅ Loading/error states
- ✅ Dialog/modal patterns
- ✅ Platform-specific handling (Electron-only)

**Verification**:
```bash
pnpm nx build desktop
pnpm nx test desktop --include="**/example/**"
pnpm nx start desktop  # Should render example module
```

---

## Governance Rules

### Creation & Maintenance

1. **Creation**:
   - Example modules MUST be created when a new package with modules is added
   - Use the package's existing module structure as template
   - Copy from an existing compliant example if available
   - Add JSDoc comments explaining patterns

2. **Maintenance**:
   - Update example modules whenever adding new Constitution principle
   - Update whenever local patterns change (e.g., new Zod validation approach)
   - Keep examples feature-neutral (don't add business logic)
   - Review examples in every architecture discussion

3. **Testing**:
   - Example module tests MUST have >80% coverage
   - Tests MUST demonstrate error cases (not just happy path)
   - Tests MUST be updated with the pattern they document

### Code Review Standards

**When reviewing PR with pattern changes:**

```markdown
✅ Good review comment:
"This pattern diverges from the example module in packages/contracts/src/modules/example/. 
Please either update the example module or justify why this module differs."

❌ Bad review comment:
"This doesn't match the pattern." (vague, doesn't reference source of truth)
```

**When reviewing new modules:**

```markdown
✅ Checklist:
- [ ] Does this module follow the structure of {package}/modules/example/?
- [ ] Are there tests similar in approach to example?
- [ ] Could someone onboarding learn from this module's patterns?
- [ ] Would you make the same changes in the example module?
```

### PR Template Addition

Add to PR description template:

```markdown
## Pattern Alignment

- [ ] My code follows the example module patterns in this package
- [ ] If I'm introducing a new pattern, I've updated the example module
- [ ] Example module will remain the source of truth for this pattern

**Reference Example Module**: packages/contracts/src/modules/example/
```

### CI/CD Integration

**Example modules MUST be treated as production code**:

```bash
# In your CI pipeline:

# 1. Build must succeed
nx build {package}

# 2. Tests must pass
nx test {package} --include="**/example/**"

# 3. Linting must pass
nx lint {package}

# 4. Type checking must pass
tsc --noEmit

# FAIL the entire build if any example module step fails
```

### Documentation Requirements

**In each example module's README.md:**

```markdown
# {Package} Example Module

This module demonstrates the standard patterns and code organization for {package}.

## What This Module Shows

- Pattern 1: [description + link to constitution]
- Pattern 2: [description + link to constitution]
- ...

## For New Developers

Start here if:
- You're new to this package
- You're unsure how to organize a module
- You want to see a working example

## Key Files to Study

1. `src/example/api/crud.ts` - How to define types
2. `src/example/protocol/example-rpc-map.ts` - How to structure RPC operations
3. `src/example/example.spec.ts` - How to test

## Contributing

If you change this module:
1. Ensure tests pass: `nx test {package} --include="**/example/**"`
2. Update JSDoc comments to explain WHY patterns are used
3. Add edge cases to demonstrate robustness
4. If this changes a pattern, update the Constitution and other modules
```

---

## Quick Reference: Pattern Hunt Process

**Question**: "How should I organize this code?"

**Solution**:

1. **Find the example module**: 
   - Working in contracts? → `packages/contracts/src/modules/example/`
   - Working in domain-server? → `packages/domain-server/src/modules/example/`
   - Working in web components? → `packages/ui/components/example/`

2. **Read the example module**:
   - Look at folder structure
   - Read comments and JSDoc
   - Check the tests to see how it's used

3. **Apply the pattern**:
   - Copy the structure
   - Adapt the names for your domain
   - Follow the same conventions

4. **Verify compliance**:
   - Run tests
   - Run linting
   - Build successfully

5. **If example doesn't show what you need**:
   - Add it to the example module
   - Update Constitution if it's a new principle
   - Notify the team

---

## Checklist: Creating a New Example Module

- [ ] Created folder structure mirroring other modules in package
- [ ] Created files with explanatory JSDoc comments
- [ ] Written tests with >80% coverage
- [ ] All tests pass: `nx test {package} --include="**/example/**"`
- [ ] Builds successfully: `nx build {package}`
- [ ] Passes linting: `nx lint {package}`
- [ ] Added README.md explaining patterns demonstrated
- [ ] Referenced from Constitution principle if applicable
- [ ] Merged before PRs using new patterns

---

## Examples in Action

### Scenario 1: New Developer Onboarding

```
New dev joins, asked to "add a goal RPC operation"

1. Finds: packages/contracts/src/modules/example/
2. Reads: example/api/crud.ts (sees Zod schema pattern)
3. Reads: example/protocol/example-rpc-map.ts (sees import pattern)
4. Creates: goal/api/create-goal.ts (with Zod schema)
5. Adds: goal/protocol/goal-rpc-map.ts entry (importing from api)
6. Runs tests: ✅ PASS (follows example pattern)
7. PR approved: Reviewer compares to example module, no questions
```

### Scenario 2: Architecture Discussion

```
PR discussion: "Should we inline the type or import from API?"

Developer: "By Constitution Principle VI and example module, 
            we import from API to enable validation."

Team: "✅ Reference example module, decision clear."
      "All PRs will apply this pattern going forward."
```

### Scenario 3: Pattern Evolution

```
New pattern needed: "How to handle versioned APIs?"

Steps:
1. Implement in example module: contracts/src/modules/example/api/
2. Write tests demonstrating the pattern
3. Document in JSDoc
4. Consider if Constitution needs update
5. All new modules follow example going forward
6. Old modules updated gradually (not blocking)
```

---

## Maintenance Schedule

| Frequency | Activity | Owner |
|-----------|----------|-------|
| **Per PR** | Review example module compliance | Code Reviewer |
| **Per Sprint** | Audit all example modules for drift | Architecture Team |
| **Per Major Change** | Update example modules if patterns change | Feature Owner |
| **Quarterly** | Refresh example module documentation | Dev Leads |

---

## Summary

**Example modules are:**
- ✅ Production-quality code that compiles and tests
- ✅ The source of truth for architectural patterns
- ✅ Living documentation that evolves with the codebase
- ✅ Onboarding tool for new developers
- ✅ Code review reference point
- ✅ Proof that patterns work end-to-end

**When in doubt**: Check the example module.

**When the example is wrong**: Fix the example module, don't work around it.

**When the example doesn't show it**: Add it to the example module.

---

**Version**: 1.0.0 | **Effective**: 2026-02-03 | **Status**: Active
