# Container Architecture - Visual Reference

**Date**: January 17, 2026  
**Purpose**: Visual understanding of container structure and patterns

---

## Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     apps/api/src/app.ts                      │
│                   (Main Express Application)                  │
├─────────────────────────────────────────────────────────────┤
│  Initialize Containers → Mount Routes → Start Listeners      │
└──────────────┬───────────────┬──────────────┬────────────────┘
               │               │              │
         ┌─────┴─────┐   ┌────┴────┐   ┌────┴────────┐
         │ Containers│   │ Routes   │   │  Services   │
         └─────┬─────┘   └────┬────┘   └────┬────────┘
               │               │              │
    ┌──────────┴──────────┐    │              │
    │                     │    │              │
    ▼                     ▼    ▼              ▼
┌─────────────┐    ┌──────────────┐   ┌──────────────┐
│ @dailyuse/  │    │ Express      │   │ Event        │
│ infrastructure   │ Router       │   │ Handlers     │
│ -server         │ (interface/   │   │ (Listeners)  │
│ Containers  │    │  http/)      │   │              │
└─────────────┘    └──────────────┘   └──────────────┘
```

---

## Container Pattern Comparison

### Lazy-Load Pattern Flow

```
┌────────────────────────────────────────────────┐
│  TaskContainer.getInstance()                   │
│  ScheduleContainer.getInstance()               │
│  GoalContainer (API layer).getInstance()       │
└──────────────┬─────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Singleton    │
        │ Created?     │
        └──────┬───────┘
               │
         ┌─────┴─────┐
         │           │
        NO           YES
         │           │
         ▼           ▼
    ┌───────────┐ ┌─────────────┐
    │Create new │ │Return cached │
    │instance   │ │instance      │
    └─────┬─────┘ └──────┬──────┘
          │              │
          └──────┬───────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ get{Repo}Repository()    │
    └──────────────┬───────────┘
                   │
            ┌──────┴──────┐
            │             │
         Cached?        NO
            │             │
           YES            ▼
            │      ┌─────────────────┐
            │      │Create new Prisma│
            │      │Repo instance    │
            │      └────────┬────────┘
            │               │
            └───────┬───────┘
                    │
                    ▼
            ┌──────────────┐
            │Return Repo   │
            │(Cached)      │
            └──────────────┘
```

### Manual Register Pattern Flow

```
┌────────────────────────────────────────────────┐
│  GoalContainer (Infrastructure)                │
│  AuthContainer.getInstance()                   │
│  AccountContainer.getInstance()                │
│  (Other manual-register containers)            │
└──────────────┬─────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │Singleton     │
        │Created?      │
        └──────┬───────┘
               │
         ┌─────┴─────┐
         │           │
        NO           YES
         │           │
         ▼           ▼
    ┌───────────┐ ┌─────────────┐
    │Create new │ │Return cached │
    │instance   │ │instance      │
    └─────┬─────┘ └──────┬──────┘
          │              │
          └──────┬───────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ register{Repo}Repository()   │
    │ (Builder pattern - returns   │
    │ this for chaining)           │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ get{Repo}Repository()        │
    └──────────────┬───────────────┘
                   │
            ┌──────┴──────┐
            │             │
        Registered?       NO
            │             │
           YES            ▼
            │      ┌─────────────────┐
            │      │THROW ERROR:     │
            │      │"Repository not  │
            │      │registered"      │
            │      └─────────────────┘
            │
            ▼
    ┌──────────────┐
    │Return Repo   │
    │(Or error)    │
    └──────────────┘
```

---

## Container Hierarchy & Dependencies

```
┌─────────────────────────────────────────────────────────┐
│              @dailyuse/domain-server                     │
│       (Interfaces: ITaskInstanceRepository, etc.)        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         @dailyuse/infrastructure-server                  │
│                                                           │
│  ├─ TaskContainer (Lazy-load)                            │
│  │  ├─ getTaskInstanceRepository()                       │
│  │  ├─ getTaskTemplateRepository()                       │
│  │  ├─ getTaskDependencyRepository()                     │
│  │  ├─ getTaskStatisticsRepository()                     │
│  │  └─ getTaskDependencyService()                        │
│  │                                                         │
│  ├─ ScheduleContainer (Lazy-load)                        │
│  │  ├─ getScheduleTaskRepository()                       │
│  │  ├─ getScheduleStatisticsRepository()                 │
│  │  ├─ getScheduleRepository()                           │
│  │  └─ getScheduleExecutionRepository()                  │
│  │                                                         │
│  ├─ GoalContainer (Manual Register)                      │
│  │  ├─ registerGoalRepository()                          │
│  │  ├─ getGoalRepository()                               │
│  │  ├─ registerStatisticsRepository()                    │
│  │  └─ getStatisticsRepository()                         │
│  │                                                         │
│  ├─ AuthContainer (Manual Register)                      │
│  │  ├─ registerCredentialRepository()                    │
│  │  ├─ getCredentialRepository()                         │
│  │  ├─ registerSessionRepository()                       │
│  │  └─ getSessionRepository()                            │
│  │                                                         │
│  ├─ AccountContainer (Manual Register)                   │
│  ├─ RepositoryContainer (Manual Register)                │
│  ├─ DashboardContainer (Manual Register)                 │
│  └─ NotificationContainer (Manual Register)              │
│                                                           │
│  + Prisma Adapters (Implementations)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         @dailyuse/application-server                     │
│                                                           │
│  ├─ Task Module                                          │
│  │  └─ export { TaskContainer } from infrastructure     │
│  │  + Use Cases, Services, Event Handlers               │
│  │                                                         │
│  ├─ Schedule Module                                      │
│  │  └─ export { ScheduleContainer } from infrastructure │
│  │                                                         │
│  ├─ Goal Module                                          │
│  │  └─ export { GoalContainer } from infrastructure     │
│  │                                                         │
│  ├─ Auth Module                                          │
│  │  └─ export { AuthContainer } from infrastructure     │
│  │                                                         │
│  └─ Other Modules (similar pattern)                      │
│                                                           │
│  (Re-exports infrastructure containers)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              apps/api/src/modules/                        │
│                                                           │
│  ├─ goal/                                                │
│  │  ├─ infrastructure/di/GoalContainer.ts               │
│  │  │  (API-specific, lazy-load with services)          │
│  │  └─ interface/http/                                  │
│  │     └─ goalRoutes.ts (Express Router)                │
│  │                                                         │
│  ├─ task/                                                │
│  │  ├─ interface/http/routes/                           │
│  │  │  ├─ taskTemplateRoutes.ts                         │
│  │  │  ├─ taskDependencyRoutes.ts                       │
│  │  │  └─ taskStatisticsRoutes.ts                       │
│  │  └─ (Uses infrastructure container directly)         │
│  │                                                         │
│  ├─ schedule/                                            │
│  │  ├─ interface/http/routes/                           │
│  │  │  ├─ scheduleRoutes.ts                             │
│  │  │  └─ scheduleStatisticsRoutes.ts                   │
│  │  └─ (Uses infrastructure container directly)         │
│  │                                                         │
│  └─ authentication/                                      │
│     └─ interface/http/ (Routes only, no container)      │
│                                                           │
│  (API-specific containers + Routes + Controllers)       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              apps/api/src/app.ts                         │
│                                                           │
│  1. Initialize containers                                │
│  2. Mount routes via app.use()                           │
│  3. Start event listeners                                │
└─────────────────────────────────────────────────────────┘
```

---

## Request Handling Flow

```
HTTP Request
    │
    ▼
app.use('/goals', goalRoutes)  ◄── Routes (NOT from container)
    │
    ▼
GoalController.method()
    │
    ▼
GoalContainer.getInstance()
    │
    ▼
container.getGoalRepository()  ◄── Repository (from container)
    │
    ▼
Domain Operation
    │
    ▼
HTTP Response
```

---

## Initialization Sequence

```
Application Startup
    │
    ├─► Task 1: Initialize Containers
    │   ├─ TaskContainer.getInstance()
    │   ├─ ScheduleContainer.getInstance()
    │   ├─ GoalContainer.getInstance()
    │   └─ ... (others)
    │
    ├─► Task 2: Register Repositories (if manual pattern)
    │   ├─ goalInfraContainer.registerGoalRepository(...)
    │   ├─ authContainer.registerCredentialRepository(...)
    │   └─ ... (only if using infra containers directly)
    │
    ├─► Task 3: Mount Routes
    │   ├─ app.use('/goals', goalRoutes)
    │   ├─ app.use('/tasks', taskRoutes)
    │   └─ app.use('/schedules', scheduleRoutes)
    │
    ├─► Task 4: Initialize Services
    │   ├─ registerGoalEventHandlers()
    │   ├─ registerTaskEventHandlers()
    │   └─ startScheduler()
    │
    └─► Task 5: Application Ready
        ├─ app.listen(port)
        └─ Ready to accept requests
```

---

## Module Structure Template

```
apps/api/src/modules/{module}/
├─ infrastructure/
│  ├─ di/
│  │  └─ {Module}Container.ts      ◄── Lazy-load API container
│  │  
│  └─ cron/
│     └─ {module}.cron.ts          (If scheduled tasks)
│
├─ application/                     (If API-specific logic)
│
├─ initialization/
│  └─ {module}Initialization.ts     (Event handler setup)
│
└─ interface/
   └─ http/
      ├─ {Module}Controller.ts     (Handle HTTP requests)
      ├─ {module}Routes.ts         ◄── Express Router
      ├─ {Module}Validator.ts      (Input validation)
      └─ index.ts                  (Export routes)
```

---

## Error Diagnosis Chart

```
                       Error Occurs
                           │
                           ▼
              ┌─────────────────────────────────┐
              │ Is it "getRoutes is not a       │
              │ function" or similar?           │
              └────────┬──────────────┬─────────┘
                      YES             NO
                       │              │
                       ▼              ▼
              ┌──────────────┐  ┌──────────────────┐
              │Use route     │  │Is it "Repository │
              │files, not    │  │not registered"?  │
              │containers    │  └────┬──────────┬──┘
              └──────────────┘       YES       NO
                                     │         │
                                     ▼         ▼
                            ┌──────────────┐ ┌───────────────┐
                            │Check if      │ │Check if using │
                            │manual        │ │wrong method   │
                            │register      │ │name (register │
                            │pattern,      │ │vs get)        │
                            │register      │ └───────────────┘
                            │before use    │
                            └──────────────┘
```

---

## Pattern Comparison Visual

```
┌──────────────────────────────────────────────────────────────┐
│                    LAZY-LOAD PATTERN                          │
├──────────────────────────────────────────────────────────────┤
│  Usage:  const repo = container.getXyz();                     │
│  Result: Repo created on first call, cached after            │
│  Error:  Never throws (creates on demand)                    │
│  Testing: container.setXyz(mockRepo);                        │
│  Containers: Task, Schedule, API-layer                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 MANUAL REGISTER PATTERN                       │
├──────────────────────────────────────────────────────────────┤
│  Usage:  container.registerXyz(repo);                         │
│          const repo = container.getXyz();                     │
│  Result: Must register before get, chainable builder         │
│  Error:  Throws if not registered                            │
│  Testing: container.resetInstance(); then register           │
│  Containers: Goal, Auth, Account, Repository, etc.          │
└──────────────────────────────────────────────────────────────┘
```

---

## Container Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                     APPLICATION STARTUP                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Container.getInstance()    │
        │ (Create or get singleton)  │
        └────────────┬───────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐          ┌──────▼──────┐
    │Lazy-    │          │Manual       │
    │load     │          │Register     │
    │pattern  │          │pattern      │
    └────┬────┘          └──────┬──────┘
         │                      │
         ▼                      ▼
    ┌──────────┐         ┌─────────────┐
    │On first  │         │Must call    │
    │get*()*   │         │register*()* │
    │creates   │         │before use   │
    └────┬─────┘         └──────┬──────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │ Container cached in  │
        │ memory (singleton)   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Used throughout app  │
        │ lifecycle            │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Application shutdown │
        │ (Container destroyed)│
        └──────────────────────┘
```

---

## Module Coverage Heat Map

```
         Infrastructure  Application  API  Status
Task         ✅            ✅          ⏸️   Complete
Schedule     ✅            ✅          ⏸️   Complete
Goal         ✅            ✅          ✅   Complete
Auth         ✅            ✅          ❌   Missing API
Account      ✅            ❌          ❌   Missing App+API
Repository   ✅            ❌          ❌   Missing App+API
Dashboard    ✅            ❌          ❌   Missing App+API
Notification ✅            ❌          ❌   Missing App+API

Legend:
✅ = Exists and functional
⏸️  = Exists but uses infrastructure directly
❌ = Doesn't exist (needs to be created)
```

---

## Documentation Map

```
You are here
    │
    ▼
Need quick answer?
├─ YES → container-quick-reference.md
│        (Error fixes, method lookup)
│
└─ NO → Need comprehensive reference?
        ├─ YES → container-exports-analysis.md
        │        (All containers, all methods)
        │
        └─ NO → Need to implement?
                └─ api-entry-container-fixes.md
                   (Code templates, patterns)
```

---

**Created**: January 17, 2026  
**Status**: Visual reference complete  
**Use for**: Understanding architecture and patterns
