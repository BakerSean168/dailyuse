# DDD Service Layer Refactoring Summary

## Overview

This refactoring addresses the issue of monolithic application services that violate the Single Responsibility Principle. The goal is to migrate from monolithic services to individual use-case services following Domain-Driven Design (DDD) principles.

## Principles Applied

### Application Services (Use Cases)
- **Purpose**: Orchestrate business workflows, coordinate domain services and repositories
- **NOT responsible for**: Business rules (those belong in domain services and aggregates)
- **Naming**: Verb-noun pattern reflecting use cases (create-X, update-X, delete-X, list-X, get-X)
- **Size**: Small, focused, single responsibility

### Domain Services
- **Purpose**: Business logic spanning multiple aggregates
- **Examples**: Registration, Login, conflict detection, validation across entities
- **Naming**: Business-focused names (registration.ts, login.ts, NOT crud.ts)

### Aggregates
- **Purpose**: Business logic natural to the entity
- **Pattern**: Private backing fields, readonly getters, business methods returning Result<T>
- **Events**: Domain events for state changes

## Reference Modules

These modules demonstrate the proper pattern:

### Governance Module ✅
- **Application Services**: Individual use-case files (create-rule.use-case.ts, update-rule.use-case.ts, etc.)
- **Domain Services**: None needed (all logic in aggregate)
- **Aggregates**: Rule with comprehensive business methods

### Authentication Module ✅
- **Application Services**: Individual use-cases (minimal, mostly delegation)
- **Domain Services**: registration.ts, login.ts, logout.ts (proper business-focused names)
- **Aggregates**: AuthIdentity, AuthSession with business logic

### Account Module ✅
- **Application Services**: Individual use-cases (check-availability.ts, close-account.ts, etc.)
- **Domain Services**: Business-focused services
- **Aggregates**: Account with business methods

## Refactoring Completed

### Phase 1: Schedule Module ✅
**Status**: Use-cases created, monolithic service deprecated
- Created 10 individual use-case classes
- Marked `ScheduleApplicationService` as deprecated
- Each use-case handles single operation (create, update, delete, pause, resume, trigger, get, list by account/source/status)

### Phase 2: Repository Module ✅
**Status**: Monolithic services deprecated
- Marked 6 monolithic services as deprecated:
  - repository-application-service.ts
  - folder-application-service.ts
  - resource-application-service.ts
  - repository-permission-application-service.ts
  - search-application-service.ts (and search-application.ts - naming inconsistency)
  - tags-application-service.ts (and tags-application.ts - naming inconsistency)
- Individual use-case files already exist

### Phase 3: Task Module ✅
**Status**: Monolithic services deprecated
- Marked 3 monolithic services as deprecated:
  - task-template-application-service.ts
  - task-instance-application-service.ts
  - task-dependency-application-service.ts
- Individual use-case files already exist (create, activate, pause, delete, complete, skip, etc.)
- Domain services properly scoped (TaskInstanceGenerationService, TaskExpirationService, TaskDependencyService)

### Phase 4: Goal Module ✅
**Status**: Monolithic services deprecated
- Marked 8 monolithic services as deprecated:
  - goal-application-service.ts
  - goal-folder-application-service.ts
  - goal-key-result-application-service.ts
  - goal-record-application-service.ts
  - goal-review-application-service.ts
  - focus-mode-application-service.ts
  - focus-session-application-service.ts
  - weight-snapshot-application-service.ts
- Individual use-case files already exist

### Phase 5: Reminder Module ✅
**Status**: Already marked deprecated
- reminder-application-service.ts already had deprecation notice
- Individual use-case files already exist

### Phase 6: Setting Module ✅
**Status**: Monolithic service deprecated
- Marked setting-application-service.ts as deprecated
- Individual use-case files already exist (get, update, reset, export, import)

### Phase 7: Notification Module ✅
**Status**: Monolithic services deprecated
- Marked notification-application-services.ts as deprecated (3 classes in one file)
- Individual use-case files already exist
- Anti-pattern identified: Multiple classes in single file

### Phase 8: Client-Side ✅
**Status**: Monolithic services deprecated, documentation created
- Added deprecation notices to client-side monolithic services:
  - task-client-service.ts
  - goal-client-service.ts
  - schedule-client-service.ts
  - repository-client-service.ts
  - reminder-client-service.ts
  - setting-client-service.ts
  - notification-client-service.ts
- Created CLIENT_SIDE_REFACTORING.md guide
- Governance module demonstrates proper pattern with individual service files

## Impact Analysis

### Affected Modules (Server-Side)
- ✅ Schedule: 1 monolithic service → 10 use-cases
- ✅ Repository: 6 monolithic services → individual use-cases exist
- ✅ Task: 3 monolithic services → individual use-cases exist
- ✅ Goal: 8 monolithic services → individual use-cases exist
- ✅ Reminder: 1 deprecated service → individual use-cases exist
- ✅ Setting: 1 monolithic service → individual use-cases exist
- ✅ Notification: 3 classes → individual use-cases exist

### Affected Modules (Client-Side)
- ✅ All modules: Monolithic client services deprecated
- ✅ Documentation created for migration

### Not Affected
- ❌ Governance (reference module, already follows pattern)
- ❌ Account (reference module, already follows pattern)
- ❌ Authentication (reference module, already follows pattern)

## Migration Path for Consumers

### Before (Monolithic Service)
```typescript
const service = new ScheduleApplicationService(repo, statsRepo);
const task = await service.createScheduleTask({ ... });
const updated = await service.updateScheduleTask(uuid, { ... });
await service.deleteScheduleTask(uuid);
```

### After (Use-Case Services)
```typescript
const createUseCase = new CreateScheduleTaskUseCase(repo, statsRepo);
const task = await createUseCase.execute({ ... });

const updateUseCase = new UpdateScheduleTaskUseCase(repo);
const updated = await updateUseCase.execute({ uuid, ... });

const deleteUseCase = new DeleteScheduleTaskUseCase(repo);
await deleteUseCase.execute(uuid);
```

## Next Steps

### Immediate (Completed ✅)
1. ✅ Add deprecation notices to all monolithic services
2. ✅ Document migration patterns
3. ✅ Create use-cases for Schedule module
4. ✅ Add client-side refactoring guide

### Short-term (Recommended)
1. Extract remaining business logic from application services to domain services
2. Consolidate domain service naming and responsibilities
3. Remove duplicate files (search-application vs search-application-service)
4. Create individual client-side service files for remaining modules

### Long-term (After migration)
1. Remove deprecated monolithic services
2. Update all consumers to use new use-cases
3. Add integration tests for use-case workflows
4. Document architectural decision records (ADRs)

## Benefits

### Code Quality
- **Single Responsibility**: Each use-case does one thing
- **Testability**: Easier to test individual operations
- **Maintainability**: Changes isolated to specific files
- **Discoverability**: File names clearly indicate functionality

### Developer Experience
- **Clarity**: Purpose of each file is obvious from name
- **Consistency**: Follows DDD reference modules
- **Onboarding**: Easier for new developers to understand
- **IDE Support**: Better autocomplete and navigation

### Architecture
- **Clean Architecture**: Clear separation of concerns
- **Dependency Inversion**: Use-cases depend on abstractions
- **Open/Closed**: Easy to add new use-cases without modifying existing
- **Domain-Driven**: Business logic properly placed in domain layer

## Lessons Learned

### Anti-Patterns Identified
1. ❌ Monolithic services with 50+ methods
2. ❌ Multiple classes in single file
3. ❌ Inconsistent naming conventions
4. ❌ Business logic in application layer
5. ❌ Generic names (crud, application-service)

### Best Practices
1. ✅ One use-case per file
2. ✅ Verb-noun naming (create-X, update-X)
3. ✅ Business logic in domain services/aggregates
4. ✅ Use Result<T> pattern for operations
5. ✅ Domain events for state changes

## References

- [DDD原则讨论 (Issue)](https://github.com/BakerSean168/dailyuse/issues/xxx)
- [Governance Module (Reference)](../packages/governance/src/)
- [Authentication Module (Reference)](../packages/authentication/src/)
- [Account Module (Reference)](../packages/account/src/)
