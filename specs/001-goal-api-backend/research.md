# Research: Goal Module API Backend

**Date**: 2026-02-11
**Status**: Complete
**Related**: [plan.md](plan.md), [spec.md](spec.md)

## Research Questions

### Q1: Application Layer Architecture Pattern

**Question**: What architecture pattern should be used for the application layer to handle goal CRUD operations, progress tracking, and relationship management?

**Research Approach**: Analyzed governance module implementation pattern

**Decision**: Use Case-Based Application Services with Repository Pattern

**Rationale**:
- Governance module demonstrates successful use case-based pattern
- Each use case is a separate class (e.g., `CreateRuleUseCase`, `UpdateRuleUseCase`)
- Use cases are injected with repository dependencies via constructor
- Application services can compose multiple use cases for complex flows
- Clear separation of concerns: each use case has single responsibility
- Testable in isolation with mock repositories
- Follows DDD application layer best practices

**Alternatives Considered**:
- **Monolithic Application Service**: Single large service class with all methods
  - Rejected: Harder to test, violates single responsibility principle
- **Transaction Script Pattern**: Direct repository calls from routes
  - Rejected: Business logic leaks into presentation layer, no domain model

**Implementation Pattern**:
```typescript
import type { GoalServerDTO } from '@dailyuse/contracts/modules/goal';
import type { IdentityId } from '@dailyuse/contracts/primitives';

// Individual use case class
export class CreateGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}
  
  async execute(
    request: CreateGoalRequest,
    context: { identityId: IdentityId }
  ): Promise<Result<GoalServerDTO>> {
    // 1. Validate input
    // 2. Create domain aggregate via domain service
    // 3. Persist via repository
    // 4. Map to GoalServerDTO from contracts
    // 5. Return Result<GoalServerDTO>
  }
}

// Application service composes use cases
export class GoalApplicationService {
  constructor(
    private readonly createGoal: CreateGoal,
    private readonly updateGoal: UpdateGoal,
    // ... other use cases
  ) {}
}
```

---

### Q2: Infrastructure Layer Repository Implementation

**Question**: How should the infrastructure layer implement persistence for goals with complex relationships (key results, progress records, retrospectives)?

**Research Approach**: Reviewed governance and repository module Prisma implementations

**Decision**: Prisma Repository Pattern with Domain Mappers

**Rationale**:
- Prisma provides type-safe database access with generated types
- Repository pattern isolates domain layer from infrastructure concerns
- Mappers translate between Prisma models and domain aggregates
- Governance module successfully uses `PrismaRuleRepository` pattern
- Repository module demonstrates multi-datasource support (Prisma/SQLite)

**Alternatives Considered**:
- **Direct Prisma Client in Use Cases**: Use Prisma directly without repository abstraction
  - Rejected: Couples domain logic to infrastructure, harder to test, violates DDD
- **TypeORM**: Alternative ORM with repository pattern built-in
  - Rejected: Project already standardized on Prisma; no migration justification

**Implementation Pattern**:
```typescript
// Repository interface in domain layer
export interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findById(uuid: string, options?: FindOptions): Promise<Goal | null>;
  findByAccountUuid(accountUuid: string, options?: ListOptions): Promise<Goal[]>;
  delete(uuid: string): Promise<void>;
}

// Prisma implementation in infrastructure layer
export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  async save(goal: Goal): Promise<void> {
    const persistenceDTO = GoalMapper.toPersistence(goal);
    await this.prisma.goal.upsert({
      where: { uuid: goal.uuid },
      update: persistenceDTO,
      create: persistenceDTO,
    });
  }
  
  async findById(id: GoalId, options?: FindOptions): Promise<Goal | null> {
    const record = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        keyResults: options?.includeChildren ?? false,
        // ... other relations
      },
    });
    return record ? GoalMapper.toDomain(record) : null;
  }
}
```

---

### Q3: API Layer Route Registration Pattern

**Question**: How should Express routes be organized and registered for the goal module?

**Research Approach**: Analyzed governance module API structure in apps/api/src/modules/governance/

**Decision**: Kebab-Case Route Files with Aggregator Index

**Rationale**:
- Governance module uses kebab-case route files (e.g., `governance-crud.routes.ts`)
- Routes grouped by feature area (crud, search, tags, revisions)
- `interface/index.ts` aggregates all route exports
- Initialization file (`governanceInitialization.ts`) wires dependencies and registers routes
- Follows project convention (Constitution Principle IV)

**Alternatives Considered**:
- **Single Routes File**: All routes in one file
  - Rejected: Does not scale as module grows
- **PascalCase Route Files**: `GoalCrudRoutes.ts`
  - Rejected: Violates project naming convention (kebab-case mandatory)

**Implementation Pattern**:
```text
apps/api/src/modules/goal/
├── interface/
│   ├── goal-crud.routes.ts          # POST, GET, PUT, DELETE /api/goals
│   ├── goal-key-result.routes.ts    # Key result CRUD under /api/goals/:id/key-results
│   ├── goal-progress.routes.ts      # Progress tracking /api/goals/:id/progress
│   ├── goal-reminder.routes.ts      # Reminder config /api/goals/:id/reminders
│   └── index.ts                     # Aggregates all route exports
├── initialization/
│   └── goalInitialization.ts        # Creates DI container, wires use cases, returns router
└── module.ts                        # GoalModule class (DI container)
```

```typescript
// goal-crud.routes.ts
export function createGoalCrudRoutes(deps: { goalApplicationService: GoalApplicationService }): Router {
  const router = express.Router();
  
  router.post('/goals', asyncHandler(async (req, res) => {
    const result = await deps.goalApplicationService.createGoal(req.body);
    res.json(result);
  }));
  
  // ... other routes
  
  return router;
}

// goalInitialization.ts
export function initializeGoalModule(prisma: PrismaClient): Router {
  const goalModule = new GoalModule(prisma);
  
  const router = express.Router();
  router.use(createGoalCrudRoutes({ goalApplicationService: goalModule.goalApplicationService }));
  router.use(createGoalKeyResultRoutes({ keyResultService: goalModule.keyResultApplicationService }));
  // ... other route groups
  
  return router;
}
```

---

### Q4: Progress Calculation Method Storage

**Question**: Where and how should the progress calculation method be stored (per goal, as clarified in spec)?

**Research Approach**: Reviewed existing goal domain model and key result contracts

**Decision**: Store `calculationMethod` as enum field on Goal aggregate

**Rationale**:
- Clarification session confirmed: calculation method is per-goal, not global
- Goal aggregate is the natural owner of progress calculation logic
- KeyResultProgress contracts already define `KeyResultCalculationMethod` enum
- Method stored as string enum in Prisma schema, typed enum in domain
- Supports weighted average, maximum, minimum, latest value, sum (may exceed 100%)

**Alternatives Considered**:
- **Global Application Setting**: Single calculation method for all goals
  - Rejected: Clarification specified per-goal storage
- **Per Key Result Override**: Each key result can specify its own method
  - Rejected: Too complex for user experience; per-goal is sufficient

**Implementation**:
```typescript
// Domain aggregate
export class Goal {
  // ...existing fields...
  calculationMethod: KeyResultCalculationMethod; // 'WEIGHTED_AVERAGE' | 'MAX' | 'MIN' | 'LATEST' | 'SUM'
  
  calculateProgress(): number {
    switch (this.calculationMethod) {
      case 'WEIGHTED_AVERAGE':
        return this.calculateWeightedAverage();
      case 'MAX':
        return Math.max(...this.keyResults.map(kr => kr.progress));
      case 'SUM':
        return this.keyResults.reduce((sum, kr) => sum + kr.progress, 0); // May exceed 100%
      // ... other methods
    }
  }
}

// Prisma schema addition
model Goal {
  // ...existing fields...
  calculationMethod String @default("WEIGHTED_AVERAGE") // Store as string, map to enum in domain
}
```

---

### Q5: Folder and Tag Organization

**Question**: How should single folder + multiple tags organization be implemented?

**Research Approach**: Analyzed clarification session decision and existing patterns

**Decision**: Goal has optional `folderUuid` (nullable FK) and `tags` array (string[])

**Rationale**:
- Clarification confirmed: single folder, multiple tags
- Folder is optional (nullable foreign key to GoalFolder table)
- Tags stored as string array in Prisma (PostgreSQL supports arrays)
- Simple implementation; UI can filter/group by folder or tags
- Follows similar pattern in task module (if exists)

**Alternatives Considered**:
- **Tags as Separate Table**: Many-to-many relationship via junction table
  - Rejected: Over-engineered for string tags; array is simpler
- **Hierarchical Folders**: Folder tree with parent-child relationships
  - Rejected: Clarification specified single folder, not hierarchy

**Implementation**:
```typescript
// Domain aggregate
export class Goal {
  folderUuid?: string;  // Optional reference to GoalFolder
  tags: string[];       // Array of tag strings
}

// Prisma schema
model Goal {
  // ...existing fields...
  folderUuid String?
  folder     GoalFolder? @relation(fields: [folderUuid], references: [uuid])
  tags       String[]    @default([])
}

model GoalFolder {
  uuid        String   @id @default(uuid())
  accountUuid String
  name        String
  goals       Goal[]
  // ...other fields...
}
```

---

### Q6: Cascade Delete Strategy

**Question**: How should cascade deletion be implemented when a goal is deleted?

**Research Approach**: Reviewed clarification decision and Prisma cascade options

**Decision**: Prisma Schema-Level Cascade with `onDelete: Cascade`

**Rationale**:
- Clarification confirmed: cascade delete for key results, progress records, retrospectives, reminders
- Prisma supports declarative cascade via `onDelete: Cascade` in schema
- Database enforces referential integrity automatically
- No orphaned records; simpler than application-layer cascade
- Performance: single DELETE propagates automatically

**Alternatives Considered**:
- **Application-Layer Cascade**: Manually delete related records in use case
  - Rejected: More code, risk of missing relations, no transactional guarantee
- **Soft Delete**: Mark deleted but keep records
  - Rejected: Clarification explicitly chose cascade delete

**Implementation**:
```prisma
model Goal {
  uuid          String         @id @default(uuid())
  keyResults    KeyResult[]    @relation("GoalKeyResults", onDelete: Cascade)
  progressRecords ProgressRecord[] @relation("GoalProgressRecords", onDelete: Cascade)
  retrospectives Retrospective[]  @relation("GoalRetrospectives", onDelete: Cascade)
  reminders     Reminder[]      @relation("GoalReminders", onDelete: Cascade)
  // ...other fields...
}

model KeyResult {
  uuid     String @id @default(uuid())
  goalUuid String
  goal     Goal   @relation("GoalKeyResults", fields: [goalUuid], references: [uuid], onDelete: Cascade)
  // ...other fields...
}

// Similar for ProgressRecord, Retrospective, Reminder
```

---

### Q7: Relative Weight Normalization

**Question**: How should relative key result weights be normalized for weighted average calculation?

**Research Approach**: Analyzed clarification decision and existing key result contracts

**Decision**: Normalize Weights Dynamically in Domain Service

**Rationale**:
- Clarification confirmed: accept relative weights, normalize on calculation
- Store raw weights as provided by user (no validation for sum = 100)
- Normalize in `Goal.calculateWeightedAverage()`: divide each weight by total weight sum
- Handles edge cases: all weights zero → equal distribution

**Alternatives Considered**:
- **Enforce Sum = 100**: Reject save if weights don't total 100
  - Rejected: Clarification chose relative weights for user flexibility
- **Auto-Adjust on Save**: Normalize and store adjusted weights
  - Rejected: User-provided values are clearer; normalize on read

**Implementation**:
```typescript
export class Goal {
  calculateWeightedAverage(): number {
    const keyResults = this.keyResults;
    if (keyResults.length === 0) return 0;
    
    // Handle edge case: all weights are zero
    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) {
      // Equal distribution if no weights specified
      return keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
    }
    
    // Normalize weights and compute weighted sum
    const weightedSum = keyResults.reduce((sum, kr) => {
      const normalizedWeight = kr.weight / totalWeight;
      return sum + (kr.progress * normalizedWeight);
    }, 0);
    
    return weightedSum;
  }
}
```

---

### Q7: Reminder Delivery Integration

**Question**: How should reminder delivery be integrated with existing platform scheduling capabilities?

**Research Approach**: Reviewed architecture assumptions and existing reminder patterns

**Decision**: Reminder Module Integration via Domain Events

**Rationale**:
- FR-010 assumes "existing platform scheduling capabilities" exist
- ReminderSetting entity stores configuration (type, schedule, enabled)
- Reminder delivery is handled by separate reminder module (not goal module responsibility)
- Goal module publishes domain events when reminder-related state changes
- Reminder module subscribes to events and schedules notifications accordingly
- Separation of concerns: goal module manages configuration, reminder module handles delivery

**Integration Events**:
```typescript
// Goal module publishes these events
interface GoalReminderConfigured {
  type: 'goal:ReminderConfigured';
  payload: {
    goalId: GoalId;
    identityId: IdentityId;
    reminderType: ReminderType;
    schedule: ReminderSchedule;
  };
}
```

**Reminder Module Responsibilities**:
- Subscribe to goal domain events
- Calculate next notification time based on schedule
- Store pending notifications in scheduler queue
- Send notifications via platform channels (email, push, in-app)

**Implementation Note**: If reminder module doesn't exist yet, goal module implementation is NOT blocked—reminder configuration CRUD still functional, delivery is deferred.

---

## Technology Stack Validation

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| TypeScript | 5.8.3+ | Application language | ✅ Validated |
| Node.js | 18+ | Runtime environment | ✅ Validated |
| Express | Latest | API framework | ✅ Validated |
| Prisma | Latest | ORM and type generation | ✅ Validated |
| Vitest | Latest | Unit testing framework | ✅ Validated |
| SQLite | - | Local development database | ✅ Validated |
| PostgreSQL | - | Production database | ✅ Validated |

**Notes**:
- All technologies are already in use in the monorepo
- No new dependencies required
- Prisma migrations will be managed via Nx executors

---

## Integration Points

### Internal Module Dependencies

| Module | Dependency Type | Purpose |
|--------|----------------|---------|
| `@dailyuse/contracts` | Compile-time | Shared type definitions (goal contracts, primitives) |
| `@dailyuse/utils` | Runtime | Event bus, logging, utilities |
| `packages/goal/domain-server` | Runtime | Domain aggregates, repositories, services |
| `packages/goal/domain-shared` | Runtime | Shared domain primitives |

### External Service Integration

- **Authentication**: API routes use existing auth middleware from apps/api/src/shared
- **Event Bus**: Domain events published via `@dailyuse/utils` event bus
- **Reminder Scheduling**: Integrates with existing reminder/scheduler infrastructure
- **IPC (Desktop)**: Desktop main process registers IPC handlers that delegate to application services

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Progress calculation method change affects existing goals | Low | Medium | Migration script to set default method for existing goals |
| Cascade delete accidentally removes important data | Low | High | Require user confirmation before delete; backup strategy |
| Sum calculation method produces confusing >100% values | Medium | Low | UI should indicate when sum method is in use |
| Relative weight normalization edge cases | Medium | Medium | Comprehensive unit tests for weight calculation |
| Performance with 100+ goals and 500+ key results | Low | Medium | Index optimization on Prisma schema; pagination for list queries |

---

## Implementation Sequence Recommendation

Based on dependency analysis and risk assessment:

**Phase 1: Application Layer Foundation**
1. Create use case classes for Goal CRUD (CreateGoal, UpdateGoal, DeleteGoal, GetGoal, ListGoals)
2. Implement GoalApplicationService that composes use cases
3. Add unit tests for use cases (mocked repositories)

**Phase 2: Infrastructure Layer**
4. Update Prisma schema with new fields (calculationMethod, folderUuid, tags, cascade deletes)
5. Generate Prisma migration
6. Implement PrismaGoalRepository
7. Implement domain-to-persistence mappers
8. Add integration tests for repository (in-memory SQLite)

**Phase 3: Key Result and Progress**
9. Create KeyResultApplicationService and use cases
10. Implement PrismaKeyResultRepository
11. Implement progress calculation logic in Goal aggregate
12. Test progress calculation with all methods

**Phase 4: API Registration**
13. Create Express route files (goal-crud.routes.ts, goal-key-result.routes.ts, etc.)
14. Implement goalInitialization.ts with DI wiring
15. Register goal router in apps/api main
16. Add integration tests for API endpoints

**Phase 5: Additional Features**
17. Implement ProgressRecordApplicationService
18. Implement RetrospectiveApplicationService
19. Implement ReminderApplicationService
20. Implement FocusModeApplicationService

**Phase 6: Desktop Integration (if required)**
21. Create IPC handlers in apps/desktop/src/main/modules/goal
22. Verify existing renderer-side integration

---

## Conclusion

Research validated that:
- ✅ All technical decisions are backed by existing patterns in governance and repository modules
- ✅ No new external dependencies required
- ✅ Clarification decisions (per-goal calculation, relative weights, cascade delete, folder/tags) are implementable
- ✅ Implementation sequence minimizes risk by building foundation first

**Status**: Research complete. Ready for Phase 1 (Data Model & Contracts).
