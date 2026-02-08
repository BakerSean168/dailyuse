# Governance Module — Developer Quickstart

**Branch**: `001-governance-module` | **Date**: 2026-02-08  
**Purpose**: Fast-track onboarding guide for implementing the Governance module

## Overview

The Governance module is a living constitution for the monorepo. It provides Rule CRUD with strict lifecycle constraints, tag-based discovery, keyword search with relevance scoring, and immutable audit trails. The module demonstrates canonical DDD patterns and serves as the reference implementation for all future modules.

**Key Characteristics**:
- **Vertical-slice architecture**: All layers (contracts, domain, application, infrastructure) live inside `packages/governance`
- **Dogfooding requirement**: Source code must exemplify all patterns it defines
- **Multi-platform**: Adapters for API (Express/NestJS), Web (Vue 3), Desktop (React/Electron)
- **Type-safe**: TypeScript strict mode, Prisma ORM, Zod validation

---

## Prerequisites

Before implementation, ensure:
- [x] You have read [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), and [data-model.md](data-model.md)
- [x] You have reviewed the [architecture.md](_bmad-output/planning-artifacts/architecture.md) for vertical-slice guidance
- [x] You understand the constitution principles (`.specify/memory/constitution.md`), especially Principle VII (Example Modules)

---

## Phase 0: Package Restructuring (Priority P0)

**User Story 5** from spec.md: Rename `example-sample` to `governance` before any other work.

### Step 1: Rename Package

```bash
# 1. Rename directory
cd packages/
git mv example-sample governance

# 2. Update package.json
# Change: "name": "@dailyuse/example-sample"
# To:     "name": "@dailyuse/governance"

# 3. Update project.json (Nx config)
# Change project name references from example-sample to governance

# 4. Update tsconfig.json references

# 5. Update barrel exports in src/index.ts
# Change namespace names: ExampleSample → Governance
```

### Step 2: Find and Replace All References

```bash
# Search for all instances of "example-sample" and replace with "governance"
# Search for "ExampleSample" and replace with "Governance"
# Check: package.json, project.json, imports in apps/api, apps/web, apps/desktop

# Verify with Nx graph
pnpm nx graph
# Ensure "governance" node appears correctly
```

### Step 3: Build and Test

```bash
# Build governance package
pnpm nx build governance

# Run existing tests (they should still pass with renamed package)
pnpm nx test governance

# Commit restructuring
git add .
git commit -m "refactor: rename example-sample to governance package"
```

**Gate**: Package builds successfully, Nx graph recognizes `governance`, no import errors.

---

## Phase 1: Domain Layer (Priority P1)

Implement core domain logic following DDD patterns from `data-model.md`.

### Step 1: Value Objects (domain-shared)

Create value objects in `packages/governance/src/domain-shared/value-objects/`:

**Files to create**:
- `rule-id.ts` — RuleId branded type using `createIdType` utility
- `rule-status.ts` — RuleStatus companion object with `.canTransitionTo()` method
- `rule-severity.ts` — RuleSeverity companion object
- `rule-tag.ts` — RuleTag class with normalization in `.create()` method
- `code-snippet.ts` — CodeSnippet class with validation (max 10KB)

**Example: RuleTag with normalization**
```typescript
// rule-tag.ts
import { Result, ValueObject } from '@dailyuse/utils';

export class RuleTag extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }
  
  static create(raw: string): Result<RuleTag> {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (normalized.length === 0) {
      return Result.fail('Tag cannot be empty');
    }
    
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      return Result.fail('Tag must contain only lowercase letters, numbers, and hyphens');
    }
    
    return Result.ok(new RuleTag(normalized));
  }
  
  get value(): string {
    return this.props;
  }
}
```

**Test**: Write unit tests for each value object. Verify normalization, validation, and immutability.

---

### Step 2: Aggregate Root (domain-server)

Create `Rule` aggregate root in `packages/governance/src/domain-server/aggregates/Rule.ts`:

**Key Methods**:
- `Rule.create(props): Result<Rule>` — Factory method, generates ID, sets Draft status, emits `rule:created` event
- `Rule.fromPersistenceDTO(dto): Rule` — Restores from database (no validation, no events)
- `activate(): Result<void>` — Transitions Draft → Active
- `deprecate(reason, replacementId?): Result<void>` — Transitions Active → Deprecated (validates severity)
- `reactivate(): Result<void>` — Transitions Deprecated → Active
- ` update(props): Result<void>` — Updates content, emits `rule:updated` event
- `addTag(tag): Result<void>` — Adds normalized tag
- `removeTag(tag): Result<void>` — Removes tag (validates min 1 remains)
- `addCodeSnippet(snippet): Result<void>` — Adds Good or Bad example
- `removeCodeSnippet(snippetId): Result<void>` — Removes snippet (validates min 1 Good + 1 Bad remains)

**Example: Lifecycle enforcement**
```typescript
// Rule.ts
deprecate(reason: string, replacementRuleId?: RuleId): Result<void> {
  if (this._severity === RuleSeverity.Mandatory) {
    return Result.fail('MANDATORY rules must be downgraded to RECOMMENDED before deprecation');
  }
  
  if (!RuleStatusCompanion.canTransitionTo(this._status, RuleStatus.Deprecated, this._severity)) {
    return Result.fail('Invalid status transition');
  }
  
  this._status = RuleStatus.Deprecated;
  this._deprecationReason = reason;
  this._replacementRuleId = replacementRuleId;
  
  this.addDomainEvent<GovernanceEventMap['rule:deprecated']>('rule:deprecated', {
    ruleId: this._id,
    reason,
    replacementRuleId,
  });
  
  return Result.ok();
}
```

**Test**: Write unit tests for all business methods. Verify lifecycle constraints, event emission, and invariants.

---

### Step 3: Rule Revision Entity (domain-server)

Create `RuleRevision` in `packages/governance/src/domain-server/entities/RuleRevision.ts`:

**Key Characteristics**:
- **Immutable**: No `update()` or `delete()` methods
- **Factory-only creation**: `RuleRevision.create(rule, author, changedFields, changeType)`
- **Snapshot storage**: `previousValues` and `newValues` as JSON

**Example**:
```typescript
// RuleRevision.ts
export class RuleRevision extends Entity<string> {
  private constructor(props: RuleRevisionDTO) {
    super(props);
  }
  
  static create(
    rule: Rule,
    author: UserId,
    changedFields: string[],
    changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated'
  ): RuleRevision {
    const revisionNumber = rule.revisions.length + 1; // Sequential
    
    return new RuleRevision({
      id: uuidv4(),
      ruleId: rule.id,
      revisionNumber,
      authorId: author,
      changedFields,
      previousValues: {}, // Capture old values
      newValues: {}, // Capture new values
      changeType,
      createdAt: new Date(),
    });
  }
  
  // No update() or delete() methods — immutable by design
}
```

**Test**: Verify immutability, sequential revision numbers, and append-only behavior.

---

### Step 4: Repository Interface (domain-server)

Create `IRuleRepository` in `packages/governance/src/domain-server/repositories/IRuleRepository.ts`:

**Methods**:
```typescript
export interface IRuleRepository {
  save(rule: Rule): Promise<Result<void>>;
  findById(id: RuleId): Promise<Result<Rule>>;
  findByCode(code: string): Promise<Result<Rule>>;
  findAll(filter?: RuleFilter): Promise<Result<Rule[]>>;
  search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>>;
  delete(id: RuleId): Promise<Result<void>>;
  exists(code: string): Promise<boolean>;
}

export const RULE_REPOSITORY_TOKEN = Symbol('IRuleRepository');
```

---

## Phase 2: Application Layer (Priority P1)

Implement use cases in `packages/governance/src/application/`.

### Application Services

**Files to create**:
- `RuleApplicationService.ts` — CRUD operations (create, update, delete, get, list)
- `RuleSearchApplicationService.ts` — Search/filter operations with relevance scoring
- `RuleRevisionApplicationService.ts` — Audit history operations

**Example: Create Rule Use Case**
```typescript
// RuleApplicationService.ts
export class RuleApplicationService {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async createRule(req: CreateRuleReq, author: UserId): Promise<Result<RuleDTO>> {
    // 1. Check uniqueness
    const exists = await this.ruleRepository.exists(req.code);
    if (exists) {
      return Result.fail(`Rule code ${req.code} already exists`);
    }
    
    // 2. Create domain object
    const ruleResult = Rule.create({
      code: req.code,
      title: req.title,
      description: req.description,
      severity: req.severity,
      tags: req.tags,
      goodExamples: req.goodExamples,
      badExamples: req.badExamples,
      liveReferenceLocation: req.liveReferenceLocation,
      authorId: author,
    });
    
    if (ruleResult.isFailure) {
      return Result.fail(ruleResult.error);
    }
    
    const rule = ruleResult.getValue();
    
    // 3. Persist
    const saveResult = await this.ruleRepository.save(rule);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error);
    }
    
    // 4. Publish domain events
    await this.eventBus.publishAll(rule.domainEvents);
    
    // 5. Map to DTO
    return Result.ok(RuleMapper.toDTO(rule));
  }
}
```

---

## Phase 3: Infrastructure Layer (Priority P1)

Implement Prisma repository and mappers in `packages/governance/src/infrastructure/`.

### Step 1: Prisma Schema

Create `schema.prisma` in `packages/governance/src/infrastructure/prisma/`:

```prisma
model Rule {
  id                     String        @id @default(uuid())
  code                   String        @unique
  title                  String
  description            String        @db.Text
  severity               String
  status                 String
  deprecationReason      String?       @db.Text
  replacementRuleId      String?
  liveReferenceLocation  String?
  tags                   Json
  codeSnippets           Json
  authorId               String
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt
  
  revisions              RuleRevision[]
  
  @@map("rules")
}

model RuleRevision {
  id              String   @id @default(uuid())
  ruleId          String
  rule            Rule     @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  revisionNumber  Int
  authorId        String
  changedFields   Json
  previousValues  Json?
  newValues       Json?
  changeType      String
  createdAt       DateTime @default(now())
  
  @@unique([ruleId, revisionNumber])
  @@map("rule_revisions")
}
```

### Step 2: Prisma Repository Implementation

Create `PrismaRuleRepository.ts` in `packages/governance/src/infrastructure/repositories/`:

**Key Methods**:
- Map Prisma models ↔ domain objects using `RuleMapper`
- Implement search with relevance scoring (in-memory for MVP <500 rules)
- Handle JSON fields (`tags`, `codeSnippets`) serialization

---

## Phase 4: API Layer (Priority P2)

Create Express routes in `apps/api/src/modules/governance/interface/`.

### Step 1: CRUD Routes

Create `governance-crud.routes.ts`:

```typescript
// governance-crud.routes.ts
import { Router } from 'express';
import { requireRole, authenticateUser } from '../../auth/middleware';

export function registerGovernanceCrudRoutes(router: Router) {
  // Create rule (Tech Lead/Architect only)
  router.post('/api/rules', requireRole(['TechLead', 'Architect']), async (req, res) => {
    const result = await ruleApplicationService.createRule(req.body, req.user.id);
    if (result.isFailure) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json({ data: result.getValue() });
  });
  
  // Get rule (all authenticated users)
  router.get('/api/rules/:id', authenticateUser, async (req, res) => {
    const result = await ruleApplicationService.getRule(req.params.id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    return res.status(200).json({ data: result.getValue() });
  });
  
  // List rules (all authenticated users)
  router.get('/api/rules', authenticateUser, async (req, res) => {
    const result = await ruleApplicationService.listRules(req.query);
    return res.status(200).json({ data: result.getValue() });
  });
  
  // Update rule (Tech Lead/Architect only)
  router.put('/api/rules/:id', requireRole(['TechLead', 'Architect']), async (req, res) => {
    const result = await ruleApplicationService.updateRule(req.params.id, req.body);
    if (result.isFailure) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json({ data: result.getValue() });
  });
  
  // Delete rule (Tech Lead/Architect only)
  router.delete('/api/rules/:id', requireRole(['TechLead', 'Architect']), async (req, res) => {
    const result = await ruleApplicationService.deleteRule(req.params.id);
    if (result.isFailure) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(204).send();
  });
}
```

### Step 2: Search Routes

Create `governance-search.routes.ts` with search and filter endpoints.

### Step 3: Revision Routes

Create `governance-revision.routes.ts` for audit history.

---

## Phase 5: Web UI (Priority P2)

Implement Vue 3 presentation layer in `apps/web/src/modules/governance/presentation/`.

### Step 1: Pinia Store

Create `governanceStore.ts`:

```typescript
// stores/governanceStore.ts
import { defineStore } from 'pinia';

export const useGovernanceStore = defineStore('governance', {
  state: () => ({
    rules: [] as RuleDTO[],
    selectedRule: null as RuleDTO | null,
    isLoading: false,
    error: null as string | null,
    searchQuery: '',
    selectedTags: [] as string[],
    statusFilter: null as RuleStatus | null,
  }),
  
  actions: {
    async fetchRules() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await ruleApi.list({});
        this.rules = response.rules;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchRuleById(id: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await ruleApi.get(id);
        this.selectedRule = response.rule;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    // ... more actions
  },
  
  getters: {
    filteredRules: (state) => {
      let filtered = state.rules;
      
      if (state.searchQuery) {
        filtered = filtered.filter(rule =>
          rule.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          rule.code.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
      }
      
      if (state.selectedTags.length > 0) {
        filtered = filtered.filter(rule =>
          rule.tags.some(tag => state.selectedTags.includes(tag))
        );
      }
      
      if (state.statusFilter) {
        filtered = filtered.filter(rule => rule.status === state.statusFilter);
      }
      
      return filtered;
    },
  },
});
```

### Step 2: Views

Create views in `presentation/views/`:
- `GovernanceListView.vue` — Rule list with search and filters
- `GovernanceDetailView.vue` — Rule detail with syntax-highlighted code snippets
- `RuleEditorView.vue` — Create/edit form

### Step 3: Components

Create reusable components in `presentation/components/`:
- `RuleCard.vue` — Rule preview card
- `CodeSnippetView.vue` — Syntax-highlighted code block (Good/Bad)
- `RuleStatusBadge.vue` — Status indicator (Draft/Active/Deprecated)

---

## Phase 6: Desktop UI (Priority P3 - Post-MVP)

Implement React presentation layer in `apps/desktop/src/modules/governance/presentation/`.

- Follow same structure as Web (stores, components, views)
- Use React hooks instead of composables
- Reuse same API client and business logic

---

## Testing Strategy

### Unit Tests (>80% coverage for domain layer)

- Value objects: Test validation, normalization, immutability
- Aggregate root: Test business methods, lifecycle constraints, event emission
- Application services: Test use cases in isolation (mock repository)

```bash
pnpm nx test governance --coverage
```

### Integration Tests

- API endpoints: Test request validation, RBAC enforcement, response format
- Repository: Test Prisma queries, mapping correctness
- Search: Test relevance scoring, filtering

### E2E Tests (Post-MVP)

- User journeys: Browse rules, create rule, deprecate rule, search patterns

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| **Forgetting to normalize tags** | Always call `RuleTag.create()` – normalization happens automatically |
| **Missing domain events** | Check aggregate methods call `this.addDomainEvent()` |
| **RBAC bypass** | Verify API middleware checks roles before application service calls |
| **Immutability violation** | Never add `update()` or `delete()` methods to RuleRevision |
| **Direct database access** | Always go through repository interface (Dependency Inversion) |
| **Lifecycle constraint skip** | Enforce in domain layer (`RuleStatus.canTransitionTo()`), not API |
| **Poor search performance** | For <500 rules, in-memory is fine. For >500, use SQLite FTS5 |

---

## Dogfooding Compliance Checklist

Before merge, verify Governance source code exemplifies:

- [x] Props Object pattern in aggregate constructors
- [x] Private constructors + factory methods (`create`, `fromPersistenceDTO`)
- [x] Private backing fields + readonly getters (no direct property access)
- [x] Const object enums (no TypeScript `enum` keyword)
- [x] Branded types for IDs (`RuleId`, `UserId`)
- [x] Immutable audit entity (RuleRevision has no update/delete)
- [x] Lifecycle state machine in value object
- [x] Domain events via `addDomainEvent()`
- [x] Repository interface with DI token
- [x] Zod schemas for API validation
- [x] Result pattern for error handling

---

## Next Steps

1. Complete Phase 0 (package restructuring)
2. Implement domain layer (Phases 1-2)
3. Implement infrastructure + API (Phase 3-4)
4. Implement Web UI (Phase 5)
5. Run tests and validate dogfooding compliance
6. Generate `/speckit.tasks` for granular task breakdown

**Questions?** Refer to:
- [Architecture.md](_bmad-output/planning-artifacts/architecture.md) for patterns
- [Data Model.md](data-model.md) for entity design
- [Spec.md](spec.md) for requirements

---

**Quickstart Complete** ✅  
Ready to implement! 🚀
