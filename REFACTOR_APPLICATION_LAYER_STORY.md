# Story: Refactor Application Layer to Pure Dependency Injection and Module Pattern

**Epic:** Architecture Cleanup
**Goal:** Eliminate Reference Cycles between App and Infra layers & implement explicit Module Composition.
**Priority:** Critical (blocks build).

## Context
The application server currently relies on Infrastructure Containers to instantiate itself (Circular Dependency). We are moving to a Pure DI model with Instantiable Modules.

## Tasks

### 1. Move Bootstrap Code (Quick Win)
- [x] Move `d:\home\projects\dailyuse\packages\application-server\src\schedule\services\scheduler-bootstrap.ts` to `packages/infrastructure-server/src\schedule\scheduler-bootstrap.ts`.
- [x] Update imports in the moved file (import from relatives).
- [x] Update any references to `SchedulerBootstrap` in `main.ts`.

### 2. Refactor Goal Module (Pilot)
- [x] **Clean Application Service:** `ArchiveGoal` (remove `getInstance`, `createInstance`, `GoalContainer` import).
- [x] **Clean Application Service:** `GetGoal`, `CreateGoal`, etc. (Refactored `GoalApplicationService`, `GoalKeyResultApplicationService` as major items).
- [x] **Create Infra Module:** Create `GoalModule` class in `infrastructure-server`.
    -   Constructor accepts `PrismaClient`.
    -   Instantiates `PrismaGoalRepository`.
    -   Instantiates Services (`ArchiveGoal`, etc.).
- [x] **Update Consumers:** 
    -   Update `apps/api/src/main.ts` to instantiate `GoalModule`.
    -   Refactor `GoalRouter` to accept Services as arguments (Factory Pattern) instead of importing Contianer.

### 3. Refactor Account Module
- [ ] **Clean Application Service:** `RegisterAccount`, `Login`, etc. Remove `AccountContainer`/`AuthContainer` imports.
- [ ] **Create Infra Module:** Create `AccountModule` in `infrastructure-server`.
- [ ] **Update Assembly:** Route `AccountModule` in `apps/api`.

### 4. Refactor Task/Schedule Module
- [ ] **Clean Application Service:** `ScheduleTaskExecutor` and others.
- [ ] **Create Infra Module:** Create `TaskModule`.
- [ ] **Update Assembly:** Route `TaskModule` in `apps/api` and `SchedulerBootstrap`.

### 5. Final Verification
- [ ] Run `pnpm run build` in `apps/api`.
- [ ] Run `pnpm nx graph` to verify dependency direction.

## Technical Guide

**Module Pattern:**
```typescript
export class GoalModule {
    public readonly archiveGoal: ArchiveGoal;
    constructor(prisma: PrismaClient) {
        const repo = new PrismaGoalRepository(prisma);
        this.archiveGoal = new ArchiveGoal(repo);
    }
}
```

**Route Factory Pattern:**
```typescript
export const createGoalRouter = (archiveGoal: ArchiveGoal) => {
    const router = Router();
    router.post('/', (req, res) => archiveGoal.execute(req.body));
    return router;
}
```
