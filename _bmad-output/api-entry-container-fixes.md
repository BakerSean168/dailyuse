# API Entry Point Container Fixes - Implementation Guide

**Date**: January 17, 2026  
**Based On**: Analysis of `1-8-api-entry-container-refactor.md` requirements  
**Purpose**: Provide correct implementations for API entry point containers

---

## Critical Findings

### Issue 1: Infrastructure-Server Containers Cannot Be Used Directly as-is

The infrastructure-server containers use TWO DIFFERENT PATTERNS:
1. **Lazy-load pattern**: TaskContainer, ScheduleContainer
2. **Manual register pattern**: GoalContainer, AuthContainer, AccountContainer, RepositoryContainer, DashboardContainer, NotificationContainer

This incompatibility means API modules MUST either:
- Use the lazy-load containers directly (Task, Schedule) ✅
- Create wrapper/adapter containers for manual-register ones (Goal, Auth, etc.) ✅
- Initialize and wrap manual containers before use ✅

---

## Solution: Use API-Specific Containers (Recommended)

The codebase already follows this pattern! The Goal module in `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts` is the CORRECT approach:

1. **Defines API-specific containers** with a unified lazy-load pattern
2. **Wraps infrastructure repositories** with Prisma implementations
3. **Provides application services** in addition to repositories
4. **Handles initialization** internally

---

## Implementation Template: API Container Wrapper

### For Manual-Register Infrastructure Containers (Goal, Auth, etc.)

```typescript
/**
 * {Module} Container (API Layer)
 * 
 * Wraps @dailyuse/infrastructure-server container
 * Provides lazy-loaded access to repositories and services
 * Suitable for API initialization and request handling
 */

import type { I{Module}Repository } from '@dailyuse/domain-server/{module}';
import { 
  Prisma{Module}Repository,
  {Module}Container as InfraContainer
} from '@dailyuse/infrastructure-server/{module}';
import { {Module}ApplicationService } from '@dailyuse/application-server/{module}';
import { prisma } from '@/shared/infrastructure/config/prisma';

export class {Module}Container {
  private static instance: {Module}Container;
  private repository: I{Module}Repository | undefined;
  private service: {Module}ApplicationService | undefined;

  private constructor() {}

  static getInstance(): {Module}Container {
    if (!{Module}Container.instance) {
      {Module}Container.instance = new {Module}Container();
    }
    return {Module}Container.instance;
  }

  // ===== Repository Getters (Lazy-load) =====

  get{Module}Repository(): I{Module}Repository {
    if (!this.repository) {
      this.repository = new Prisma{Module}Repository(prisma);
    }
    return this.repository;
  }

  set{Module}Repository(repository: I{Module}Repository): void {
    this.repository = repository;
  }

  // ===== Service Getters (Lazy-load) =====

  get{Module}ApplicationService(): {Module}ApplicationService {
    if (!this.service) {
      this.service = new {Module}ApplicationService(
        this.get{Module}Repository()
      );
    }
    return this.service;
  }

  // ===== Utilities =====

  isConfigured(): boolean {
    return this.repository !== null;
  }

  reset(): void {
    this.repository = undefined;
    this.service = undefined;
  }
}
```

---

## Implementation Template: For Lazy-Load Infrastructure Containers

### For TaskContainer, ScheduleContainer (Already work as-is)

```typescript
// ✅ These can be used directly from infrastructure-server
// No wrapper needed!

import { TaskContainer } from '@dailyuse/infrastructure-server/task';
import { ScheduleContainer } from '@dailyuse/infrastructure-server/schedule';

// Use them directly:
const taskContainer = TaskContainer.getInstance();
const repo = taskContainer.getTaskInstanceRepository();

const scheduleContainer = ScheduleContainer.getInstance();
const repo = scheduleContainer.getScheduleTaskRepository();
```

---

## Module-Specific Implementations

### Authentication Container (API)

**Current Status**: NOT FOUND in API layer - Need to create

```typescript
// apps/api/src/modules/authentication/infrastructure/di/AuthContainer.ts

import type { 
  IAuthCredentialRepository,
  IAuthSessionRepository
} from '@dailyuse/domain-server/authentication';
import {
  AuthCredentialPrismaRepository,
  AuthSessionPrismaRepository,
} from '@dailyuse/infrastructure-server/authentication';
import { AuthenticationService } from '@dailyuse/application-server/authentication';
import { prisma } from '@/shared/infrastructure/config/prisma';

export class AuthContainer {
  private static instance: AuthContainer;
  private credentialRepository: IAuthCredentialRepository | undefined;
  private sessionRepository: IAuthSessionRepository | undefined;
  private authService: AuthenticationService | undefined;

  private constructor() {}

  static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  // ===== Repository Getters =====

  getCredentialRepository(): IAuthCredentialRepository {
    if (!this.credentialRepository) {
      this.credentialRepository = new AuthCredentialPrismaRepository(prisma);
    }
    return this.credentialRepository;
  }

  setCredentialRepository(repo: IAuthCredentialRepository): void {
    this.credentialRepository = repo;
  }

  getSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new AuthSessionPrismaRepository(prisma);
    }
    return this.sessionRepository;
  }

  setSessionRepository(repo: IAuthSessionRepository): void {
    this.sessionRepository = repo;
  }

  // ===== Service Getters =====

  getAuthenticationService(): AuthenticationService {
    if (!this.authService) {
      this.authService = new AuthenticationService(
        this.getCredentialRepository(),
        this.getSessionRepository()
      );
    }
    return this.authService;
  }

  // ===== Utilities =====

  isConfigured(): boolean {
    return this.credentialRepository !== null;
  }

  reset(): void {
    this.credentialRepository = undefined;
    this.sessionRepository = undefined;
    this.authService = undefined;
  }
}
```

---

### Schedule Container (API)

**Current Status**: Uses infrastructure container directly (ScheduleContainer is lazy-load ✅)

**Recommendation**: Can continue using infrastructure-server version

```typescript
// ✅ This works fine as-is
import { ScheduleContainer } from '@dailyuse/infrastructure-server/schedule';

// Or create API wrapper if services are needed:
// apps/api/src/modules/schedule/infrastructure/di/ScheduleContainer.ts
```

---

### Repository Container (API)

**Current Status**: NOT FOUND in API layer - May need to create

```typescript
// apps/api/src/modules/repository/infrastructure/di/RepositoryContainer.ts

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';
import {
  RepositoryPrismaRepository,
  ResourcePrismaRepository,
  FolderPrismaRepository,
  RepositoryStatisticsPrismaRepository,
} from '@dailyuse/infrastructure-server/repository';
import { prisma } from '@/shared/infrastructure/config/prisma';

export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository: IRepositoryRepository | undefined;
  private resourceRepository: IResourceRepository | undefined;
  private folderRepository: IFolderRepository | undefined;
  private statisticsRepository: IRepositoryStatisticsRepository | undefined;

  private constructor() {}

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  // ===== Repository Getters =====

  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      this.repositoryRepository = new RepositoryPrismaRepository(prisma);
    }
    return this.repositoryRepository;
  }

  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      this.resourceRepository = new ResourcePrismaRepository(prisma);
    }
    return this.resourceRepository;
  }

  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      this.folderRepository = new FolderPrismaRepository(prisma);
    }
    return this.folderRepository;
  }

  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.statisticsRepository) {
      this.statisticsRepository = new RepositoryStatisticsPrismaRepository(prisma);
    }
    return this.statisticsRepository;
  }

  // ===== Utilities =====

  isConfigured(): boolean {
    return this.repositoryRepository !== null;
  }

  reset(): void {
    this.repositoryRepository = undefined;
    this.resourceRepository = undefined;
    this.folderRepository = undefined;
    this.statisticsRepository = undefined;
  }
}
```

---

## Routes: Correct Implementation

### NOT in Containers

Routes should NEVER be in containers. They belong in separate files:

```typescript
// ✅ CORRECT: Route in separate file
// apps/api/src/modules/{module}/interface/http/{module}Routes.ts

import { Router } from 'express';
import { {Module}Controller } from './{Module}Controller';

const router = Router();

// Define routes
router.get('/', {Module}Controller.list);
router.post('/', {Module}Controller.create);
router.get('/:id', {Module}Controller.getOne);

export default router;
```

```typescript
// ❌ WRONG: Trying to get routes from container
const container = {Module}Container.getInstance();
const routes = container.getRoutes(); // Does NOT exist!

// ✅ CORRECT: Import routes separately
import {module}Routes from './interface/http/{module}Routes';
app.use('/{module}s', {module}Routes);
```

---

## Initialization Order (API Startup)

### Correct Sequence

```typescript
// 1. Initialize containers (singleton pattern)
const goalContainer = GoalContainer.getInstance();
const taskContainer = TaskContainer.getInstance();
const scheduleContainer = ScheduleContainer.getInstance();
const authContainer = AuthContainer.getInstance();

// 2. Register repositories if manual pattern (Goal, Auth, etc.)
// Note: API containers should auto-initialize via lazy-load
// If using infrastructure containers directly, must register:
const infraGoalContainer = GoalContainer.getInstance();
infraGoalContainer
  .registerGoalRepository(new GoalPrismaRepository(prisma))
  .registerStatisticsRepository(new GoalStatisticsRepository(prisma))
  .registerGoalFolderRepository(new GoalFolderRepository(prisma));

// 3. Mount routes SEPARATELY from containers
app.use('/goals', goalRoutes);
app.use('/tasks', taskRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/auth', authRoutes);

// 4. Initialize services/handlers (event listeners, schedulers, etc.)
registerGoalEventHandlers(goalContainer);
registerTaskEventHandlers(taskContainer);
initializeScheduler(scheduleContainer);
```

---

## Testing Setup for API Containers

### Example: Goal Module Tests

```typescript
import { GoalContainer } from '../infrastructure/di/GoalContainer';
import { createMockGoalRepository } from '../__mocks__/goal.repository.mock';

describe('Goal API Container', () => {
  let container: GoalContainer;
  let mockRepository: IGoalRepository;

  beforeEach(() => {
    // Get fresh instance
    container = GoalContainer.getInstance();
    mockRepository = createMockGoalRepository();
    
    // Set up for testing
    container.setGoalRepository(mockRepository);
  });

  afterEach(() => {
    // Clean up
    container.reset();
  });

  it('should provide mock repository', () => {
    const repo = container.getGoalRepository();
    expect(repo).toBe(mockRepository);
  });

  it('should lazily load application service', () => {
    const service = container.getGoalApplicationService();
    expect(service).toBeDefined();
    expect(service.repository).toBe(mockRepository);
  });
});
```

---

## Migration Checklist

For each module, follow this checklist:

- [ ] **Check if lazy-load infrastructure container exists**
  - [ ] Task ✅ (use as-is)
  - [ ] Schedule ✅ (use as-is)
  - [ ] Goal ❌ (manual register - needs wrapper)
  - [ ] Auth ❌ (manual register - needs wrapper)
  - [ ] Account ❌ (manual register - needs wrapper)
  - [ ] Repository ❌ (manual register - needs wrapper)
  - [ ] Dashboard ❌ (manual register - needs wrapper)
  - [ ] Notification ❌ (manual register - needs wrapper)

- [ ] **If manual register pattern, create API wrapper container**
  - [ ] Define with lazy-load pattern
  - [ ] Wrap Prisma repositories
  - [ ] Include application services
  - [ ] Add getInstance() singleton
  - [ ] Add set() for testing
  - [ ] Export from module index

- [ ] **Define routes separately** (not in container)
  - [ ] Create {module}Routes.ts in interface/http/
  - [ ] Export default router
  - [ ] Mount in app.ts

- [ ] **Update initialization** (app.ts or bootstrap)
  - [ ] Initialize containers
  - [ ] Mount routes
  - [ ] Set up event handlers/services

- [ ] **Update tests**
  - [ ] Use getInstance()
  - [ ] Use set() for mocks
  - [ ] Add reset() in afterEach
  - [ ] Don't test getRoutes() - test routes separately

---

## Files to Create/Update

### Create New API Containers

1. `apps/api/src/modules/authentication/infrastructure/di/AuthContainer.ts`
2. `apps/api/src/modules/repository/infrastructure/di/RepositoryContainer.ts`
3. `apps/api/src/modules/dashboard/infrastructure/di/DashboardContainer.ts`
4. `apps/api/src/modules/notification/infrastructure/di/NotificationContainer.ts`
5. `apps/api/src/modules/account/infrastructure/di/AccountContainer.ts`

### Update Existing

1. `apps/api/src/modules/goal/infrastructure/di/GoalContainer.ts` - Verify matches pattern
2. `apps/api/src/modules/schedule/infrastructure/di/ScheduleContainer.ts` - Create if missing
3. `apps/api/src/app.ts` - Update container initialization and route mounting

### Import Paths to Update

Search for:
- `container.getRoutes()` → Remove, use route files
- `container.getFolderRoutes()` → Remove, use route files
- Manual registrations in wrong places → Move to bootstrap/initialization

---

## Summary of Correct Patterns

| Scenario | Container | Methods | Pattern |
|----------|-----------|---------|---------|
| API layer needs goal repos | `GoalContainer` (API) | `get*()` | Lazy-load |
| API layer needs task repos | `TaskContainer` (infra) | `get*()` | Lazy-load |
| API layer needs auth repos | `AuthContainer` (API wrapper) | `get*()` | Lazy-load |
| Tests need goal repos | `GoalContainer` (API) | `set*()` | Mock injection |
| Infrastructure setup | `GoalContainer` (infra) | `register*()` | Manual setup |
| Routes mounting | Route files | Export router | Express Router |

---

## Verification Script

Run this to verify container implementations:

```bash
# Check that all containers are defined
grep -r "class.*Container" apps/api/src/modules/*/infrastructure/di/

# Verify getInstance() exists
grep -r "static getInstance()" apps/api/src/modules/*/infrastructure/di/

# Check for getRoutes() (should NOT exist)
grep -r "getRoutes()" apps/api/src/modules/*/infrastructure/di/ || echo "✓ No getRoutes() found"

# Verify route files exist
find apps/api/src/modules/*/interface/http/ -name "*Routes.ts"

# Check app.ts mounts routes correctly
grep -A 2 "app.use(" apps/api/src/app.ts | head -20
```

---

**Generated**: January 17, 2026  
**Status**: Based on actual codebase structure  
**Ready for**: Implementation and testing
