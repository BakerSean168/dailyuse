# @dailyuse Packages - Container Exports Analysis

**Date**: January 17, 2026  
**Purpose**: Document actual container classes, their export paths, and available methods

---

## Executive Summary

This document provides a comprehensive reference for all DI containers across the @dailyuse package ecosystem, including their correct import paths, instantiation methods, and available repository/service getters.

**Key Findings:**
- Infrastructure-server containers use various patterns: some lazy-load repositories, some require registration first
- Application-server imports containers from infrastructure-server, not defining their own
- Routes are defined in API modules using Express Router pattern (not container methods like `getRoutes()`)
- Containers vary significantly in implementation pattern (register/get vs lazy-loading)

---

## Part 1: Infrastructure-Server Containers

### 1.1 Task Container
**File**: [packages/infrastructure-server/src/task/di/task-container.ts](packages/infrastructure-server/src/task/di/task-container.ts)

**Export Path**:
```typescript
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
// Or
import { TaskContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class TaskContainer {
  static getInstance(): TaskContainer
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `getTaskInstanceRepository()` | `ITaskInstanceRepository` | Lazy-load | Returns Prisma implementation |
| `setTaskInstanceRepository(repo)` | `void` | Manual set | For testing |
| `getTaskTemplateRepository()` | `ITaskTemplateRepository` | Lazy-load | Returns Prisma implementation |
| `setTaskTemplateRepository(repo)` | `void` | Manual set | For testing |
| `getTaskDependencyRepository()` | `ITaskDependencyRepository` | Lazy-load | Returns Prisma implementation |
| `setTaskDependencyRepository(repo)` | `void` | Manual set | For testing |
| `getTaskStatisticsRepository()` | `ITaskStatisticsRepository` | Lazy-load | Returns Prisma implementation |
| `setTaskStatisticsRepository(repo)` | `void` | Manual set | For testing |
| `getTaskDependencyService()` | `TaskDependencyService` | Lazy-load | Domain service, not a repository |
| `setTaskDependencyService(service)` | `void` | Manual set | For testing |

**Implementation Pattern**: **Lazy-loading singleton** - Repositories are created on first access and cached.

**Interfaces from**: `@dailyuse/domain-server/task`

---

### 1.2 Schedule Container
**File**: [packages/infrastructure-server/src/schedule/di/schedule-container.ts](packages/infrastructure-server/src/schedule/di/schedule-container.ts)

**Export Path**:
```typescript
import { ScheduleContainer } from '@dailyuse/infrastructure-server/schedule';
// Or
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class ScheduleContainer {
  static getInstance(): ScheduleContainer
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `getScheduleTaskRepository()` | `IScheduleTaskRepository` | Lazy-load | Returns Prisma implementation |
| `setScheduleTaskRepository(repo)` | `void` | Manual set | For testing |
| `getScheduleStatisticsRepository()` | `IScheduleStatisticsRepository` | Lazy-load | Returns Prisma implementation |
| `setScheduleStatisticsRepository(repo)` | `void` | Manual set | For testing |
| `getScheduleRepository()` | `any` | Lazy-load | Returns Prisma implementation (untyped) |
| `setScheduleRepository(repo)` | `void` | Manual set | For testing |
| `getScheduleExecutionRepository()` | `IScheduleExecutionRepository` | Lazy-load | Returns Prisma implementation |
| `setScheduleExecutionRepository(repo)` | `void` | Manual set | For testing |

**Implementation Pattern**: **Lazy-loading singleton** - Repositories are created on first access and cached.

**Interfaces from**: `@dailyuse/domain-server/schedule`

---

### 1.3 Goal Container (Infrastructure Server)
**File**: [packages/infrastructure-server/src/goal/goal.container.ts](packages/infrastructure-server/src/goal/goal.container.ts)

**Export Path**:
```typescript
import { GoalContainer } from '@dailyuse/infrastructure-server/goal';
// Or
import { GoalContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class GoalContainer {
  static getInstance(): GoalContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerGoalRepository(repo)` | `this` | Builder | Chainable |
| `registerStatisticsRepository(repo)` | `this` | Builder | Chainable |
| `registerGoalFolderRepository(repo)` | `this` | Builder | Chainable |
| `getGoalRepository()` | `IGoalRepository` | Manual | Requires registration first |
| `getStatisticsRepository()` | `IGoalStatisticsRepository` | Manual | Requires registration first |
| `getGoalFolderRepository()` | `IGoalFolderRepository` | Manual | Requires registration first |
| `isConfigured()` | `boolean` | Query | Checks if all repos registered |
| `clear()` | `void` | Reset | Clears all registrations |

**Implementation Pattern**: **Manual registration + getter** - Repositories must be registered via `register*()` before use, or throws error.

**Interfaces from**: `@dailyuse/domain-server/goal`

---

### 1.4 Authentication Container (Infrastructure Server)
**File**: [packages/infrastructure-server/src/authentication/auth.container.ts](packages/infrastructure-server/src/authentication/auth.container.ts)

**Export Path**:
```typescript
import { AuthContainer } from '@dailyuse/infrastructure-server/authentication';
// Or
import { AuthContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class AuthContainer {
  static getInstance(): AuthContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerCredentialRepository(repo)` | `this` | Builder | Chainable |
| `registerSessionRepository(repo)` | `this` | Builder | Chainable |
| `getCredentialRepository()` | `IAuthCredentialRepository` | Manual | Requires registration first |
| `getSessionRepository()` | `IAuthSessionRepository` | Manual | Requires registration first |
| `isConfigured()` | `boolean` | Query | Checks if both repos registered |
| `clear()` | `void` | Reset | Clears all registrations |

**Implementation Pattern**: **Manual registration + getter** - Repositories must be registered before use.

**Interfaces from**: `@dailyuse/domain-server/authentication`

---

### 1.5 Account Container
**File**: [packages/infrastructure-server/src/account/account.container.ts](packages/infrastructure-server/src/account/account.container.ts)

**Export Path**:
```typescript
import { AccountContainer } from '@dailyuse/infrastructure-server/account';
// Or
import { AccountContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class AccountContainer {
  static getInstance(): AccountContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerAccountRepository(repo)` | `this` | Builder | Chainable |
| `getAccountRepository()` | `IAccountRepository` | Manual | Requires registration first |
| `isConfigured()` | `boolean` | Query | Checks if repo registered |
| `clear()` | `void` | Reset | Clears registrations |

**Implementation Pattern**: **Manual registration + getter** - Single repository.

**Interfaces from**: `@dailyuse/domain-server/account`

---

### 1.6 Repository Container
**File**: [packages/infrastructure-server/src/repository/repository.container.ts](packages/infrastructure-server/src/repository/repository.container.ts)

**Export Path**:
```typescript
import { RepositoryContainer } from '@dailyuse/infrastructure-server/repository';
// Or
import { RepositoryContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class RepositoryContainer {
  static getInstance(): RepositoryContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerRepositoryRepository(repo)` | `this` | Builder | Chainable |
| `registerResourceRepository(repo)` | `this` | Builder | Chainable |
| `registerFolderRepository(repo)` | `this` | Builder | Chainable |
| `registerRepositoryStatisticsRepository(repo)` | `this` | Builder | Chainable |
| `getRepositoryRepository()` | `IRepositoryRepository` | Manual | Requires registration |
| `getResourceRepository()` | `IResourceRepository` | Manual | Requires registration |
| `getFolderRepository()` | `IFolderRepository` | Manual | Requires registration |
| `getRepositoryStatisticsRepository()` | `IRepositoryStatisticsRepository` | Manual | Requires registration |
| `getRepositoryAggregateRepository()` | `IRepositoryRepository` | Alias | Same as `getRepositoryRepository()` |
| `isConfigured()` | `boolean` | Query | Checks main repos configured |
| `clear()` | `void` | Reset | Clears all registrations |

**Implementation Pattern**: **Manual registration + getter**

**Interfaces from**: `@dailyuse/domain-server/repository`

---

### 1.7 Dashboard Container
**File**: [packages/infrastructure-server/src/dashboard/dashboard.container.ts](packages/infrastructure-server/src/dashboard/dashboard.container.ts)

**Export Path**:
```typescript
import { DashboardContainer } from '@dailyuse/infrastructure-server/dashboard';
// Or
import { DashboardContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class DashboardContainer {
  static getInstance(): DashboardContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerDashboardConfigRepository(repo)` | `this` | Builder | Chainable |
| `registerStatisticsCacheService(service)` | `this` | Builder | Chainable |
| `getDashboardConfigRepository()` | `IDashboardConfigRepository` | Manual | Requires registration |
| `getStatisticsCacheService()` | `IStatisticsCacheService` | Manual | Requires registration |
| `hasCacheService()` | `boolean` | Query | Checks if cache service set |
| `isConfigured()` | `boolean` | Query | Checks if repo registered |
| `clear()` | `void` | Reset | Clears all registrations |

**Implementation Pattern**: **Manual registration + getter**

**Interfaces from**: `@dailyuse/domain-server/dashboard`

**Note**: Also manages a cache service in addition to repositories.

---

### 1.8 Notification Container
**File**: [packages/infrastructure-server/src/notification/notification.container.ts](packages/infrastructure-server/src/notification/notification.container.ts)

**Export Path**:
```typescript
import { NotificationContainer } from '@dailyuse/infrastructure-server/notification';
// Or
import { NotificationContainer } from '@dailyuse/infrastructure-server';
```

**Class Definition**:
```typescript
export class NotificationContainer {
  static getInstance(): NotificationContainer
  static resetInstance(): void
}
```

**Available Methods**:

| Method | Returns | Pattern | Notes |
|--------|---------|---------|-------|
| `registerNotificationRepository(repo)` | `this` | Builder | Chainable |
| `registerPreferenceRepository(repo)` | `this` | Builder | Chainable |
| `registerTemplateRepository(repo)` | `this` | Builder | Chainable |
| `getNotificationRepository()` | `INotificationRepository` | Manual | Requires registration |
| `getPreferenceRepository()` | `INotificationPreferenceRepository` | Manual | Requires registration |
| `getTemplateRepository()` | `INotificationTemplateRepository` | Manual | Requires registration |
| `isConfigured()` | `boolean` | Query | Checks all repos registered |
| `clear()` | `void` | Reset | Clears all registrations |

**Implementation Pattern**: **Manual registration + getter**

**Interfaces from**: `@dailyuse/domain-server/notification`

---

## Part 2: Application-Server Containers

**IMPORTANT**: Application-server modules **DO NOT define their own containers**. They import and re-export containers from infrastructure-server.

### 2.1 Task Application Server Exports
**File**: [packages/application-server/src/task/index.ts](packages/application-server/src/task/index.ts)

```typescript
export { TaskContainer } from '@dailyuse/infrastructure-server/task';
```

**Also Exports**:
- Use Cases: `CreateTaskTemplate`, `GetTaskTemplate`, `ListTaskTemplates`, etc.
- Application Services: `TaskInstanceApplicationService`, `TaskTemplateApplicationService`, `TaskStatisticsApplicationService`, `TaskDependencyApplicationService`
- Query Services: `TaskQueryService`, `TaskQueryValidator`
- Event Handlers: `TaskEventHandler`, `registerTaskEventListeners`, `TaskReminderScheduleHandler`

---

### 2.2 Goal Application Server Exports
**File**: [packages/application-server/src/goal/index.ts](packages/application-server/src/goal/index.ts)

```typescript
export { GoalContainer } from '@dailyuse/infrastructure-server';
```

**Also Exports**:
- Use Cases: `CreateGoal`, `GetGoal`, `ListGoals`, `UpdateGoal`, `DeleteGoal`, `ArchiveGoal`, `ActivateGoal`, `CompleteGoal`, `SearchGoals`
- Folder Use Cases: `ListGoalFolders`, `CreateGoalFolder`, `GetGoalFolder`, `UpdateGoalFolder`, `DeleteGoalFolder`
- Services: Various application services
- Mappers: `GoalMapper`
- Event Handlers: `GOAL_EVENT_HANDLERS_PLACEHOLDER`

---

### 2.3 Schedule Application Server Exports
**File**: [packages/application-server/src/schedule/index.ts](packages/application-server/src/schedule/index.ts)

```typescript
export { ScheduleContainer } from '@dailyuse/infrastructure-server';
```

**Also Exports**:
- All services from `./services`
- All scheduler implementations from `./scheduler`

---

### 2.4 Authentication Application Server Exports
**File**: [packages/application-server/src/authentication/index.ts](packages/application-server/src/authentication/index.ts)

```typescript
export { AuthContainer } from '@dailyuse/infrastructure-server';
```

**Also Exports**:
- All services from `./services`

---

## Part 3: API Entry Point Containers

The API modules in `apps/api/src/modules/` define **additional** containers specific to the API layer (not shared across packages).

### 3.1 Goal API Container
**File**: [apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts](apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts)

**IMPORTANT**: This is a **separate, API-specific container** from infrastructure-server's `GoalContainer`.

**Export Path**:
```typescript
import { GoalContainer } from '../infrastructure/di/GoalContainer';
// Or directly in API modules
```

**Class Definition**:
```typescript
export class GoalContainer {
  static getInstance(): GoalContainer
}
```

**Available Methods** (Repository Getters - Lazy-loaded):

| Method | Returns |
|--------|---------|
| `getGoalRepository()` | `IGoalRepository` |
| `setGoalRepository(repo)` | `void` |
| `getGoalFolderRepository()` | `IGoalFolderRepository` |
| `setGoalFolderRepository(repo)` | `void` |
| `getFocusSessionRepository()` | `IFocusSessionRepository` |
| `setFocusSessionRepository(repo)` | `void` |
| `getFocusModeRepository()` | `IFocusModeRepository` |
| `setFocusModeRepository(repo)` | `void` |
| `getGoalStatisticsRepository()` | `IGoalStatisticsRepository` |
| `setGoalStatisticsRepository(repo)` | `void` |
| `getWeightSnapshotRepository()` | `IWeightSnapshotRepository` |
| `setWeightSnapshotRepository(repo)` | `void` |

**Available Methods** (Application Service Getters - Lazy-loaded):

| Method | Returns |
|--------|---------|
| `getGoalApplicationService()` | `GoalApplicationService` |
| `getGoalFolderApplicationService()` | `GoalFolderApplicationService` |
| `getGoalStatisticsApplicationService()` | `GoalStatisticsApplicationService` |
| `getFocusSessionApplicationService()` | `FocusSessionApplicationService` |
| `getFocusModeApplicationService()` | `FocusModeApplicationService` |
| `getGoalKeyResultApplicationService()` | `GoalKeyResultApplicationService` |
| `getGoalRecordApplicationService()` | `GoalRecordApplicationService` |
| `getGoalReviewApplicationService()` | `GoalReviewApplicationService` |
| `getWeightSnapshotApplicationService()` | `WeightSnapshotApplicationService` |

**Implementation Pattern**: **Lazy-loading singleton** - Both repositories and application services are created on first access.

---

## Part 4: Routes / HTTP Interfaces

### IMPORTANT FINDING: No `getRoutes()` Methods in Containers

**Routes are NOT retrieved from containers.** Instead, routes are defined separately in API modules:

### 4.1 Goal Routes
**Files**:
- [apps/api/src/modules/goal/interface/http/goalRoutes.ts](apps/api/src/modules/goal/interface/http/goalRoutes.ts)
- [apps/api/src/modules/goal/interface/http/goalFolderRoutes.ts](apps/api/src/modules/goal/interface/http/goalFolderRoutes.ts)
- [apps/api/src/modules/goal/interface/http/focusModeRoutes.ts](apps/api/src/modules/goal/interface/http/focusModeRoutes.ts)
- [apps/api/src/modules/goal/interface/http/focusSessionRoutes.ts](apps/api/src/modules/goal/interface/http/focusSessionRoutes.ts)
- [apps/api/src/modules/goal/interface/http/goalStatisticsRoutes.ts](apps/api/src/modules/goal/interface/http/goalStatisticsRoutes.ts)
- [apps/api/src/modules/goal/interface/http/weightSnapshotRoutes.ts](apps/api/src/modules/goal/interface/http/weightSnapshotRoutes.ts)

**Export Pattern**: `export default router;` (Express Router instance)

---

### 4.2 Task Routes
**Files**:
- [apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts](apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts)
- [apps/api/src/modules/task/interface/http/routes/taskDependencyRoutes.ts](apps/api/src/modules/task/interface/http/routes/taskDependencyRoutes.ts)
- [apps/api/src/modules/task/interface/http/routes/taskStatisticsRoutes.ts](apps/api/src/modules/task/interface/http/routes/taskStatisticsRoutes.ts)
- [apps/api/src/modules/task/interface/http/routes/index.ts](apps/api/src/modules/task/interface/http/routes/index.ts) (aggregates all above)

**Main Export**: [apps/api/src/modules/task/interface/http/index.ts](apps/api/src/modules/task/interface/http/index.ts)

```typescript
export { default as taskInstanceRoutes } from './routes/taskInstanceRoutes';
export { default as taskTemplateRoutes } from './routes/taskTemplateRoutes';
export { default as taskDependencyRoutes } from './routes/taskDependencyRoutes';
```

**Route Import Pattern**:
```typescript
import taskRoutes from '@dailyuse/task/interface/http/routes';
app.use('/tasks', taskRoutes);
```

---

### 4.3 Schedule Routes
**Files**:
- [apps/api/src/modules/schedule/interface/http/routes/scheduleRoutes.ts](apps/api/src/modules/schedule/interface/http/routes/scheduleRoutes.ts) - Main schedule routes (calendar events)
- [apps/api/src/modules/schedule/interface/http/routes/scheduleEventRoutes.ts](apps/api/src/modules/schedule/interface/http/routes/scheduleEventRoutes.ts) - Exports `createScheduleEventRoutes()` function
- [apps/api/src/modules/schedule/interface/http/routes/scheduleStatisticsRoutes.ts](apps/api/src/modules/schedule/interface/http/routes/scheduleStatisticsRoutes.ts)

**Main Export**: [apps/api/src/modules/schedule/interface/index.ts](apps/api/src/modules/schedule/interface/index.ts)

```typescript
export { default as scheduleRouter } from './http/routes/scheduleRoutes';
```

**Note**: `scheduleEventRoutes` is a factory function, not a default export:
```typescript
export function createScheduleEventRoutes(): express.Router {
  // ...
}
```

---

### 4.4 Authentication Routes
**File**: [apps/api/src/modules/authentication/interface/](apps/api/src/modules/authentication/interface/)

Only has an `interface/` directory structure (not fully documented in this analysis).

---

## Part 5: Pattern Comparison

### Container Patterns Used:

| Pattern | Containers | Characteristics |
|---------|------------|-----------------|
| **Lazy-loading** | Task, Schedule, Task/Schedule/Goal in API | `get*()` creates on first call, caches result, no setter errors |
| **Manual Registration** | Goal, Auth, Account, Repository, Dashboard, Notification (Infrastructure) | Must call `register*()` before `get*()`, throws if not registered, builder pattern with `this` return |
| **Hybrid (API) + Manual (Infrastructure)** | Goal (API has lazy-loading, Infrastructure requires registration) | Different implementations for same domain |

---

## Part 6: Summary Table - All Containers

| Container | Location | Import Path | Lazy-Load | Manual Register | Methods |
|-----------|----------|-------------|-----------|-----------------|---------|
| **TaskContainer** | infrastructure-server/task | `@dailyuse/infrastructure-server/task` | ✅ | ❌ | 10 (4 repos + 1 service) |
| **ScheduleContainer** | infrastructure-server/schedule | `@dailyuse/infrastructure-server/schedule` | ✅ | ❌ | 8 (4 repos) |
| **GoalContainer** (infra) | infrastructure-server/goal | `@dailyuse/infrastructure-server/goal` | ❌ | ✅ | 8 (3 repos register + get) |
| **AuthContainer** (infra) | infrastructure-server/authentication | `@dailyuse/infrastructure-server/authentication` | ❌ | ✅ | 6 (2 repos register + get) |
| **AccountContainer** | infrastructure-server/account | `@dailyuse/infrastructure-server/account` | ❌ | ✅ | 4 (1 repo) |
| **RepositoryContainer** | infrastructure-server/repository | `@dailyuse/infrastructure-server/repository` | ❌ | ✅ | 12 (4 repos) |
| **DashboardContainer** | infrastructure-server/dashboard | `@dailyuse/infrastructure-server/dashboard` | ❌ | ✅ | 7 (1 repo + 1 service) |
| **NotificationContainer** | infrastructure-server/notification | `@dailyuse/infrastructure-server/notification` | ❌ | ✅ | 8 (3 repos) |
| **GoalContainer** (API) | apps/api/modules/goal | Local import | ✅ | ❌ | 18 (6 repos + 9 services) |

---

## Part 7: Critical Issues & Recommendations

### Issue 1: Inconsistent Container Patterns
**Problem**: Infrastructure containers use both lazy-loading and manual registration patterns inconsistently.

**Recommendation**: Standardize on one pattern across all containers. Suggest: Use lazy-loading with Prisma defaults for consistency.

---

### Issue 2: No Routes in Containers
**Problem**: Code looking for `container.getRoutes()` or similar will fail - routes are in separate files.

**Recommendation**: Routes are imported directly from route files in `interface/http/routes/` directories. Not from containers.

---

### Issue 3: API vs Infrastructure Containers Duplication
**Problem**: Goal module has two completely different containers:
- Infrastructure: Manual registration pattern
- API: Lazy-loading with additional application services

**Recommendation**: Consolidate or document the difference clearly. API container should likely inherit from or wrap infrastructure container.

---

### Issue 4: Authentication & Schedule Not in API Containers
**Problem**: No dedicated API containers found for Authentication and Schedule modules (unlike Goal).

**Recommendation**: Check if these modules use infrastructure containers directly in API layer.

---

## Usage Examples

### Example 1: Using Task Container (Lazy-load Pattern)
```typescript
import { TaskContainer } from '@dailyuse/infrastructure-server/task';

const container = TaskContainer.getInstance();
const taskRepo = container.getTaskInstanceRepository();
const service = container.getTaskDependencyService();
```

### Example 2: Using Goal Container (Manual Register Pattern - Infrastructure)
```typescript
import { GoalContainer } from '@dailyuse/infrastructure-server/goal';
import { GoalPrismaRepository } from '@dailyuse/infrastructure-server/goal';

const container = GoalContainer.getInstance();
container.registerGoalRepository(new GoalPrismaRepository(prisma));
const repo = container.getGoalRepository();
```

### Example 3: Using Goal Container (API Layer - Lazy-load Pattern)
```typescript
import { GoalContainer } from '../infrastructure/di/GoalContainer';

const container = GoalContainer.getInstance();
const goalRepo = container.getGoalRepository();
const service = container.getGoalApplicationService();
```

### Example 4: Using Routes
```typescript
import { Router } from 'express';
import goalRoutes from './modules/goal/interface/http/goalRoutes';
import { scheduleRouter } from '@dailyuse/application-server/schedule';

const app = express();
app.use('/goals', goalRoutes);
app.use('/schedules', scheduleRouter);
```

---

## Method Signature Reference

### Lazy-Load Pattern (Task, Schedule)
```typescript
getXyzRepository(): IXyzRepository {
  if (!this.xyzRepository) {
    this.xyzRepository = new PrismaXyzRepository(prisma);
  }
  return this.xyzRepository!;
}

setXyzRepository(repository: IXyzRepository): void {
  this.xyzRepository = repository;
}
```

### Manual Register Pattern (Goal, Auth, Account, etc.)
```typescript
registerXyzRepository(repository: IXyzRepository): this {
  this.xyzRepository = repository;
  return this;
}

getXyzRepository(): IXyzRepository {
  if (!this.xyzRepository) {
    throw new Error('XyzRepository not registered. Call registerXyzRepository first.');
  }
  return this.xyzRepository;
}
```

---

## Conclusion

This analysis provides a complete reference for all DI containers across the @dailyuse ecosystem. Key takeaways:

1. **Two distinct container patterns** are in use - understand which one applies to your module
2. **Routes are NOT in containers** - import from `interface/http/routes/` files
3. **Application-server re-exports infrastructure containers** - don't define new ones there
4. **API layer has specialized containers** for some modules (like Goal) with additional services
5. **Import paths are consistent** - always available from main package exports

Use this document as a reference when implementing new modules or fixing container-related errors.
