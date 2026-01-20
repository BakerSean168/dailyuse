# Container Quick Reference & Fix Guide

**Date**: January 17, 2026  
**Purpose**: Quick lookup for correct container usage and common fixes

---

## Quick Lookup Table

### By Module

| Module | Container Class | Import Path | Pattern | Repositories |
|--------|-----------------|-------------|---------|--------------|
| **Task** | `TaskContainer` | `@dailyuse/infrastructure-server/task` | Lazy-load | Instance, Template, Dependency, Statistics |
| **Schedule** | `ScheduleContainer` | `@dailyuse/infrastructure-server/schedule` | Lazy-load | Task, Statistics, Execution, Calendar |
| **Goal** (Infra) | `GoalContainer` | `@dailyuse/infrastructure-server/goal` | Manual | Goal, Statistics, Folder |
| **Goal** (API) | `GoalContainer` | Local path | Lazy-load | Goal, Folder, FocusSession, FocusMode, Statistics, WeightSnapshot |
| **Auth** | `AuthContainer` | `@dailyuse/infrastructure-server/authentication` | Manual | Credential, Session |
| **Account** | `AccountContainer` | `@dailyuse/infrastructure-server/account` | Manual | Account |
| **Repository** | `RepositoryContainer` | `@dailyuse/infrastructure-server/repository` | Manual | Repository, Resource, Folder, Statistics |
| **Dashboard** | `DashboardContainer` | `@dailyuse/infrastructure-server/dashboard` | Manual | DashboardConfig (+ CacheService) |
| **Notification** | `NotificationContainer` | `@dailyuse/infrastructure-server/notification` | Manual | Notification, Preference, Template |

---

## Common Fixes

### ❌ Error: "container.getRoutes() is not a function"

**Cause**: Containers don't have `getRoutes()` methods.

**Fix**: Import routes directly from the routes files.

```typescript
// ❌ WRONG
const container = TaskContainer.getInstance();
const routes = container.getRoutes();

// ✅ CORRECT
import taskRoutes from './modules/task/interface/http/routes';
app.use('/tasks', taskRoutes);
```

---

### ❌ Error: "XyzRepository not registered"

**Cause**: Using manual-register container without calling `register*()` first.

**Pattern**: GoalContainer, AuthContainer, AccountContainer, RepositoryContainer, DashboardContainer, NotificationContainer

**Fix**: Register before getting.

```typescript
// ❌ WRONG
const container = GoalContainer.getInstance();
const repo = container.getGoalRepository(); // Throws error!

// ✅ CORRECT (Infrastructure)
import { GoalContainer } from '@dailyuse/infrastructure-server/goal';
import { GoalPrismaRepository } from '@dailyuse/infrastructure-server/goal';
import { prisma } from '@/shared/infrastructure/config/prisma';

const container = GoalContainer.getInstance();
container.registerGoalRepository(new GoalPrismaRepository(prisma));
const repo = container.getGoalRepository();

// ✅ OR: Use API Container (already set up)
import { GoalContainer } from '../infrastructure/di/GoalContainer'; // API container
const container = GoalContainer.getInstance();
const repo = container.getGoalRepository(); // Works - lazy-loads
```

---

### ❌ Error: "Method does not exist on container"

**Cause**: Wrong method name for the container pattern.

| Pattern | Methods |
|---------|---------|
| Lazy-load (Task, Schedule) | `get*()`<br>`set*()` (for testing) |
| Manual Register (Goal infra, Auth, etc.) | `register*()`<br>`get*()`<br>`isConfigured()`<br>`clear()` |

**Fix**: Check which pattern your container uses and use correct method names.

```typescript
// ❌ WRONG - trying to register on lazy-load container
const taskContainer = TaskContainer.getInstance();
taskContainer.registerTaskInstanceRepository(mockRepo);

// ✅ CORRECT - lazy-load containers use set() for testing
taskContainer.setTaskInstanceRepository(mockRepo);

// ❌ WRONG - trying to get without registering manual container
const goalContainer = GoalContainer.getInstance();
const repo = goalContainer.getGoalRepository();

// ✅ CORRECT - must register first
goalContainer.registerGoalRepository(new GoalPrismaRepository(prisma));
const repo = goalContainer.getGoalRepository();
```

---

### ❌ Error: "Cannot access 'goalRepository' before initialization"

**Cause**: Accessing undefined repository when lazy-load hasn't occurred yet.

**Fix**: Use proper getter method that initializes.

```typescript
// ❌ WRONG (internal access)
const repo = container.goalRepository; // Might be undefined

// ✅ CORRECT
const repo = container.getGoalRepository(); // Guaranteed initialized
```

---

## Pattern Decision Tree

### Q: Which container pattern should I use?

```
Is it in infrastructure-server?
├─ YES: Check if it needs manual registration
│       ├─ GoalContainer, AuthContainer, AccountContainer, 
│       │  RepositoryContainer, DashboardContainer, NotificationContainer
│       └─ Use: register*() then get*()
│
├─ Task or Schedule in infrastructure-server?
│  └─ Use: get*() directly (lazy-loads automatically)
│
└─ Is it in apps/api/src/modules/?
   └─ Check API-specific container (like GoalContainer in API layer)
      └─ Use: get*() directly (lazy-loads + includes services)
```

---

## Importing Containers Correctly

### Pattern 1: From Infrastructure Package
```typescript
// ✅ ALL of these work (imports are re-exported)
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
import { TaskContainer } from '@dailyuse/infrastructure-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
```

### Pattern 2: From Application Package (Re-export)
```typescript
// ✅ These work (application re-exports from infrastructure)
import { TaskContainer } from '@dailyuse/application-server/task';
import { GoalContainer } from '@dailyuse/application-server/goal';
```

### Pattern 3: From API Modules (Local)
```typescript
// ✅ For API-specific containers
import { GoalContainer } from '@/modules/goal/infrastructure/di/GoalContainer';
```

---

## Repository Method Names Reference

### Task Container Methods
```typescript
getTaskInstanceRepository()        → ITaskInstanceRepository
getTaskTemplateRepository()        → ITaskTemplateRepository
getTaskDependencyRepository()      → ITaskDependencyRepository
getTaskStatisticsRepository()      → ITaskStatisticsRepository
getTaskDependencyService()         → TaskDependencyService
```

### Schedule Container Methods
```typescript
getScheduleTaskRepository()        → IScheduleTaskRepository
getScheduleStatisticsRepository()  → IScheduleStatisticsRepository
getScheduleRepository()            → (any)
getScheduleExecutionRepository()   → IScheduleExecutionRepository
```

### Goal Container Methods (Infrastructure)
```typescript
registerGoalRepository()           → this (builder)
registerStatisticsRepository()     → this (builder)
registerGoalFolderRepository()     → this (builder)

getGoalRepository()                → IGoalRepository
getStatisticsRepository()          → IGoalStatisticsRepository
getGoalFolderRepository()          → IGoalFolderRepository
```

### Goal Container Methods (API)
```typescript
getGoalRepository()                → IGoalRepository
getGoalFolderRepository()          → IGoalFolderRepository
getFocusSessionRepository()        → IFocusSessionRepository
getFocusModeRepository()           → IFocusModeRepository
getGoalStatisticsRepository()      → IGoalStatisticsRepository
getWeightSnapshotRepository()      → IWeightSnapshotRepository

getGoalApplicationService()        → GoalApplicationService
getGoalFolderApplicationService()  → GoalFolderApplicationService
getGoalStatisticsApplicationService() → GoalStatisticsApplicationService
getFocusSessionApplicationService() → FocusSessionApplicationService
getFocusModeApplicationService()   → FocusModeApplicationService
getGoalKeyResultApplicationService() → GoalKeyResultApplicationService
getGoalRecordApplicationService()  → GoalRecordApplicationService
getGoalReviewApplicationService()  → GoalReviewApplicationService
getWeightSnapshotApplicationService() → WeightSnapshotApplicationService
```

### Auth Container Methods
```typescript
registerCredentialRepository()     → this (builder)
registerSessionRepository()        → this (builder)

getCredentialRepository()          → IAuthCredentialRepository
getSessionRepository()             → IAuthSessionRepository
```

### Account Container Methods
```typescript
registerAccountRepository()        → this (builder)
getAccountRepository()             → IAccountRepository
```

### Repository Container Methods
```typescript
registerRepositoryRepository()     → this (builder)
registerResourceRepository()       → this (builder)
registerFolderRepository()         → this (builder)
registerRepositoryStatisticsRepository() → this (builder)

getRepositoryRepository()          → IRepositoryRepository
getResourceRepository()            → IResourceRepository
getFolderRepository()              → IFolderRepository
getRepositoryStatisticsRepository() → IRepositoryStatisticsRepository
getRepositoryAggregateRepository() → IRepositoryRepository (alias)
```

### Dashboard Container Methods
```typescript
registerDashboardConfigRepository() → this (builder)
registerStatisticsCacheService()   → this (builder)

getDashboardConfigRepository()     → IDashboardConfigRepository
getStatisticsCacheService()        → IStatisticsCacheService
```

### Notification Container Methods
```typescript
registerNotificationRepository()   → this (builder)
registerPreferenceRepository()     → this (builder)
registerTemplateRepository()       → this (builder)

getNotificationRepository()        → INotificationRepository
getPreferenceRepository()          → INotificationPreferenceRepository
getTemplateRepository()            → INotificationTemplateRepository
```

---

## Routes Import Reference

### Goal Routes
```typescript
import goalRoutes from '@/modules/goal/interface/http/goalRoutes';
import goalFolderRoutes from '@/modules/goal/interface/http/goalFolderRoutes';
import focusModeRoutes from '@/modules/goal/interface/http/focusModeRoutes';
import focusSessionRoutes from '@/modules/goal/interface/http/focusSessionRoutes';
import goalStatisticsRoutes from '@/modules/goal/interface/http/goalStatisticsRoutes';
import weightSnapshotRoutes from '@/modules/goal/interface/http/weightSnapshotRoutes';

// Or use application-server export
import { GoalContainer } from '@dailyuse/application-server/goal';
```

### Task Routes
```typescript
import taskRoutes from '@/modules/task/interface/http/routes';
// Also available separately:
import taskTemplateRoutes from '@/modules/task/interface/http/routes/taskTemplateRoutes';
import taskDependencyRoutes from '@/modules/task/interface/http/routes/taskDependencyRoutes';
import taskStatisticsRoutes from '@/modules/task/interface/http/routes/taskStatisticsRoutes';
```

### Schedule Routes
```typescript
import scheduleRouter from '@/modules/schedule/interface/http/routes/scheduleRoutes';
// Or with function factory:
import { createScheduleEventRoutes } from '@/modules/schedule/interface/http/routes/scheduleEventRoutes';
const scheduleEventRouter = createScheduleEventRoutes();
```

---

## Testing with Containers

### Lazy-Load Pattern (Task, Schedule)
```typescript
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

describe('Task Module', () => {
  let container: TaskContainer;
  let mockRepository: ITaskInstanceRepository;

  beforeEach(() => {
    container = TaskContainer.getInstance();
    mockRepository = createMockRepository();
    container.setTaskInstanceRepository(mockRepository);
  });

  it('should use mock repository', () => {
    const repo = container.getTaskInstanceRepository();
    expect(repo).toBe(mockRepository);
  });
});
```

### Manual Register Pattern (Goal, Auth, etc.)
```typescript
import { GoalContainer } from '@dailyuse/infrastructure-server/goal';

describe('Goal Module', () => {
  let container: GoalContainer;
  let mockRepository: IGoalRepository;

  beforeEach(() => {
    GoalContainer.resetInstance(); // Important!
    container = GoalContainer.getInstance();
    mockRepository = createMockRepository();
    container.registerGoalRepository(mockRepository);
  });

  it('should use registered repository', () => {
    const repo = container.getGoalRepository();
    expect(repo).toBe(mockRepository);
  });

  afterEach(() => {
    container.clear();
  });
});
```

---

## File Location Reference

### Infrastructure Server Containers
- Task: `packages/infrastructure-server/src/task/di/task-container.ts`
- Schedule: `packages/infrastructure-server/src/schedule/di/schedule-container.ts`
- Goal: `packages/infrastructure-server/src/goal/goal.container.ts`
- Auth: `packages/infrastructure-server/src/authentication/auth.container.ts`
- Account: `packages/infrastructure-server/src/account/account.container.ts`
- Repository: `packages/infrastructure-server/src/repository/repository.container.ts`
- Dashboard: `packages/infrastructure-server/src/dashboard/dashboard.container.ts`
- Notification: `packages/infrastructure-server/src/notification/notification.container.ts`

### API Containers
- Goal: `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts`

### Route Files
- Goal: `apps/api/src/modules/goal/interface/http/*.ts`
- Task: `apps/api/src/modules/task/interface/http/routes/*.ts`
- Schedule: `apps/api/src/modules/schedule/interface/http/routes/*.ts`

---

## Checklist for Implementing New Container

- [ ] Decide: Lazy-load or manual register pattern?
- [ ] Create container file: `src/{module}/di/{module}-container.ts` or `src/{module}/{module}.container.ts`
- [ ] Implement `getInstance()` static method
- [ ] Add repository getters/setters (lazy-load) or register/get (manual)
- [ ] Add test reset if manual pattern: `static resetInstance()`
- [ ] Export from module `index.ts`
- [ ] Document all methods in this guide
- [ ] Add to infrastructure-server main `index.ts` export
- [ ] Create routes file separately (NOT in container)
- [ ] Test with both direct initialization and testing patterns

---

## Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "getRoutes is not a function" | Routes in container | Import from route files instead |
| "Repository not registered" | Manual pattern without register | Call `register*()` before `get*()` |
| "Method does not exist" | Wrong pattern methods | Check pattern and use correct methods |
| "Cannot read property of undefined" | Lazy-load not triggered | Use getter method, not direct property access |
| "Container is null" | Singleton not initialized | Call `getInstance()` first |
| "Test fails with state from other test" | Manual container not reset | Call `resetInstance()` in `beforeEach` |
| "Repository works in API but fails in tests" | Different container instances | Ensure you're resetting the correct container |

---

## When to Use Each Pattern

### Use Lazy-Load (Task, Schedule) When:
- ✅ You want automatic initialization
- ✅ You prefer less boilerplate setup
- ✅ You don't need complex initialization logic
- ✅ You want simple set() for testing

### Use Manual Register (Goal, Auth, etc.) When:
- ✅ You need explicit control over initialization
- ✅ You want builder pattern for chaining
- ✅ You have complex setup requirements
- ✅ You want to validate before returning
- ✅ You need `resetInstance()` for testing

---

**Generated**: January 17, 2026  
**Last Updated**: Based on actual codebase analysis  
**Status**: VERIFIED AGAINST ACTUAL IMPLEMENTATIONS
