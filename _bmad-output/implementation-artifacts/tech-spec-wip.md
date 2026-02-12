---
title: 'Task Module API Layer Implementation'
slug: 'task-module-api-implementation'
created: '2026-02-11'
finalized: '2026-02-11'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'Express 5.x'
  - 'Zod'
  - 'Result<T> Pattern (API responses only)'
  - 'ApiBootstrapper + IApiModule'
  - 'TypeScript'
  - 'Prisma ORM'
files_to_modify:
  - 'packages/task/src/application-server/services/task-template-application-service.ts (REFACTOR)'
  - 'packages/task/src/application-server/services/task-instance-application-service.ts (REFACTOR)'
  - 'packages/task/src/application-server/services/task-statistics-application-service.ts (REFACTOR)'
  - 'packages/task/src/application-server/services/task-dependency-application-service.ts (REFACTOR)'
  - 'packages/task/src/application-server/services/*.ts (REFACTOR - 10 use case files)'
  - 'packages/task/src/api/routes/task-template.routes.ts (NEW)'
  - 'packages/task/src/api/routes/task-instance.routes.ts (NEW)'
  - 'packages/task/src/api/routes/task-stats.routes.ts (NEW)'
  - 'packages/task/src/api/routes/index.ts (NEW)'
  - 'packages/task/src/api/controllers/task-template.controller.ts (NEW)'
  - 'packages/task/src/api/controllers/task-instance.controller.ts (NEW)'
  - 'packages/task/src/api/controllers/task-stats.controller.ts (NEW)'
  - 'packages/task/src/api/module.ts (NEW)'
  - 'packages/task/src/api/initialization.ts (NEW)'
  - 'packages/task/src/api/index.ts (NEW)'
code_patterns:
  - 'Result<T> pattern (ok/error)'
  - 'IApiModule pattern'
  - 'Controller classes with DI'
  - 'respondWithResult helper (Result<T> → HTTP)'
  - 'Zod safeParse validation'
  - 'TaskModule DI container'
test_patterns: []
---

# Tech-Spec: Task Module API Layer Implementation

**Created:** 2026-02-11

## Overview

### Problem Statement

The task module lacks an API layer to expose its domain logic via HTTP endpoints. While contracts and domain layers have been refactored to align with the new domain model, the application layer services throw errors instead of returning `Result<T>` objects (violating the gold standard set by the governance module). Additionally, a complete API layer (routes, controllers, module registration) must be created to enable external access.

### Solution

**Phase 1 - Refactor Application Services:** Convert all Task application services from throwing errors to returning `Result<T>` objects, matching the governance module's gold standard pattern.

**Phase 2 - Implement API Layer:** Build a modern, split-route API architecture following ADR-021/022 patterns. Create separate controller classes for each domain area (templates, instances, stats), register them via IApiModule pattern with ApiBootstrapper, and include initialization tasks for background job scheduling.

### Scope
**Refactor application services** to return `Result<T>` instead of throwing errors (TaskTemplateApplicationService, TaskInstanceApplicationService, TaskStatisticsApplicationService, TaskDependencyApplicationService)
- **Refactor use case classes** to return `Result<T>` (CreateTaskTemplate, ActivateTaskTemplate, CompleteTaskInstance, etc.)
- Route files split by feature (task-template.routes.ts, task-instance.routes.ts, task-stats.routes.ts)
- Controller classes with dependency injection (TaskTemplateController, TaskInstanceController, TaskStatsController)
- Controllers unwrap `Result<T>` and convert to HTTP responses
- IApiModule implementation (module.ts with composition root)
- Route aggregator (index.ts)
- Initialization tasks registration (recurring generator, reminder scheduler) - stubbed for now
- Initialization tasks registration (recurring generator, reminder scheduler) - stubbed for now
- Result<T> pattern for error handling
- Zod validation integration from @dailyuse/contracts/task
- Auth middleware integration via context (no direct imports from apps/api)
- Route prefixes: `/task-templates`, `/task-instances`, `/task-stats`

**Out of Scope:**
- Modifying contracts layer (already refactored and complete)
- Domain layer changes (already refactored)
- Full implementation of background job workers (stub only - actual worker logic deferred)
- Client-side code changes
- Swagger documentation (can be added in future iteration)
- Database migrations (assuming schema already supports domain model)

## Context for Development

### Architecture Decisions

**Modern Pattern Adoption (ADR-021/022):**
- Split routes by feature domain instead of monolithic route files
- Use controller classes with explicit dependency injection
- Follow IApiModule interface for clean integration with ApiBootstrapper
- Middleware comes from context parameter (no direct coupling to apps/api internals)

**Reference Implementation:**
- **Structure reference:** Governance module (packages/governance/src/api/)
- **Pattern upgrade:** Task module will be FIRST to implement ADR-021/022 split-route pattern
- **Governance uses:** Single routes.ts file (legacy pattern - do NOT copy)
- **Task will use:** Multiple route files + index aggregator (new pattern)

**Route Organization Strategy:**
```
packages/task/src/api/
├── routes/
│   ├── task-template.routes.ts    # Template CRUD
│   ├── task-instance.routes.ts    # Instance operations
│   ├── task-stats.routes.ts       # Dashboard stats
│   └── index.ts                   # Route aggregator
├── controllers/
│   ├── task-template.controller.ts
│   ├── task-instance.controller.ts
│   └── task-stats.controller.ts
├── module.ts                      # IApiModule implementation
├── initialization.ts              # Background job registration
└── index.ts                       # Public API exports
```

****Result<T> pattern mandatory** - ALL application services and use cases must return `Result<T>` (never throw)
- Zod schemas already defined in @dailyuse/contracts/task/api
- Auth middleware must come from context.middleware (structural compatibility)
- No circular dependencies on apps/api
- Must match governance module's Result<T> pattern exactlyyuse/contracts/task/api
- Auth middleware must come from context.middleware (structural compatibility)
- No circular dependencies on apps/api

### Codebase Patterns
Application Service Pattern (REFACTORED - Returns Result<T>):**
```typescript
// BEFORE (throws errors):
async createTaskTemplate(params: {...}): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error('Template not found'); // ❌ DON'T DO THIS
  }
  // ...
}

// AFTER (returns Result<T>):
async createTaskTemplate(params: {...}): Promise<Result<TaskTemplateServerDTO>> {
  const templateResult = await this.templateRepository.findByUuid(uuid);
  if (!templateResult.ok || !templateResult.data) {
    return error('NOT_FOUND', 'Template not found'); // ✅ Return Result
  3. Route Registration Pattern (ADR-021 with Result<T> Unwrapping):**
```typescript
export function registerTaskTemplateRoutes(
  controller: TaskTemplateController,
  middleware: PlatformMiddleware
): Router {
  const router = Router();
  
  router.post('/', middleware.auth, async (req: AuthenticatedRequest, res) => {
    // 1. Zod validation
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = buildValidationDetails(parsed.error.issues);
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }
    
    // 2. Controller returns Result<T>
    const result = await controller.createTemplate(parsed.data, req.user.accountUuid);
    
    // 3. Unwrap Result<T> and respond
    respondWithResult(res, result, 201);
  });
  
  return router;
}

// Helper to convert Result<T> to HTTP response
function respondWithResult<T>(res: Response, result: Result<T>, okStatus = 200) {
  if (isOk(result)) {
    res.status(okStatus).json(responseBuilder.success(result.data));
    return;
  }
  
  4onst status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
  res.status(status).json(responseBuilder.fromResult(result))
  const router = Router();
  
  router.post('/', middleware.auth, async (req: AuthenticatedRequest, res) => {
    // 1. Zod validation
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = buildValidationDetails(parsed.error.issues);
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }
    
    try {
      // 2. Controller call (throws on error)
      const result = await controller.createTemplate(parsed.data, req.user.accountUuid);
      // 3. Success response
      res.status(201).json(responseBuilder.success(result));
    } catch (error) {
      // 4. Error handling
      const message = error instanceof Error ? error.message : 'Internal error';
      res.status(500).json(responseBuilder.error(message));
    }
  });
  
  return router;
}
```

**3. IApiModule Pattern (Using TaskModule DI Container):**
```typescript
// Local interface definition (no import from apps/api)
export interface TaskApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export const TaskApiModule = {
  name: 'Task',
  
  register(context: TaskApiModuleContext) {
    const { router, middleware, db } = context;
    
    // 1. Initialize TaskModule DI Container (wires all dependencies)
    const taskModule = new TaskModule('prisma', db);
    
    // 2. Create Controllers
    const templateController = new TaskTemplateController(
      taskModule.taskTemplateService
    );
    const instanceController = new TaskInstanceController(
      taskModule.taskInstanceService
    );
    const statsController = new TaskStatsController(
      taskModule.taskStatisticsService
    );
    
    // 3. Register Routes (split by feature)
    router.use('/task-templates', registerTaskTemplateRoutes(templateController, middleware));
    router.use('/task-instances', registerTaskInstanceRoutes(instanceController, middleware));
    router.use('/task-stats', registerTaskStatsRoutes(statsController, middleware));
    
  5. Response Helpers:**
```typescript
//  }
};
```

**4. Response Helpers:**
```typescript
/Validation error details builder
function buildValidationDetails(issues: ZodIssue[]): ResultErrorDetail[] {
  return issues.map(issue => ({
    field: issue.path.join('.'),
    code: 'INVALID_FIELD',
    message: issue.message,
  }));
}6. Application Services (TO BE REFACTORED - Currently throw errors):**
- `TaskTemplateApplicationService` - 20+ methods to refactor
- `TaskInstanceApplicationService` - 10+ methods to refactor
- `TaskStatisticsApplicationService` - 2 methods to refactor
- `TaskDependencyApplicationService` - 8+ methods to refactor

**All methods must be converted from:**
- ❌ `throw new Error(...)` → ✅ `return error(code, message)`
- ❌ `return data` → ✅ `return ok(data)`
- ❌ Assumes repo returns data → ✅ Check `result.ok` and handle errors

**5. Available Application Services (All throw errors):**
- 7TaskTemplateApplicationService` - createTaskTemplate, updateTaskTemplate, getTaskTemplate, list operations, activate, pause, delete
- `TaskInstanceApplicationService` - completeTaskInstance, skipTaskInstance, startTaskInstance, getTaskInstancesByDateRange, getTaskInstance
- `TaskStatisticsApplicationService` - getStatistics, recalculateStatistics
- `TaskDependencyApplicationService` - createDependency, updateDependency, deleteDependency, getDependenciesByTask

**6. TaskModule DI Container (Infrastructure):**
```typescript
const taskModule = new TaskModule('prisma', prismaClient);
// Provides:
// - taskModule.taskTemplateService
// - taskModule.taskInstanceService
// - taskModule.taskStatisticsService
// - taskModule.taskDependencyService
```
plication-server/use-cases/delete-rule.use-case.ts` | **GOLD STANDARD** - Result<T> pattern reference |
| `packages/governance/src/api/module.ts` | IApiModule structure - composition root pattern |
| `packages/governance/src/api/routes.ts` | Route handlers, validation, Result<T> unwrapping |
| `packages/governance/src/api/initialization.ts` | Background task registration pattern |
| `packages/task/src/application-server/services/*.ts` | **TO REFACTOR** - All services must return Result<T> |
| `packages/task/src/infrastructure-server/task.module.ts` | DI container - wires repos + services |
| `packages/contracts/src/modules/task/api/task-crud.dto.ts` | Template CRUD schemas |
| `packages/contracts/src/modules/task/api/task-instance.dto.ts` | Instance query schemas |
| `packages/contracts/src/modules/task/api/task-reschedule.dto.ts` | Instance operation schemas |
| `@dailyuse/contracts/result` | Result<T>, ok(), error(), isOk() utilitience operations (complete, skip, start) |
| `packages/task/src/application-server/services/task-statistics-application-service.ts` | Dashboard statistics |
| `packages/task/src/infrastructure-server/task.module.ts` | DI container - wires repos + services |
| `packages/contracts/src/modules/task/api/task-crud.dto.ts` | Template CRUD schemas |
| `packages/contracts/src/modules/task/api/task-instance.dto.ts` | Instance query schemas |
| `packages/contracts/src/modules/task/api/task-reschedule.dto.ts` | Instance operation schemas |
| `apps/api/src/shared/contracts/api-module.ts` | IApiModule interface |
| `apps/api/src/bootstrap.ts` | ApiBootstrapper integration example |

### Technical Decisions
Refactor Application Services to Result<T> Pattern**
- **Chosen:** Convert all application services from throwing errors to returning Result<T>
- **Rationale:** Aligns with governance module gold standard, provides type-safe error handling, eliminates try-catch noise
- **Impact:** Requires refactoring 40+ methods across 4 application service classes

**Decision 4: 
**Decision 1: Split Routes by Feature Domain**
- **Rationale:** Follows ADR-021/022, improves maintainability, sets gold standard
- **Impact:** Task module becomes reference implementation for future modules

**Decision 5: Controller Classes vs Function Handlers**
- **Chosen:** Controller classes with explicit DI
- **Rationale:** Better testability, clear dependencies, scalable architecture
- **Alternative Rejected:** Flat handler object (too coupled, hard to test)

**Decision 3: Route Prefix Strategy**
- **Chosen:** Explicit resource names (`/task-templates`, `/task-instances`, `/task-stats`)
- **Rationale:** Avoids ambiguity between "definitions" and "executions"
- **Alternative Rejected:** Nested routes like `/tasks/templates` (more verbose, no benefit)

**Decision 4: Initialization Tasks**
- **Chosen:** Register stubs for background jobs in initialization.ts
- **Rationale:** Architectural completeness, prepares for future scheduler integration
- **Deferred:** Actual worker implementation (scheduler infrastructure not in scope)

## Implementation Plan

### Tasks

**Phase 1: Refactor Application Layer (Result<T> Pattern)**

- [ ] **Task 1.1:** Refactor TaskTemplateApplicationService - Part 1 (CRUD methods)
  - File: `packages/task/src/application-server/services/task-template-application-service.ts`
  - Action: Convert `createTaskTemplate`, `getTaskTemplate`, `getTaskTemplatesByAccount`, `updateTaskTemplate`, `deleteTaskTemplate` to return `Result<T>`
  - Pattern: Replace `throw new Error(...)` with `return error(code, message)`, wrap returns with `ok(data)`
  - Notes: Check all repository calls - assume they return `Result<T>` and handle failures

- [ ] **Task 1.2:** Refactor TaskTemplateApplicationService - Part 2 (Query methods)
  - File: `packages/task/src/application-server/services/task-template-application-service.ts`
  - Action: Convert `getTaskTemplatesByStatus`, `getActiveTaskTemplates`, `getTaskTemplatesByFolder`, `getTaskTemplatesByGoal`, `getTaskTemplatesByTags` to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.3:** Refactor TaskTemplateApplicationService - Part 3 (State transition methods)
  - File: `packages/task/src/application-server/services/task-template-application-service.ts`
  - Action: Convert `activateTaskTemplate`, `pauseTaskTemplate`, `archiveTaskTemplate` to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.4:** Refactor TaskInstanceApplicationService - Part 1 (Query methods)
  - File: `packages/task/src/application-server/services/task-instance-application-service.ts`
  - Action: Convert `getTaskInstance`, `getTaskInstancesByAccount`, `getTaskInstancesByTemplate`, `getTaskInstancesByDateRange`, `getTaskInstancesByStatus` to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.5:** Refactor TaskInstanceApplicationService - Part 2 (Command methods)
  - File: `packages/task/src/application-server/services/task-instance-application-service.ts`
  - Action: Convert `startTaskInstance`, `completeTaskInstance`, `skipTaskInstance`, `deleteTaskInstance`, `checkExpiredInstances` to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.6:** Refactor TaskStatisticsApplicationService
  - File: `packages/task/src/application-server/services/task-statistics-application-service.ts`
  - Action: Convert `getStatistics`, `recalculateStatistics` to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.7:** Refactor TaskDependencyApplicationService
  - File: `packages/task/src/application-server/services/task-dependency-application-service.ts`
  - Action: Convert all 8 methods (`createDependency`, `updateDependency`, `deleteDependency`, etc.) to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.8:** Refactor Use Case Classes - CreateTaskTemplate
  - File: `packages/task/src/application-server/services/create-task-template.ts`
  - Action: Convert `execute` method to return `Result<{template, instanceCount}>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.9:** Refactor Use Case Classes - ActivateTaskTemplate, PauseTaskTemplate, DeleteTaskTemplate
  - Files: `packages/task/src/application-server/services/{activate,pause,delete}-task-template.ts`
  - Action: Convert `execute` methods to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.10:** Refactor Use Case Classes - CompleteTaskInstance, SkipTaskInstance
  - Files: `packages/task/src/application-server/services/{complete,skip}-task-instance.ts`
  - Action: Convert `execute` methods to return `Result<T>`
  - Pattern: Same as Task 1.1

- [ ] **Task 1.11:** Refactor Use Case Classes - GetTaskDashboard, GetTaskInstancesByDateRange, Others
  - Files: `packages/task/src/application-server/services/get-*.ts`, `packages/task/src/application-server/services/list-*.ts`
  - Action: Convert all `execute` methods to return `Result<T>`
  - Pattern: Same as Task 1.1

**Phase 2: Implement API Layer (Split Routes + Controllers)**

- [ ] **Task 2.1:** Create TaskTemplateController
  - File: `packages/task/src/api/controllers/task-template.controller.ts` (NEW)
  - Action: Create controller class with methods: `createTemplate`, `getTemplate`, `listTemplates`, `updateTemplate`, `deleteTemplate`, `activateTemplate`, `pauseTemplate`
  - Dependencies: `TaskTemplateApplicationService`
  - Pattern: Each method calls service and returns `Result<T>` directly (no try-catch)

- [ ] **Task 2.2:** Create TaskInstanceController
  - File: `packages/task/src/api/controllers/task-instance.controller.ts` (NEW)
  - Action: Create controller class with methods: `getInstance`, `listInstances`, `getInstancesByDateRange`, `completeInstance`, `skipInstance`, `startInstance`
  - Dependencies: `TaskInstanceApplicationService`
  - Pattern: Same as Task 2.1

- [ ] **Task 2.3:** Create TaskStatsController
  - File: `packages/task/src/api/controllers/task-stats.controller.ts` (NEW)
  - Action: Create controller class with methods: `getDashboard`, `getStatistics`, `recalculateStatistics`
  - Dependencies: `TaskStatisticsApplicationService`, `GetTaskDashboard` use case
  - Pattern: Same as Task 2.1

- [ ] **Task 2.4:** Create task-template.routes.ts
  - File: `packages/task/src/api/routes/task-template.routes.ts` (NEW)
  - Action: Implement route registration function with endpoints:
    - `POST /` - Create template (auth required)
    - `GET /` - List templates (auth required)
    - `GET /:id` - Get template by ID (auth required)
    - `PUT /:id` - Update template (auth required)
    - `DELETE /:id` - Delete template (auth required)
    - `POST /:id/activate` - Activate template (auth required)
    - `POST /:id/pause` - Pause template (auth required)
  - Pattern: Zod validation → controller call → respondWithResult helper
  - Note: All routes require auth middleware from context

- [ ] **Task 2.5:** Create task-instance.routes.ts
  - File: `packages/task/src/api/routes/task-instance.routes.ts` (NEW)
  - Action: Implement route registration function with endpoints:
    - `GET /` - List instances with filters (auth required)
    - `GET /by-date-range` - Get instances by date range (auth required)
    - `GET /:id` - Get instance by ID (auth required)
    - `POST /:id/complete` - Complete instance (auth required)
    - `POST /:id/skip` - Skip instance (auth required)
    - `POST /:id/start` - Start instance (auth required)
  - Pattern: Same as Task 2.4

- [ ] **Task 2.6:** Create task-stats.routes.ts
  - File: `packages/task/src/api/routes/task-stats.routes.ts` (NEW)
  - Action: Implement route registration function with endpoints:
    - `GET /dashboard` - Get dashboard stats (auth required)
    - `GET /statistics` - Get statistics (auth required)
    - `POST /statistics/recalculate` - Force recalculate (auth required)
  - Pattern: Same as Task 2.4

- [ ] **Task 2.7:** Create routes aggregator index.ts
  - File: `packages/task/src/api/routes/index.ts` (NEW)
  - Action: Create aggregator function that imports and combines all route registration functions
  - Export: `registerTaskRoutes(controllers, middleware): Router`

- [ ] **Task 2.8:** Create initialization.ts
  - File: `packages/task/src/api/initialization.ts` (NEW)
  - Action: Create `registerTaskInitializationTasks()` function with stubs:
    - `taskInstanceGeneratorJob` - stub for recurring instance generation
    - `taskReminderSchedulerJob` - stub for reminder scheduling
  - Pattern: Follow governance module's initialization pattern
  - Note: Mark as stubs with TODO comments for future scheduler integration

- [ ] **Task 2.9:** Create TaskApiModule (IApiModule implementation)
  - File: `packages/task/src/api/module.ts` (NEW)
  - Action: Implement IApiModule interface:
    - Define local `TaskApiModuleContext` interface (no import from apps/api)
    - Create composition root: instantiate `TaskModule` DI container
    - Create controllers with service dependencies
    - Register all routes with appropriate prefixes
    - Call `registerTaskInitializationTasks()`
  - Pattern: Follow governance module structure, use TaskModule for wiring

- [ ] **Task 2.10:** Create public API exports
  - File: `packages/task/src/api/index.ts` (NEW)
  - Action: Export `TaskApiModule` and any public types
  - Note: Controllers and routes are internal, don't export them

- [ ] **Task 2.11:** Register TaskApiModule in ApiBootstrapper
  - File: `apps/api/src/main.ts` or equivalent
  - Action: Import `TaskApiModule` from `@dailyuse/task/src/api` and register with bootstrapper
  - Pattern: `bootstrapper.register(TaskApiModule)`
  - Note: Module will be mounted at `/api/task-templates`, `/api/task-instances`, `/api/task-stats`

### Acceptance Criteria

**Phase 1: Application Service Refactoring**

- [ ] **AC1:** Given a TaskTemplateApplicationService method is called, when the template is not found, then it returns `error('NOT_FOUND', 'Template not found')` instead of throwing
- [ ] **AC2:** Given a TaskTemplateApplicationService method is called, when the operation succeeds, then it returns `ok(data)` with the appropriate DTO
- [ ] **AC3:** Given a TaskInstanceApplicationService method is called, when a business rule fails (e.g., cannot complete), then it returns an error Result instead of throwing
- [ ] **AC4:** Given any application service method is called, when a repository operation fails, then the failure is propagated as a Result error
- [ ] **AC5:** Given all refactored services are tested, when existing tests are run, then they all pass with updated assertions for Result<T>

**Phase 2: API Layer**

- [ ] **AC6:** Given a POST /task-templates request with valid data, when the request is authenticated, then a new template is created and returns 201 with the template DTO
- [ ] **AC7:** Given a POST /task-templates request with invalid data, when Zod validation fails, then it returns 400 with detailed validation errors
- [ ] **AC8:** Given a GET /task-templates request, when the user is authenticated, then all user's templates are returned with 200
- [ ] **AC9:** Given a POST /task-instances/:id/complete request, when the instance exists and can be completed, then it returns 200 with updated instance
- [ ] **AC10:** Given a POST /task-instances/:id/complete request, when the instance cannot be completed, then it returns 400 with error message
- [ ] **AC11:** Given a GET /task-stats/dashboard request, when the user is authenticated, then dashboard statistics are returned with 200
- [ ] **AC12:** Given any API request without authentication, when middleware checks auth, then it returns 401 Unauthorized
- [ ] **AC13:** Given TaskApiModule is registered in ApiBootstrapper, when the app starts, then all routes are mounted at correct prefixes
- [ ] **AC14:** Given initialization tasks are registered, when the app starts, then task jobs are initialized successfully (even if stubbed)
- [ ] **AC15:** Given a service returns an error Result, when the route handler processes it, then the correct HTTP status code is returned (400/404/500 based on error code)

**Integration & Testing**

- [ ] **AC16:** Given all controllers are unit tested, when services are mocked to return Result<T>, then controllers properly unwrap and return Results
- [ ] **AC17:** Given route handlers are integration tested, when middleware is mocked, then Zod validation and Result unwrapping work correctly
- [ ] **AC18:** Given TaskModule DI container is tested, when instantiated, then all services and repositories are properly wired
- [ ] **AC19:** Given the full API is tested end-to-end, when creating → activating → completing a task, then all operations succeed and data flows correctly
- [ ] **AC20:** Given error scenarios are tested, when NOT_FOUND, VALIDATION_ERROR, or INTERNAL_ERROR occur, then appropriate HTTP responses are returned

## Additional Context

### Dependencies

**Internal Dependencies:**
- `@dailyuse/contracts/task` - Zod schemas, DTOs
- `@dailyuse/database` - Prisma client
- `@dailyuse/utils` - Result<T>, eventBus, logger
- `express` - Router, Request, Response types

**Application Services (already exist):**
- `TaskTemplateApplicationService` - Template CRUD, activation, pause
- `TaskInstanceApplicationService` - Instance completion, skip, reschedule
- `TaskStatisticsApplicationService` - Dashboard stats
- `TaskDependencyApplicationService` - Dependency management

**Repositories (already exist):**
- `TaskInstancePrismaRepository`
- `TaskDependencyPrismaRepository`
- `TaskStatisticsPrismaRepository`

### Testing Strategymust be refactored to return Result<T> (matching governance module pattern)
- **Reference:** governance/use-cases/delete-rule.use-case.ts is the gold standard
- Governance API layer uses legacy single-file routes - do NOT replicate (but their use cases are perfect)
- Task module sets NEW standard for future API implementations (ADR-021/022 split routes)
- Background job stubs should be clearly marked as placeholders
- All routes MUST have auth middleware (from context parameter)
- TaskModule DI container already wires all dependencies - just instantiate and use
- This is now a **REFACTOR + FEATURE** task (Phase 1: Refactor services, Phase 2: Build API)
- No domain/service testing (already tested in application-server layer)

### Notes

- **CRITICAL:** Application services throw errors (not Result<T>) - controllers MUST wrap in try-catch
- Governance module uses legacy single-file pattern - do NOT replicate
- Task module sets NEW standard for future API implementations  
- Background job stubs should be clearly marked as placeholders
- All routes MUST have auth middleware (from context parameter)
- TaskModule DI container already wires all dependencies - just instantiate and use
