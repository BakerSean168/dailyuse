# Story 2.1: 实现任务列表内存排序逻辑 - GetTasksWithPrioritySorting

## Metadata

- **Epic:** Epic 2 - Intelligent Sorting & UX
- **Story ID:** 2.1
- **Title:** 实现任务列表内存排序逻辑 - GetTasksWithPrioritySorting
- **Status:** ready-for-dev
- **Dependencies:** Stories 1.1 ✓, 1.2 ✓, 1.3 ✓, 1.4 ✓, 1.5 ✓, 1.6 ✓
- **Priority:** HIGH
- **Estimate:** 2-3 days (Implementation + Testing)
- **Owner:** Backend / Application Layer Developer

---

## User Story

**As a** 应用层开发者,
**I want** 在 TaskQueryService 中实现 `getTasksWithPrioritySorting()` 方法，将任务列表按计算得的 priority 分数降序排列,
**So that** API 返回的任务列表已按智能优先级顺序排列。

---

## Acceptance Criteria

### AC1: Service Method Implementation

**Given** PriorityCalculator 已集成在 TaskQueryService 中
**When** 调用 `getTasksWithPrioritySorting(userId: string, sortBy: 'priority' | 'completedAt' = 'priority')`
**Then** 返回该用户的所有活跃任务（status != 'completed'）
**And** 按计算的 priority 分数降序排列（最高优先级在前）

### AC2: Backlog Task Ordering

**Given** 系统中存在 Backlog 任务（无 DueDate）
**When** 调用 `getTasksWithPrioritySorting()`
**Then** Backlog 任务应排在有截止期的任务下方
**And** Backlog 任务之间仍按 importance 权重排序

### AC3: Performance NFR

**Given** TaskQueryService 的 `getTasksWithPrioritySorting()` 已实现
**When** 对 N=100, 500, 1000, 1500, 2000 个活跃任务执行排序
**Then** 响应时间分别不超过 10ms, 20ms, 40ms, 60ms, 100ms
**And** O(n log n) 排序复杂度得到验证

### AC4: Unit Testing

**Given** 测试套件已设置
**When** 开发者运行 `pnpm vitest run task-query.service.spec.ts`
**Then** 单元测试验证排序顺序的正确性（3-5 个典型场景）
**And** 测试覆盖率 >= 90%

### AC5: Integration Testing

**Given** 任务列表 API 已连接到新的排序服务
**When** 前端调用 `GET /api/tasks?accountUuid=xxx`
**Then** 响应包含 priority 字段
**And** 任务列表已按 priority 降序排列

---

## Brownfield Context

### Current State Analysis

**File:** [packages/application-server/src/task/services/task-query.service.ts](packages/application-server/src/task/services/task-query.service.ts)

✅ **Existing Implementations to Leverage:**
- `TaskQueryService` class already exists with DI support
- Singleton pattern via `getInstance()` / `createInstance()`
- `enrichWithPriority()` helper function for single task
- `enrichMultipleWithPriority()` batch enrichment function
- `extractDueDate()` helper to resolve task dueDate
- Repository interfaces: `ITaskTemplateRepository`, `ITaskInstanceRepository`

✅ **Existing Query Methods (Pattern Reference):**
- `getTaskTemplateWithPriority()` - single task with priority
- `listTaskTemplatesWithPriority()` - all templates with priority
- `listTaskTemplatesByStatusWithPriority()` - filter by status
- `getTaskInstancesByDateRangeWithPriority()` - date range queries
- `getTaskInstanceWithPriority()` - single instance with priority

⚠️ **What's Missing:**
- **NO dedicated sorting service yet.** Current methods only enrich with priority, but don't perform advanced sorting/filtering.
- **No `getTasksWithPrioritySorting()` method** - need to add this new public method
- **No filtering by status in the existing implementation** - must add active-task filtering

**File:** [packages/application-server/src/task/services/list-task-templates.ts](packages/application-server/src/task/services/list-task-templates.ts)

✅ **Reference Pattern:**
- Service instantiation pattern with DI
- QueryRequest/Response DTOs from @dailyuse/contracts/task
- Example of filtering/querying logic

---

## Refactoring Strategy

### Decision: Extend TaskQueryService

**Option A (Chosen):** Extend `TaskQueryService` with new sorting method
- **Rationale:** TaskQueryService already handles all query/enrichment logic; natural place for sorting
- **Benefit:** No duplication; uses existing repositories and enrichment utilities
- **Trade-off:** TaskQueryService class will have ~400 lines after Story 2.1

**Option B (Rejected):** Create separate TaskSortingService
- **Rationale:** Would introduce another service layer
- **Downside:** Requires orchestrating two services; more boilerplate
- **Why Rejected:** QueryService should own all query/enrichment logic

---

## Task Breakdown

### Task 2.1.1: Add `getTasksWithPrioritySorting()` Method

**Objective:** Implement core sorting method in TaskQueryService

**Implementation Details:**

```typescript
/**
 * 获取按优先级排序的活跃任务列表
 * 
 * 逻辑：
 * 1. 查询所有活跃任务（status != COMPLETED）
 * 2. 为每个任务计算优先级分数
 * 3. 按 priority 降序排列（最高在前）
 * 4. 自动将 Backlog 任务（无 DueDate）排在有截止期的任务下方
 * 
 * 性能特性：
 * - O(n log n) 排序复杂度（JavaScript Array.sort()）
 * - <100ms for 2000 tasks on modern hardware
 * 
 * @param accountUuid 账户 UUID
 * @param sortBy 排序字段（'priority' | 'completedAt'）
 * @param currentTime 当前时间（用于优先级计算）
 * @returns 排序后的任务 DTO 数组，包含 priority 字段
 */
async getTasksWithPrioritySorting(
  accountUuid: string,
  sortBy: 'priority' | 'completedAt' = 'priority',
  currentTime: Date = new Date(),
): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
  // Step 1: 获取所有活跃任务（status != COMPLETED）
  const activeStatuses = [
    TaskTemplateStatus.ACTIVE,
    TaskTemplateStatus.PAUSED,
    // 如有其他活跃状态，加入此处
  ];
  
  const templates: TaskTemplate[] = [];
  for (const status of activeStatuses) {
    const byStatus = await this.templateRepository.findByStatus(accountUuid, status);
    templates.push(...byStatus);
  }
  
  // Step 2: 转换为 DTO 并计算优先级
  const dtos = templates.map((t) => t.toServerDTO());
  const enriched = enrichMultipleWithPriority(dtos, currentTime);
  
  // Step 3: 按排序字段排序
  if (sortBy === 'priority') {
    return this.sortByPriority(enriched);
  } else if (sortBy === 'completedAt') {
    return this.sortByCompletedAt(enriched);
  }
  
  return enriched;
}

/**
 * 按优先级分数降序排列，Backlog 任务排在最后
 * 
 * 排序规则：
 * 1. 有 DueDate 的任务优先
 * 2. 按 priority 分数降序排列
 * 3. Backlog 任务（无 DueDate）排在最后
 * 4. Backlog 任务内部按 importance 权重排序
 * 
 * @param dtos 包含 priority 字段的 DTO 数组
 * @returns 排序后的数组
 */
private sortByPriority(
  dtos: Array<TaskTemplateServerDTO & { priority: number }>,
): Array<TaskTemplateServerDTO & { priority: number }> {
  return dtos.sort((a, b) => {
    const aHasDueDate = a.dueDate != null;
    const bHasDueDate = b.dueDate != null;
    
    // 优先级 1: 有 DueDate 的任务排在前
    if (aHasDueDate && !bHasDueDate) return -1;
    if (!aHasDueDate && bHasDueDate) return 1;
    
    // 优先级 2: 按 priority 分数降序排列
    return b.priority - a.priority;
  });
}

/**
 * 按完成时间排序
 * 用于存档视图或其他需求
 * 
 * @param dtos DTO 数组
 * @returns 按 completedAt 降序排列的数组
 */
private sortByCompletedAt(
  dtos: Array<TaskTemplateServerDTO & { priority: number }>,
): Array<TaskTemplateServerDTO & { priority: number }> {
  return dtos.sort((a, b) => {
    const aTime = a.completedAt || 0;
    const bTime = b.completedAt || 0;
    return bTime - aTime;
  });
}
```

**Code Location:** `packages/application-server/src/task/services/task-query.service.ts`

**Dependencies:**
- `TaskTemplateStatus` enum (from @dailyuse/contracts/task)
- `enrichMultipleWithPriority()` (already exists in same file)
- `ITaskTemplateRepository` (already injected)

---

### Task 2.1.2: Unit Tests - Core Sorting Logic

**Objective:** Verify sort order correctness for various task scenarios

**Test File:** `packages/application-server/src/task/services/task-query.service.spec.ts`

**Test Scenarios:**

1. **Test Case 2.1.2.1: Sort by Priority - Normal Case**
   - Setup:
     - Task A: importance=Vital, dueDate=tomorrow, expected_priority=85
     - Task B: importance=Moderate, dueDate=next_week, expected_priority=55
     - Task C: importance=Important, dueDate=today, expected_priority=95
   - Execute: `getTasksWithPrioritySorting(accountUuid)`
   - Verify: C > A > B (priority 95 > 85 > 55)

2. **Test Case 2.1.2.2: Backlog Tasks at Bottom**
   - Setup:
     - Task A: importance=Vital, dueDate=today, priority=95
     - Task B: importance=Vital, dueDate=null (Backlog), priority=50 (due to large TimeRemaining)
     - Task C: importance=Moderate, dueDate=tomorrow, priority=60
   - Execute: `getTasksWithPrioritySorting(accountUuid)`
   - Verify: A(95) > C(60) > B(50) - Backlog at bottom

3. **Test Case 2.1.2.3: Overdue Task Boost**
   - Setup:
     - Task A: importance=Minor, dueDate=yesterday (Overdue), priority=80 (boosted)
     - Task B: importance=Important, dueDate=tomorrow, priority=75
   - Execute: `getTasksWithPrioritySorting(accountUuid)`
   - Verify: A(80) > B(75) - Overdue boost applies

4. **Test Case 2.1.2.4: Zero Days Remaining**
   - Setup:
     - Task A: importance=Moderate, dueDate=today_23:59:59, priority=90 (1/TimeRemaining very high)
     - Task B: importance=Important, dueDate=next_week, priority=75
   - Execute: `getTasksWithPrioritySorting(accountUuid)`
   - Verify: A(90) > B(75) - Urgent deadline boost

5. **Test Case 2.1.2.5: Equal Priority - Maintain Insertion Order (Stable Sort)**
   - Setup:
     - Task A: importance=Moderate, dueDate=day_1, priority=60
     - Task B: importance=Moderate, dueDate=day_1 (same due date), priority=60
   - Execute: `getTasksWithPrioritySorting(accountUuid)` (assuming A created before B)
   - Verify: A > B (insertion order maintained via stable sort)

**Test Implementation Template:**

```typescript
describe('TaskQueryService - getTasksWithPrioritySorting', () => {
  let service: TaskQueryService;
  let mockTemplateRepository: ITaskTemplateRepository;
  let mockInstanceRepository: ITaskInstanceRepository;

  beforeEach(() => {
    // Setup mocks
    mockTemplateRepository = {
      findByStatus: vi.fn(),
      // ... other methods
    };
    mockInstanceRepository = { /* ... */ };
    
    service = TaskQueryService.createInstance(
      mockTemplateRepository,
      mockInstanceRepository,
    );
  });

  it('should sort tasks by priority in descending order', async () => {
    // Setup mock data
    const taskA = createMockTaskTemplate({
      importance: ImportanceLevel.VITAL,
      dueDate: tomorrow(),
    });
    const taskB = createMockTaskTemplate({
      importance: ImportanceLevel.MODERATE,
      dueDate: nextWeek(),
    });
    
    mockTemplateRepository.findByStatus.mockResolvedValueOnce([taskB, taskA]); // unsorted input
    
    // Execute
    const result = await service.getTasksWithPrioritySorting(accountUuid);
    
    // Assert
    expect(result[0].priority).toBeGreaterThan(result[1].priority);
    expect(result[0].uuid).toBe(taskA.uuid); // A should be first
  });

  it('should place backlog tasks at the bottom', async () => {
    // Setup: Mix of tasks with and without dueDate
    const withDue = createMockTaskTemplate({
      importance: ImportanceLevel.MODERATE,
      dueDate: tomorrow(),
    });
    const backlog = createMockTaskTemplate({
      importance: ImportanceLevel.VITAL,
      dueDate: null, // Backlog
    });
    
    mockTemplateRepository.findByStatus.mockResolvedValueOnce([backlog, withDue]);
    
    // Execute
    const result = await service.getTasksWithPrioritySorting(accountUuid);
    
    // Assert
    expect(result[0].uuid).toBe(withDue.uuid);
    expect(result[1].uuid).toBe(backlog.uuid);
  });

  // ... additional test cases
});
```

**Coverage Target:** >= 90%

---

### Task 2.1.3: Performance Benchmark Tests

**Objective:** Verify that sorting meets NFR performance targets

**Test File:** `packages/application-server/src/task/services/task-query.service.perf.spec.ts`

**Benchmark Scenarios:**

| Task Count | Target Time | Verification Method |
|------------|------------|---------------------|
| 100        | < 10ms     | `performance.now()` |
| 500        | < 20ms     | `performance.now()` |
| 1000       | < 40ms     | `performance.now()` |
| 1500       | < 60ms     | `performance.now()` |
| 2000       | < 100ms    | `performance.now()` |

**Implementation Template:**

```typescript
describe('TaskQueryService - Performance', () => {
  let service: TaskQueryService;

  it('should sort 2000 tasks in < 100ms', async () => {
    const largeTaskSet = generateMockTasks(2000); // Random priorities, dates
    mockTemplateRepository.findByStatus.mockResolvedValue(largeTaskSet);
    
    const startTime = performance.now();
    const result = await service.getTasksWithPrioritySorting(accountUuid);
    const endTime = performance.now();
    
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
    expect(result).toHaveLength(2000);
    console.log(`✅ Sorted 2000 tasks in ${elapsedMs.toFixed(2)}ms`);
  });

  // ... additional benchmarks for 100, 500, 1000, 1500 tasks
});
```

**Expected Output:**
```
✅ Sorted 100 tasks in 2.15ms
✅ Sorted 500 tasks in 8.43ms
✅ Sorted 1000 tasks in 18.92ms
✅ Sorted 1500 tasks in 42.37ms
✅ Sorted 2000 tasks in 67.89ms
```

---

### Task 2.1.4: Integration Test - HTTP Endpoint

**Objective:** Verify that the new sorting method integrates with API layer

**Test File:** `apps/api/src/routes/tasks.integration.spec.ts`

**Test Scenario:**

```typescript
describe('GET /api/tasks - With Sorting', () => {
  it('should return sorted tasks via HTTP', async () => {
    // Setup: Create test tasks with various importance/dueDate
    const testAccountUuid = 'test-account-123';
    const task1 = await createTask({ importance: ImportanceLevel.VITAL, dueDate: today });
    const task2 = await createTask({ importance: ImportanceLevel.MINOR, dueDate: nextWeek });
    
    // Execute: GET /api/tasks
    const response = await request(app)
      .get('/api/tasks')
      .query({ accountUuid: testAccountUuid })
      .expect(200);
    
    // Assert
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].priority).toBeGreaterThan(response.body.data[1].priority);
    expect(response.body.data[0].uuid).toBe(task1.uuid); // VITAL task first
  });
});
```

---

### Task 2.1.5: Update API Response Contract

**Objective:** Document new sorting parameters and ensure API compliance

**Files to Update:**

1. **packages/contracts/src/modules/task/queries.ts** (or similar)
   - Add `QueryTasksWithSortingRequest` type
   - Add `sortBy` parameter: `'priority' | 'completedAt'`

```typescript
export interface QueryTasksWithSortingRequest {
  accountUuid: string;
  sortBy?: 'priority' | 'completedAt'; // default: 'priority'
  status?: TaskTemplateStatus[]; // optional filter
}

export type TasksWithSortingResponse = {
  ok: true;
  data: Array<TaskTemplateServerDTO & { priority: number }>;
  meta: {
    count: number;
    sortedBy: 'priority' | 'completedAt';
  };
} | {
  ok: false;
  error: string;
};
```

2. **OpenAPI/Swagger Documentation** (if applicable)
   - Document `GET /api/tasks` response includes `priority` field
   - Document `sortBy` query parameter

---

### Task 2.1.6: Documentation & Code Comments

**Objective:** Ensure code maintainability and developer onboarding

**Requirements:**

1. ✅ JSDoc comments on `getTasksWithPrioritySorting()` method
2. ✅ Inline comments explaining sort logic (Backlog handling, priority boost)
3. ✅ README update in [packages/application-server/README.md](packages/application-server/README.md)
   - Document new `getTasksWithPrioritySorting()` method
   - Explain sort order behavior (priority > completedAt)
   - Note performance characteristics

**Example Documentation:**

```markdown
### Task Query Service - Sorting

#### getTasksWithPrioritySorting(accountUuid, sortBy='priority', currentTime)

Returns all active tasks for a user, sorted by priority or other criteria.

**Sort Behavior (sortBy='priority'):**
- Tasks are sorted by calculated priority score in descending order
- Tasks with due dates appear before backlog tasks (no due date)
- Within each group, higher priority scores appear first
- Backlog tasks are sorted by importance weight internally

**Performance:**
- O(n log n) time complexity (JavaScript Array.sort)
- Processes 2000 tasks in ~70ms on modern hardware
- Suitable for real-time list queries

**Example:**
```typescript
const tasks = await queryService.getTasksWithPrioritySorting(accountUuid);
// Returns: [{ uuid, title, priority: 95 }, { uuid, title, priority: 82 }, ...]
```

---

## Dev Notes

### Priority Calculation Reminder

**Formula (from Story 1.3):**
```
Priority = (Importance * 0.6) + ((1 / TimeRemaining) * 0.4)

Where:
- Importance: 5 (Vital), 4 (Important), 3 (Moderate), 2 (Minor), 1 (Trivial)
- TimeRemaining: Days until due date (e.g., 7 days remaining = 1/7 ≈ 0.14)
- Backlog adjustment: TimeRemaining = 999999 (very large)
- Overdue adjustment: +50 bonus to final priority
- Result: Clamped to [0, 100]
```

### Repository Pattern

Both repositories already implement the required methods:
- `findByStatus(accountUuid, status)` - fetches tasks by status
- `findByUuid(uuid)` - single task lookup

No changes needed to repositories.

### Sorting Stability

JavaScript's `Array.sort()` is **not guaranteed stable** in all engines (though modern engines typically are). For this use case, insertion order doesn't matter since we're sorting by clear numeric criteria (priority). However, if stable sort is needed:

```typescript
// Option: Use stable sort library if needed
import { stableSort } from 'some-lib'; // if required
const sorted = stableSort(dtos, (a, b) => b.priority - a.priority);
```

**Recommendation:** Use native Array.sort() for now. If stability becomes important, revisit this.

### Testing Utilities

Reuse existing test helpers:
- `createMockTaskTemplate()` - available in test-utils
- `generateMockTasks(count)` - may need to create if not exists

---

## Acceptance Validation Checklist

- [ ] **AC1 Validation:** `getTasksWithPrioritySorting()` returns active tasks sorted by priority
- [ ] **AC2 Validation:** Backlog tasks (no dueDate) appear below tasks with due dates
- [ ] **AC3 Validation:** Performance tests confirm <100ms for 2000 tasks
- [ ] **AC4 Validation:** Unit tests cover 5+ scenarios with >=90% coverage
- [ ] **AC5 Validation:** HTTP GET /api/tasks returns sorted list with priority field
- [ ] **Code Review:** Peer review confirms code quality and compliance with Clean Architecture
- [ ] **Merge to Main:** All tests passing, PR approved, merged to main branch

---

## Related Stories & Dependencies

**Prerequisite (All Complete ✅):**
- Story 1.1: Update Task Entity ✓
- Story 1.2: Create PriorityCalculator ✓
- Story 1.3: Implement Algorithm ✓
- Story 1.4: Update TaskDTO ✓
- Story 1.5: Application Layer Integration ✓
- Story 1.6: Database Migration ✓

**Downstream (Blocked by this story):**
- Story 2.2: Frontend API Integration (depends on this service)
- Story 2.5: Backend API Parameter Support (may extend this service)

---

## Commit Strategy

### Commit 1: Add Core Sorting Method
```
feat(task): implement getTasksWithPrioritySorting method

- Add getTasksWithPrioritySorting() to TaskQueryService
- Implement sortByPriority() with backlog handling
- Implement sortByCompletedAt() alternative sort
```

### Commit 2: Add Unit Tests
```
test(task): add unit tests for getTasksWithPrioritySorting

- Cover 5+ test scenarios (normal, backlog, overdue, etc.)
- Achieve >=90% coverage for new code
```

### Commit 3: Add Performance Benchmarks
```
perf(task): add performance benchmarks for sorting

- Test sorting 100-2000 tasks
- Verify <100ms for 2000 tasks target
```

### Commit 4: Update Contracts & Documentation
```
docs(task): update contracts and documentation for sorting

- Add QueryTasksWithSortingRequest type
- Update API contract documentation
- Update TaskQueryService README
```

---

## References

- [Task Priority Calculation Algorithm](Story 1.3)
- [TaskQueryService Implementation](packages/application-server/src/task/services/task-query.service.ts)
- [TaskTemplate Repository Pattern](packages/infrastructure-server/src/task/repositories/task-template.repository.ts)
- [Project Architecture Guide](docs/architecture/clean-architecture.md)

---

## Sign-Off

**Created by:** SM Agent (Sprint Planning)
**Date:** 2026-01-16
**Status:** READY FOR DEVELOPMENT
**Next Step:** Assign to Developer → Implement Story 2.1 → Merge to main
