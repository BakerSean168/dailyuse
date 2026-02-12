# Quickstart Guide: Goal Module API Backend Implementation

**Date**: 2026-02-11
**Purpose**: Step-by-step implementation guide for goal module API backend
**Related**: [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md)

---

## Prerequisites

- [x] Spec clarified and approved ([spec.md](spec.md))
- [x] Research complete ([research.md](research.md))
- [x] Data model defined ([data-model.md](data-model.md))
- [x] Contracts defined ([contracts/](contracts/))
- [x] packages/goal/domain-server exists (domain aggregates, repositories)
- [x] packages/goal/domain-shared exists (shared primitives)
- [x] packages/contracts exists (type contracts)

---

## Implementation Sequence

The implementation follows a bottom-up approach: Domain → Infrastructure → Application → API → Desktop

### Phase 1: Update Prisma Schema (Infrastructure Foundation)

**Goal**: Ensure database schema matches data model

**Steps**:

1. **Update Prisma Schema**
   - File: `packages/goal/src/infrastructure-server/prisma/schema.prisma`
   - Add/update models: Goal, KeyResult, ProgressRecord, Retrospective, ReminderSetting, GoalFolder, FocusSelection
   - Add cascade delete relationships: `onDelete: Cascade`
   - Add new fields: `calculationMethod`, `folderUuid`, `tags[]`
   - Add indexes on frequently queried fields

2. **Generate Prisma Client**
   ```bash
   pnpm nx run goal:prisma-generate
   ```

3. **Create Migration**
   ```bash
   pnpm nx run goal:prisma-migrate --name add_calculation_method_and_folders
   ```

4. **Verify Schema**
   - Check generated types in `packages/goal/src/infrastructure-server/generated/prisma/client`

**Checkpoint**: ✅ Prisma schema matches data model; migration created

---

### Phase 2: Domain Layer Updates (if needed)

**Goal**: Ensure domain aggregates support new features (calculation methods, folder/tags)

**Files to Review/Update**:

1. **Goal Aggregate** (`packages/goal/src/domain-server/aggregates/goal.ts`)
   - Add `calculationMethod: ProgressCalculationMethod` field
   - Add `folderUuid?: string` field
   - Add `tags: string[]` field
   - Implement `calculateProgress()` method with all calculation methods
   - Add method: `addTag(tag: string)`, `removeTag(tag: string)`
   - Add method: `moveToFolder(folderUuid: string | null)`

2. **KeyResult Entity** (`packages/goal/src/domain-server/entities/key-result.ts`)
   - Ensure `weight` validation (must be > 0)
   - Ensure `progress` calculation logic: `(currentValue - initialValue) / (targetValue - initialValue) * 100`

3. **GoalDomainService** (`packages/goal/src/domain-server/services/goal-domain-service.ts`)
   - Ensure max 5 key results validation
   - Add weight normalization logic (if not already present)

**Checkpoint**: ✅ Domain layer supports all required features

---

### Phase 3: Infrastructure Layer (Repositories & Mappers)

**Goal**: Implement persistence for all entities

#### 3.1 Repository Implementations

1. **PrismaGoalRepository** (`packages/goal/src/infrastructure-server/repositories/prisma-goal-repository.ts`)
   - Implement `IGoalRepository` interface from domain layer
   - Methods: `save()`, `findById()`, `findByAccountUuid()`, `delete()`, `search()`
   - Include relations: keyResults, retrospectives, progressRecords (based on options)
   - Use mappers to convert Prisma ↔ Domain

2. **PrismaKeyResultRepository** (`packages/goal/src/infrastructure-server/repositories/prisma-key-result-repository.ts`)
   - Implement `IKeyResultRepository`
   - Methods: `save()`, `findById()`, `findByGoalUuid()`, `delete()`

3. **PrismaProgressRecordRepository** (create new)
   - File: `packages/goal/src/infrastructure-server/repositories/prisma-progress-record-repository.ts`
   - Methods: `create()`, `findByGoalUuid()`, `findByKeyResultUuid()`

4. **PrismaRetrospectiveRepository** (create new)
   - File: `packages/goal/src/infrastructure-server/repositories/prisma-retrospective-repository.ts`
   - Methods: `create()`, `findByGoalUuid()`, `findById()`, `delete()`

5. **PrismaReminderSettingRepository** (create new)
   - File: `packages/goal/src/infrastructure-server/repositories/prisma-reminder-setting-repository.ts`
   - Methods: `save()`, `findByGoalUuid()`, `delete()`

6. **PrismaGoalFolderRepository** (create new)
   - File: `packages/goal/src/infrastructure-server/repositories/prisma-goal-folder-repository.ts`
   - Methods: `save()`, `findById()`, `findByAccountUuid()`, `delete()`

7. **PrismaFocusSelectionRepository** (create new)
   - File: `packages/goal/src/infrastructure-server/repositories/prisma-focus-selection-repository.ts`
   - Methods: `save()`, `findByAccountUuid()`, `delete()`

#### 3.2 Domain Mappers

1. **GoalMapper** (`packages/goal/src/infrastructure-server/mappers/goal-mapper.ts`)
   - `toDomain(prismaGoal): Goal` - Convert Prisma record to domain aggregate
   - `toPersistence(goal): PrismaGoalCreateInput` - Convert domain to Prisma input

2. **KeyResultMapper** (similar pattern)
3. **ProgressRecordMapper** (similar pattern)
4. **RetrospectiveMapper** (similar pattern)
5. **ReminderSettingMapper** (similar pattern)

**Checkpoint**: ✅ All repositories implemented and tested with in-memory SQLite

---

### Phase 4: Application Layer (Use Cases & Services)

**Goal**: Implement business logic orchestration

#### 4.1 Goal Use Cases

Create individual use case classes in `packages/goal/src/application-server/services/`:

1. **CreateGoal** (`create-goal.ts`)
   - Constructor injects: `IGoalRepository`, `IGoalFolderRepository` (if folderUuid provided)
   - Validate input
   - Check folder exists (if provided)
   - Create domain aggregate via `GoalDomainService.createGoal()`
   - Add key results (if provided)
   - Save to repository
   - Publish domain events
   - Return DTO

2. **UpdateGoal** (`update-goal.ts`)
   - Fetch goal from repository
   - Update via domain methods
   - Save
   - Return DTO

3. **DeleteGoal** (`delete-goal.ts`)
   - Check if goal has children (decide on orphan or reject)
   - Delete via repository (cascade handled by Prisma)
   - Return success

4. **GetGoal** (`get-goal.ts`)
   - Fetch by UUID with include options
   - Return DTO

5. **ListGoals** (`list-goals.ts`)
   - Build query with filters (status, folder, tags)
   - Apply pagination
   - Return DTO array

6. **SearchGoals** (`search-goals.ts`)
   - Full-text search on title/description
   - Apply filters
   - Return results

7. **ChangeGoalStatus** (`change-goal-status.ts`)
   - Validate status transition
   - Update status
   - Publish event
   - Return DTO

#### 4.2 Key Result Use Cases

1. **AddKeyResult** (`add-key-result.ts`)
2. **UpdateKeyResultProgress** (`update-key-result-progress.ts`)
   - **Important**: Automatically creates ProgressRecord entry
   - Recalculates goal progress
3. **UpdateKeyResult** (`update-key-result.ts`)
4. **DeleteKeyResult** (`delete-key-result.ts`)
5. **GetKeyResultHistory** (`get-key-result-history.ts`)

#### 4.3 Application Services (Compose Use Cases)

1. **GoalApplicationService** (`goal-application-service.ts`)
   - Constructor injects all goal use cases
   - Provides unified API for goal operations
   - Example methods: `createGoal()`, `updateGoal()`, etc.

2. **GoalKeyResultApplicationService** (`goal-key-result-application-service.ts`)
   - Composes key result use cases
   - Methods: `addKeyResult()`, `updateProgress()`, etc.

3. **ProgressRecordApplicationService** (`goal-record-application-service.ts`)
   - Methods: `getProgressHistory()`

4. **RetrospectiveApplicationService** (`goal-review-application-service.ts`)
   - Methods: `createRetrospective()`, `getRetrospectives()`

5. **ReminderApplicationService** (create new, e.g., `goal-reminder-application-service.ts`)
   - Methods: `configureReminder()`, `getReminders()`

6. **FocusModeApplicationService** (`focus-mode-application-service.ts`)
   - Methods: `setFocusGoal()`, `getFocusGoal()`, `clearFocus()`

**Checkpoint**: ✅ All use cases and application services implemented with unit tests

---

### Phase 5: API Layer (Express Routes)

**Goal**: Register HTTP endpoints and wire dependencies

#### 5.1 Create Route Files

Create in `apps/api/src/modules/goal/interface/`:

1. **goal-crud.routes.ts**
   - `POST /api/goals` → createGoal
   - `GET /api/goals/:uuid` → getGoal
   - `PUT /api/goals/:uuid` → updateGoal
   - `DELETE /api/goals/:uuid` → deleteGoal
   - `GET /api/goals` → listGoals
   - `POST /api/goals/:uuid/status` → changeGoalStatus

2. **goal-key-result.routes.ts**
   - `POST /api/goals/:goalUuid/key-results` → addKeyResult
   - `PATCH /api/goals/:goalUuid/key-results/:uuid/progress` → updateProgress
   - `PATCH /api/goals/:goalUuid/key-results/:uuid` → updateKeyResult
   - `DELETE /api/goals/:goalUuid/key-results/:uuid` → deleteKeyResult
   - `GET /api/goals/:goalUuid/key-results/:uuid/history` → getHistory

3. **goal-progress.routes.ts**
   - `GET /api/goals/:uuid/progress` → getProgressHistory
   - `POST /api/goals/:goalUuid/key-results/batch-update` → batchUpdateProgress

4. **goal-reminder.routes.ts**
   - `POST /api/goals/:uuid/reminders` → configureReminder
   - `GET /api/goals/:uuid/reminders` → getReminders
   - `DELETE /api/goals/:uuid/reminders/:reminderUuid` → deleteReminder

5. **goal-retrospective.routes.ts**
   - `POST /api/goals/:uuid/retrospectives` → createRetrospective
   - `GET /api/goals/:uuid/retrospectives` → getRetrospectives

6. **goal-folder.routes.ts**
   - `POST /api/goal-folders` → createFolder
   - `GET /api/goal-folders` → listFolders
   - `PUT /api/goal-folders/:uuid` → updateFolder
   - `DELETE /api/goal-folders/:uuid` → deleteFolder

7. **goal-focus.routes.ts**
   - `POST /api/goal-focus` → setFocusGoal
   - `GET /api/goal-focus` → getFocusGoal
   - `DELETE /api/goal-focus` → clearFocus

#### 5.2 Route Aggregator

File: `apps/api/src/modules/goal/interface/index.ts`

```typescript
export * from './goal-crud.routes';
export * from './goal-key-result.routes';
export * from './goal-progress.routes';
export * from './goal-reminder.routes';
export * from './goal-retrospective.routes';
export * from './goal-folder.routes';
export * from './goal-focus.routes';
```

#### 5.3 Module Initialization

File: `apps/api/src/modules/goal/initialization/goalInitialization.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { GoalModule } from 'packages/goal/src/infrastructure-server/goal-module'; // DI container

export function initializeGoalModule(prisma: PrismaClient): Router {
  // Instantiate DI container
  const goalModule = new GoalModule('prisma', prisma);
  
  const router = Router();
  
  // Register route groups
  router.use(createGoalCrudRoutes({ 
    goalApplicationService: goalModule.goalApplicationService 
  }));
  
  router.use(createGoalKeyResultRoutes({ 
    keyResultApplicationService: goalModule.keyResultApplicationService 
  }));
  
  // ... register other route groups
  
  return router;
}
```

#### 5.4 Register in Main API

File: `apps/api/src/main.ts` (or wherever modules are registered)

```typescript
import { initializeGoalModule } from './modules/goal/initialization/goalInitialization';

// ... existing code ...

app.use('/api', initializeGoalModule(prismaClient));
```

**Checkpoint**: ✅ All API routes registered and accessible; integration tests pass

---

### Phase 6: Desktop Integration (Optional)

**Goal**: Register IPC handlers for desktop app

#### 6.1 Desktop Application Service Facade

File: `apps/desktop/src/main/modules/goal/application/GoalDesktopApplicationService.ts`

```typescript
export class GoalDesktopApplicationService {
  constructor(private readonly goalModule: GoalModule) {}
  
  async createGoal(accountUuid: string, input: CreateGoalRequest): Promise<GoalResponse> {
    return this.goalModule.goalApplicationService.createGoal(accountUuid, input);
  }
  
  // ... delegate other methods
}
```

#### 6.2 IPC Handler Registration

File: `apps/desktop/src/main/modules/goal/ipc/goal-ipc-handlers.ts`

```typescript
import { ipcMain } from 'electron';
import { goalDesktopService } from '../application';

export function registerGoalIpcHandlers() {
  ipcMain.handle('goal:create', async (event, accountUuid, input) => {
    return goalDesktopService.createGoal(accountUuid, input);
  });
  
  ipcMain.handle('goal:get', async (event, uuid) => {
    return goalDesktopService.getGoal(uuid);
  });
  
  // ... register other handlers
}
```

**Checkpoint**: ✅ Desktop IPC handlers registered; renderer can invoke goal operations

---

## Testing Strategy

### Unit Tests

**Domain Layer** (>80% coverage):
- Goal aggregate methods (calculateProgress, addKeyResult, etc.)
- KeyResult entity progress calculation
- Domain service validation

**Application Layer** (>70% coverage):
- Each use case with mocked repositories
- Application services composing use cases

**Infrastructure Layer**:
- Repository implementations with in-memory SQLite
- Mapper conversions (domain ↔ persistence)

### Integration Tests

**API Routes**:
- Test each endpoint with real database (test container or in-memory)
- Test authentication and authorization
- Test validation errors

**End-to-End**:
- Complete user journeys (create goal → add key results → update progress → view history)

### Running Tests

```bash
# Run all goal module tests
pnpm nx test goal

# Run specific test file
pnpm nx test goal --testFile=goal-application-service.spec.ts

# Run with coverage
pnpm nx test goal --coverage
```

---

## Development Workflow

### 1. Start Development Server

```bash
# Start API server with watch mode
pnpm nx serve api

# Start Desktop app (if testing desktop integration)
pnpm nx serve desktop
```

### 2. Apply Prisma Migrations

```bash
# Development
pnpm nx run goal:prisma-migrate-dev

# Production
pnpm nx run goal:prisma-migrate-deploy
```

### 3. Generate Prisma Client After Schema Changes

```bash
pnpm nx run goal:prisma-generate
```

### 4. Lint and Format

```bash
# Lint
pnpm nx lint goal

# Format
pnpm nx format:write
```

---

## Common Patterns (Reference Governance Module)

### Use Case Pattern

```typescript
export class CreateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}
  
  async execute(req: CreateGoalReq, cx: ExecutionContext): Promise<Result<CreateGoalRes>> {
    // 1. Validate input
    // 2. Create domain aggregate
    // 3. Persist to repository
    // 4. Publish domain events
    // 5. Return DTO
  }
}
```

### Repository Pattern

```typescript
export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  async save(goal: Goal): Promise<Result<void>> {
    const persistenceDTO = GoalMapper.toPersistence(goal);
    await this.prisma.goal.upsert({
      where: { uuid: goal.uuid },
      update: persistenceDTO,
      create: persistenceDTO,
    });
    return ok(undefined);
  }
}
```

### Route Handler Pattern

```typescript
router.post('/goals', authMiddleware, asyncHandler(async (req, res) => {
  const accountUuid = req.user.accountUuid;  // From auth middleware
  const result = await goalApplicationService.createGoal(accountUuid, req.body);
  
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  
  res.status(201).json(result.data);
}));
```

---

## Troubleshooting

### Issue: Prisma Client Not Generated

**Solution**: Run `pnpm nx run goal:prisma-generate`

### Issue: Migration Fails

**Solution**: Check Prisma schema for syntax errors; ensure existing data is compatible

### Issue: Circular Dependency Error

**Solution**: Review import paths; ensure domain → application → infrastructure → api dependency flow

### Issue: Tests Failing After Domain Changes

**Solution**: Update mocks and test data to match new domain model

---

## Completion Checklist

- [x] Phase 1: Prisma schema updated and migrated
- [x] Phase 2: Domain layer supports new features
- [x] Phase 3: All repositories implemented
- [x] Phase 4: All use cases and application services implemented
- [x] Phase 5: API routes registered and tested
- [ ] Phase 6: Desktop IPC handlers registered (optional)
- [x] Unit tests >70% coverage
- [x] Integration tests for API endpoints
- [x] Documentation updated (README, API docs)
- [x] Code reviewed and merged

---

## Next Steps

After completing this implementation:

1. **Phase 2 (if needed)**: Implement front-end integration (web/desktop UI)
2. **Phase 3**: Add advanced features (goal templates, AI suggestions, analytics)
3. **Phase 4**: Performance optimization (caching, indexing, query optimization)
4. **Phase 5**: User testing and feedback iteration

---

## Resources

- **Governance Module Reference**: `packages/governance/src/`
- **Repository Module Reference**: `packages/repository/src/`
- **Constitution**: `.specify/memory/constitution.md`
- **Nx Documentation**: https://nx.dev/
- **Prisma Documentation**: https://www.prisma.io/docs/

---

**Status**: Quickstart guide complete. Ready for implementation.
