# Implementation Plan (IMPL_PLAN)

**Feature**: DailyUse Personal Productivity Web Platform  
**Branch**: `001-daily-productivity`  
**Status**: Ready for implementation  
**Created**: 2026-02-03  

---

## Executive Summary

Complete specification and planning for the DailyUse personal productivity platform featuring OKR goal management, task tracking, habit reminders, knowledge repository, and multi-channel notifications.

### Deliverables by Phase
- **Phase 0** ✅ Complete: Research, decisions, architecture documented
- **Phase 1** ✅ Complete: Data model, API contracts, quick start guide, constitution check
- **Phase 2** (Ready): Backend implementation with RPC protocol, frontend UI integration, testing
- **Phase 3** (Ready): Performance optimization, scaling, deployment

---

## Design Artifacts (Phase 0 & 1 Complete)

All design phase documents are complete and stored in `specs/001-daily-productivity/`:

1. **[research.md](./research.md)** - All Phase 0 research completed
   - ✅ OKR progress sync decision: Manual-first with optional Phase 2 auto-calculation
   - ✅ Notification channels: 2-channel MVP (In-App, Browser Push)
   - ✅ Express RPC protocol optimization: DTO-based, entity-free responses
   - ✅ Code standards and RPC map guidelines

2. **[data-model.md](./data-model.md)** - Complete data model
   - ✅ 10 core entities with fields, validation, relationships
   - ✅ Zod schemas for all types
   - ✅ State transitions and business rules
   - ✅ Supporting entities (Tag, Folder, ReminderInstance)
   - ✅ Database indexes and constraints

3. **[api-contracts.md](./api-contracts.md)** - Complete API specification
   - ✅ 50+ endpoints across 10 modules
   - ✅ Request/Response DTOs with validation rules
   - ✅ Error codes and common response formats
   - ✅ Endpoint summary table

4. **[quickstart.md](./quickstart.md)** - Implementation guide
   - ✅ Setup instructions (15 minutes)
   - ✅ 5 core workflows with step-by-step guide
   - ✅ Code architecture overview
   - ✅ Phase 1 & 2 checklists
   - ✅ Testing strategies
   - ✅ Common issues & solutions

5. **[constitution-check.md](./constitution-check.md)** - Compliance verification
   - ✅ Principle I-VII verification: ALL COMPLIANT
   - ✅ Design quality assessment
   - ✅ Implementation checklist for Constitution compliance

---

## Phase 2: Backend Implementation (Weeks 1-4)

### Week 1: Foundation & Authentication

**Goal**: Establish database schema, auth system, and RPC protocol infrastructure

**Tasks**:

1. **Database Schema** (2 days)
   - [ ] Create Prisma schema file with all 10 core entities
   - [ ] Create initial migration: `pnpm prisma migrate dev --name init`
   - [ ] Add indexes for performance (see data-model.md)
   - [ ] Verify schema compiles without errors
   - PR: `/database/initial-schema`

2. **Auth Module** (3 days)
   - [ ] Create `apps/api/src/modules/auth/` structure
   - [ ] Implement auth contracts:
     - [ ] `packages/contracts/src/modules/auth/api/` - SignUpReq, LoginReq, AuthClientDTO
     - [ ] `packages/contracts/src/modules/auth/aggregates/` - AuthClientDTO, AuthServerDTO
     - [ ] `packages/contracts/src/modules/auth/protocol/` - AuthRpcMap with login, signup, logout, refresh
   - [ ] Implement auth service:
     - [ ] Password hashing (bcrypt)
     - [ ] JWT generation and validation
     - [ ] Session persistence (database or Redis)
   - [ ] Create RPC handlers:
     - [ ] `'auth:signup'` - create user, return JWT
     - [ ] `'auth:login'` - validate credentials, return JWT
     - [ ] `'auth:logout'` - invalidate session
     - [ ] `'auth:refresh'` - generate new JWT
   - [ ] Add Zod validation schemas for all requests
   - [ ] Create mapper: `UserEntity` → `AuthClientDTO`
   - PR: `/auth/initial-implementation`

3. **RPC Router & Middleware** (2 days)
   - [ ] Create `RpcRouter` class in `apps/api/src/shared/rpc/`
   - [ ] Implement middleware stack:
     - [ ] Authentication check middleware
     - [ ] Request validation middleware (Zod)
     - [ ] Response transformation middleware (entity → DTO)
     - [ ] Error handling middleware
   - [ ] Create helper utilities:
     - [ ] `createHandler()` for type-safe RPC registration
     - [ ] `validateRequest()` for Zod validation
     - [ ] `mapToDTO()` for entity conversion
   - PR: `/rpc/router-implementation`

4. **Testing Setup** (1 day)
   - [ ] Configure Vitest for integration tests
   - [ ] Create test database (in-memory SQLite or test pg instance)
   - [ ] Write auth service unit tests (password hashing, JWT validation)
   - [ ] Write auth endpoint integration tests
   - Target: >80% coverage for auth module
   - PR: `/auth/test-suite`

**Success Criteria**:
- ✅ `pnpm nx build contracts` passes
- ✅ `pnpm nx build api` passes
- ✅ `pnpm nx test auth` shows >80% coverage
- ✅ `pnpm lint` and `pnpm format` pass
- ✅ Database schema verified with Prisma

---

### Week 2: Goal & Task Management

**Goal**: Implement core OKR and task management features

**Tasks**:

1. **Goal Module** (3 days)
   - [ ] Create goal contracts:
     - [ ] Request: `CreateGoalReq`, `UpdateGoalReq`, `ListGoalQuery`
     - [ ] Response: `GoalClientDTO`
     - [ ] Zod schemas for all with validation rules
   - [ ] Implement goal service:
     - [ ] CRUD operations
     - [ ] Progress calculation (average of KRs)
     - [ ] State transitions (draft → in_progress → completed → archived)
   - [ ] Create RPC handlers:
     - [ ] `'goal:create'`, `'goal:update'`, `'goal:get'`, `'goal:delete'`, `'goal:list'`
   - [ ] Mapper: `GoalEntity` → `GoalClientDTO`
   - [ ] Tests: Unit (service) + Integration (endpoints)
   - [ ] Database indexes: `(userId, status)`, `(userId, updatedAt)`
   - PR: `/goal/initial-implementation`

2. **Key Result Module** (2 days)
   - [ ] Create KR contracts:
     - [ ] Request: `CreateKeyResultReq`, `UpdateKeyResultReq`
     - [ ] Response: `KeyResultClientDTO`
   - [ ] Implement KR service:
     - [ ] CRUD operations
     - [ ] Progress calculation: `(currentValue / targetValue) * 100`
     - [ ] Linked to Goal
   - [ ] Create RPC handlers:
     - [ ] `'key-result:create'`, `'key-result:update'`, `'key-result:list'`
   - [ ] Mapper: `KeyResultEntity` → `KeyResultClientDTO`
   - [ ] Tests: >80% coverage
   - PR: `/key-result/initial-implementation`

3. **Task Module** (3 days)
   - [ ] Create task contracts:
     - [ ] Request: `CreateTaskReq`, `UpdateTaskReq`, `ListTaskQuery`
     - [ ] Response: `TaskClientDTO`
   - [ ] Implement task service:
     - [ ] CRUD operations
     - [ ] Status lifecycle with state validation
     - [ ] Optional link to KeyResult
     - [ ] Recurring task logic (RRULE parsing)
       - [ ] On task completion, create next instance automatically
     - [ ] Subtask support (parentTaskId)
   - [ ] Create RPC handlers:
     - [ ] `'task:create'`, `'task:update'`, `'task:get'`, `'task:delete'`, `'task:list'`
   - [ ] Mapper: `TaskEntity` → `TaskClientDTO`
   - [ ] Add RRULE parser utility (or use `rrule` npm package)
   - [ ] Tests: >80% coverage
   - [ ] Database indexes: `(userId, status)`, `(userId, dueAt)`, `(keyResultId, status)`
   - PR: `/task/initial-implementation`

4. **Integration Tests** (2 days)
   - [ ] Goal + KR + Task workflow test
   - [ ] Verify KR progress updates when task status changes (Phase 2 auto-sync testing)
   - [ ] Test recurring task creation on completion
   - [ ] Test state transition validation
   - PR: `/integration/goal-task-workflow`

**Success Criteria**:
- ✅ All goal, KR, task endpoints working
- ✅ RPC maps properly defined with DTOs only
- ✅ >80% test coverage for all services
- ✅ RRULE parsing working (test with common patterns)
- ✅ Database indexes created and working

---

### Week 3: Notifications, Settings & Repository

**Goal**: Implement notification system, user preferences, and knowledge repository

**Tasks**:

1. **Notification System** (3 days) - Phase 1: MVP (In-App + Browser Push)
   - [ ] Create notification contracts:
     - [ ] Request: `CreateNotificationReq` (internal, from services)
     - [ ] Response: `NotificationClientDTO`
   - [ ] Implement notification service:
     - [ ] Dispatcher class for in-app & browser push
     - [ ] Preference checking (quiet hours, channels)
     - [ ] Storage in database
   - [ ] Create notification handler:
     - [ ] Listen to goal/task/reminder events
     - [ ] Create notification records
     - [ ] Send in-app toast (WebSocket)
     - [ ] Send browser push (Service Worker)
   - [ ] Create RPC handlers:
     - [ ] `'notification:list'`, `'notification:mark-read'`, `'notification:delete'`
   - [ ] Mapper: `NotificationEntity` → `NotificationClientDTO`
   - [ ] Service Worker setup for browser push
   - [ ] Tests: notification creation, preference application
   - PR: `/notification/initial-implementation`

2. **Settings Module** (2 days)
   - [ ] Create settings contracts:
     - [ ] Request: `UpdateSettingsReq`
     - [ ] Response: `SettingsClientDTO`
   - [ ] Implement settings service:
     - [ ] CRUD operations
     - [ ] Create default settings on user signup
     - [ ] Theme, language, autosave interval
     - [ ] Notification channel preferences
     - [ ] Quiet hours logic
   - [ ] Create RPC handlers:
     - [ ] `'setting:get'`, `'setting:update'`
   - [ ] Mapper: `SettingsEntity` → `SettingsClientDTO`
   - [ ] Tests: >80% coverage
   - PR: `/setting/initial-implementation`

3. **Repository Module** (3 days)
   - [ ] Create repository contracts:
     - [ ] Request: `CreateRepositoryItemReq`, `UpdateRepositoryItemReq`, `ListRepositoryQuery`
     - [ ] Response: `RepositoryItemClientDTO`
   - [ ] Implement repository service:
     - [ ] CRUD for notes, images, audio, video, documents
     - [ ] File upload handling (multipart)
     - [ ] Tagging system
     - [ ] Folder/hierarchy support
     - [ ] Full-text search (title + content)
   - [ ] Create RPC handlers:
     - [ ] `'repository:create'`, `'repository:update'`, `'repository:get'`, `'repository:delete'`, `'repository:list'`, `'repository:search'`
   - [ ] Mapper: `RepositoryItemEntity` → `RepositoryItemClientDTO`
   - [ ] File storage: decide on S3, local filesystem, or hybrid
   - [ ] Search implementation: database FTS or Elasticsearch
   - [ ] Tests: >80% coverage
   - [ ] Database indexes: `(userId, type)`, `(userId, folderId)`, FTS on `title`+`content`
   - PR: `/repository/initial-implementation`

4. **Supporting Entities** (1 day)
   - [ ] Implement Tag entity and CRUD
   - [ ] Implement Folder entity with hierarchy
   - [ ] Link both to RepositoryItem

**Success Criteria**:
- ✅ In-app notifications working (WebSocket delivery)
- ✅ Browser push working (Service Worker)
- ✅ Settings persistence and retrieval
- ✅ Repository CRUD and search working
- ✅ >80% test coverage
- ✅ File upload working (with storage strategy decided)

---

### Week 4: Reminders, Schedule & Polish

**Goal**: Complete remaining modules and prepare for frontend integration

**Tasks**:

1. **Reminder Module** (2 days)
   - [ ] Create reminder contracts:
     - [ ] Request: `CreateReminderReq`, `UpdateReminderReq`
     - [ ] Response: `ReminderClientDTO`
   - [ ] Implement reminder service:
     - [ ] CRUD operations
     - [ ] RRULE schedule parsing
     - [ ] Snooze functionality
     - [ ] Channel configuration (in_app, browser, email, sound)
   - [ ] Create RPC handlers:
     - [ ] `'reminder:create'`, `'reminder:update'`, `'reminder:delete'`, `'reminder:list'`
   - [ ] Mapper: `ReminderEntity` → `ReminderClientDTO`
   - [ ] Create job scheduler (Bull/Redis for Phase 2)
   - [ ] Tests: >80% coverage
   - PR: `/reminder/initial-implementation`

2. **Schedule Module** (2 days)
   - [ ] Create schedule contracts:
     - [ ] Request: `CreateScheduleItemReq`
     - [ ] Response: `ScheduleItemClientDTO`
   - [ ] Implement schedule service:
     - [ ] CRUD for calendar events
     - [ ] Link existing goals/tasks/reminders to calendar
     - [ ] Date range queries
   - [ ] Create RPC handlers:
     - [ ] `'schedule:create'`, `'schedule:get'`, `'schedule:list'`
   - [ ] Mapper: `ScheduleItemEntity` → `ScheduleItemClientDTO`
   - [ ] Tests: >80% coverage
   - PR: `/schedule/initial-implementation`

3. **Note/Editor Module** (2 days)
   - [ ] Create note contracts:
     - [ ] Request: `CreateNoteReq`, `SaveNoteReq`, `AutosaveNoteReq`
     - [ ] Response: `NoteClientDTO`
   - [ ] Implement note service:
     - [ ] CRUD operations
     - [ ] Autosave with configurable interval
     - [ ] Link to RepositoryItem
   - [ ] Create RPC handlers:
     - [ ] `'note:create'`, `'note:get'`, `'note:save'`, `'note:autosave'`, `'note:delete'`
   - [ ] Mapper: `NoteEntity` → `NoteClientDTO`
   - [ ] Tests: >80% coverage
   - PR: `/note/initial-implementation`

4. **Documentation & Polish** (2 days)
   - [ ] Create API documentation (OpenAPI/Swagger)
   - [ ] Write module-by-module implementation guide
   - [ ] Document RPC protocol for frontend developers
   - [ ] Create development setup guide
   - [ ] Write troubleshooting guide
   - [ ] Code review all modules for Constitution compliance
   - PR: `/documentation/api-and-guides`

5. **Performance Baseline** (1 day)
   - [ ] Add database query logging
   - [ ] Measure critical endpoint performance
   - [ ] Verify indexes are effective
   - [ ] Document baseline metrics
   - PR: `/performance/initial-baseline`

**Success Criteria**:
- ✅ All 10 modules implemented with RPC maps
- ✅ All endpoints tested (>80% coverage)
- ✅ All RPC response types use DTOs (zero entity exports)
- ✅ `pnpm nx affected:test` passes with >80% coverage
- ✅ `pnpm lint` and `pnpm format` pass
- ✅ API documentation complete
- ✅ Ready for frontend integration

---

## Phase 3: Frontend Implementation (Weeks 5-8)

### Week 5: Auth UI & RPC Client

**Goal**: Set up Vue/React UI framework and RPC client integration

**Tasks**:

1. **RPC Client Library**
   - [ ] Create `packages/domain-client/src/rpc-client.ts`
   - [ ] Type-safe RPC call wrapper
   - [ ] Error handling and retry logic
   - [ ] WebSocket for real-time notifications

2. **React Hooks** (for desktop)
   - [ ] `useRpc()` hook for RPC calls
   - [ ] `useAuth()` hook for auth state
   - [ ] `useGoal()` hook for goal management
   - [ ] `useTask()` hook for task management

3. **Vue Composables** (for web)
   - [ ] `useRpc()` composable for RPC calls
   - [ ] `useAuth()` composable for auth state
   - [ ] `useGoal()` composable for goal management
   - [ ] `useTask()` composable for task management

4. **Authentication UI**
   - [ ] Sign up page (Vue)
   - [ ] Login page (Vue)
   - [ ] Desktop auth (React)
   - [ ] Session persistence
   - [ ] Token refresh logic

5. **Tests**
   - [ ] RPC client unit tests
   - [ ] Auth hooks/composables unit tests
   - [ ] Auth UI integration tests

### Weeks 6-8: Feature UI Implementation

**Goal**: Build complete user interface for all features

**Tasks**:

1. **Goal Management UI**
   - [ ] Goal list view with filtering/sorting
   - [ ] Goal detail view
   - [ ] Create/edit goal forms
   - [ ] Key Result list and management
   - [ ] Progress visualization

2. **Task Management UI**
   - [ ] Task list with filtering by status, priority, due date
   - [ ] Task detail view
   - [ ] Create/edit task forms
   - [ ] Status lifecycle UI
   - [ ] Recurring task configuration
   - [ ] Link to KR UI

3. **Reminder UI**
   - [ ] Reminder list view
   - [ ] Create/edit reminder forms
   - [ ] RRULE schedule builder (UI)
   - [ ] Channel selection UI
   - [ ] Active/inactive toggle

4. **Repository UI**
   - [ ] Repository list with grid/list views
   - [ ] Search and filter UI
   - [ ] Upload file dialog
   - [ ] Folder hierarchy UI
   - [ ] Note editor with markdown preview

5. **Settings UI**
   - [ ] Theme selector (light/dark/auto)
   - [ ] Language selector
   - [ ] Notification preferences
   - [ ] Quiet hours configuration
   - [ ] Editor settings

6. **Notifications UI**
   - [ ] In-app toast notifications
   - [ ] Notification center (list of recent)
   - [ ] Mark read/archive
   - [ ] Real-time updates via WebSocket

7. **Dashboard**
   - [ ] Overview of today's tasks
   - [ ] Recent goals and progress
   - [ ] Upcoming reminders
   - [ ] Quick actions

**Success Criteria**:
- ✅ All 6 core workflows from quickstart.md working end-to-end
- ✅ Authentication and session management working
- ✅ Real-time notifications working
- ✅ Mobile-responsive design (Vue web)
- ✅ >70% test coverage for UI components

---

## Phase 4: Testing & Deployment (Weeks 9-10)

### Week 9: Quality Assurance

**Tasks**:
- [ ] E2E tests for all 6 core workflows
- [ ] Load testing (concurrent users, bulk operations)
- [ ] Security testing (SQL injection, XSS, CSRF)
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Performance profiling
- [ ] Browser compatibility testing

### Week 10: Deployment & Release

**Tasks**:
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Automated testing on PR
- [ ] Automated deployment to staging
- [ ] Production deployment checklist
- [ ] Beta user onboarding
- [ ] Monitoring setup (error tracking, performance)

---

## Code Quality & Review Standards

### Pre-Implementation Review

Before starting implementation, ensure team agreement on:
1. ✅ **RPC Protocol Standard** - All RPC responses use DTOs, never entities (per Constitution Principle VI)
2. ✅ **Entity Mapper Pattern** - `entity → mapper → DTO` pattern for all CRUD responses
3. ✅ **DTO Validation** - Zod schemas for all request/query types in API layer
4. ✅ **File Naming** - All files use kebab-case (verified in Constitution)

### Code Review Checklist (For Each PR)

```
Entity-DTO Separation (CRITICAL for RPC Protocol):
- [ ] All types in RPC map are DTOs, not entities
- [ ] Mapper function exists for entity→DTO conversion
- [ ] Response envelope uses DTO, not entity
- [ ] No direct entity properties exposed in API

Type Safety:
- [ ] No `any` types without justification
- [ ] All function signatures have explicit return types
- [ ] Zod schema validates all request inputs
- [ ] TypeScript build passes: pnpm tsc

Architecture:
- [ ] Business logic in service layer (not in controller/handler)
- [ ] No platform-specific code in business logic
- [ ] No circular dependencies (verify: nx graph)
- [ ] Module structure follows DDD pattern

Testing:
- [ ] New code has tests (unit + integration)
- [ ] Coverage >80% for domain layer
- [ ] Integration tests verify API contracts
- [ ] Tests pass: pnpm nx affected:test

Code Quality:
- [ ] Follows kebab-case naming convention
- [ ] Passes linting: pnpm lint
- [ ] Properly formatted: pnpm format
- [ ] Comments explain business logic (why, not what)

Documentation:
- [ ] API changes documented in api-contracts.md
- [ ] Complex logic has inline comments
- [ ] RPC map changes explained in PR description
```

---

## Success Metrics

### Phase 2 (Backend)
- ✅ All 10 modules implemented with >80% test coverage
- ✅ All API endpoints working with proper DTOs
- ✅ All RPC maps compliant with Constitution Principle VI
- ✅ Database performance acceptable (query < 100ms for standard operations)

### Phase 3 (Frontend)
- ✅ 6 core workflows end-to-end working
- ✅ Real-time notifications visible to users
- ✅ Responsive design on web and desktop
- ✅ >70% test coverage for UI components

### Phase 4 (Testing & Deployment)
- ✅ E2E test suite covering all features
- ✅ Production deployment automated and reliable
- ✅ Monitoring and error tracking set up
- ✅ Beta users successfully onboarded

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| RPC DTO pattern misunderstood | Medium | High | Code review checklist + example module reference |
| Recurring task RRULE complexity | Medium | Medium | Use rrule npm package + comprehensive tests |
| Notification delivery reliability | Medium | High | Queue-based approach in Phase 2, retry logic |
| Database N+1 queries | Medium | Medium | Add query logging, profile early |
| Frontend state management complexity | High | High | Use Pinia (Vue) / Redux (React), design state early |
| Multi-platform sync issues | Medium | High | Shared contracts + comprehensive integration tests |

---

## Dependencies & Constraints

### Required Packages
```json
{
  "express": "4.x",
  "prisma": "latest",
  "zod": "latest",
  "rrule": "latest",
  "jsonwebtoken": "9.x",
  "bcryptjs": "2.x",
  "vue": "3.x",
  "react": "18.x",
  "electron": "30.x",
  "vitest": "latest",
  "axios": "1.x"
}
```

### Infrastructure
- PostgreSQL 14+ (database)
- Redis (Phase 2+, for job queue)
- AWS S3 or local storage (file uploads)
- SMTP server or SendGrid (email notifications in Phase 2)

### Team Skills Required
- TypeScript/Node.js backend
- Vue 3 / React frontend
- Electron desktop development
- PostgreSQL / Prisma ORM
- Testing frameworks (Vitest)

---

## Communication & Coordination

### Weekly Standup (Recommend)
- Monday: Week planning & blockers review
- Friday: Progress review & plan next week

### Key Milestones for Communication
- **Week 1 End**: Database schema + Auth working
- **Week 2 End**: Goal + Task management working
- **Week 4 End**: All backend modules complete, ready for frontend
- **Week 8 End**: All UI features complete, ready for testing
- **Week 10 End**: Production ready

### Decision Escalation
- **Code patterns**: Reference example module, escalate to @BakerSean168 if unclear
- **Architecture changes**: Create RFC, discuss with team
- **Dependency additions**: Require team approval due to Constitution constraints

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-02-03 | Final | Phase 0-1 complete, ready for Phase 2 implementation |

---

## Appendix A: File Structure Reference

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts (or handler.ts)
│   │   └── ...
│   ├── goal/
│   ├── task/
│   ├── reminder/
│   ├── notification/
│   ├── repository/
│   ├── note/
│   ├── schedule/
│   └── setting/
├── shared/
│   ├── rpc/
│   │   ├── rpc-router.ts
│   │   ├── rpc-handler.ts
│   │   ├── middleware/
│   │   └── ...
│   ├── auth/
│   ├── database/
│   └── validation/
└── app.ts

packages/contracts/src/
├── modules/
│   ├── auth/
│   │   ├── api/
│   │   │   ├── requests.ts
│   │   │   ├── responses.ts
│   │   │   └── index.ts
│   │   ├── aggregates/
│   │   │   ├── auth-client.ts
│   │   │   ├── auth-server.ts
│   │   │   └── index.ts
│   │   ├── protocol/
│   │   │   └── auth-rpc-map.ts
│   │   └── index.ts
│   ├── goal/
│   ├── task/
│   ├── reminder/
│   ├── ... (other modules)
│   └── example/ (reference implementation)
```

---

**Status**: Ready for Phase 2 implementation  
**Next Action**: Begin Week 1 tasks with database schema and auth module

