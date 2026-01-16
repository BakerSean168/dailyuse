# Story 2.2: 前端 API 集成 - 获取排序后的任务列表

## Metadata

- **Epic:** Epic 2 - Intelligent Sorting & UX
- **Story ID:** 2.2
- **Title:** 前端 API 集成 - 获取排序后的任务列表
- **Status:** ready-for-dev
- **Dependencies:** Story 2.1 ✓
- **Priority:** HIGH
- **Estimate:** 2 days (Web + Desktop + Testing)
- **Owner:** Frontend Developer (Web & Desktop)

---

## User Story

**As a** 前端开发者（Web/Desktop）,
**I want** 前端应用调用更新后的 GET /tasks API，接收包含 `priority` 字段的任务列表,
**So that** 前端可以直接基于 API 返回的顺序展示任务，无需前端二次排序。

---

## Acceptance Criteria

### AC1: API Response Parsing

**Given** 后端 API 已实现 priority 计算和排序 (Story 2.1)
**When** 前端发起 `GET /tasks?accountUuid=xxx`
**Then** 响应体包含任务列表，每个任务含 `priority: number`（0-100）
**And** 前端成功解析新的 TaskDTO 结构（importance + priority 字段）

### AC2: Task Ordering Display

**Given** API 返回按 priority 降序排列的任务
**When** 前端加载任务列表
**Then** 任务列表已按 priority 降序排列展示
**And** 用户在 UI 上看到的顺序与 API 返回顺序一致

### AC3: Type Safety

**Given** TypeScript 开发环境
**When** 编译前端代码
**Then** TaskDTO 类型定义包含 `priority: number` 字段
**And** 所有引用 priority 字段的代码无类型错误

### AC4: Web Application Integration

**Given** Web 应用代码在 `apps/web/`
**When** 运行 `pnpm dev` (Web)
**Then** 任务列表页面正确显示排序后的任务
**And** 无控制台错误或警告

### AC5: Desktop Application Integration

**Given** Desktop 应用代码在 `apps/desktop/`
**When** 运行 `pnpm start:dev` (Desktop)
**Then** 任务列表页面正确显示排序后的任务
**And** 无 IPC 通信错误

### AC6: Integration Testing

**Given** 测试套件已设置
**When** 运行集成测试
**Then** Web 应用测试通过（任务顺序正确）
**And** Desktop 应用测试通过（任务顺序正确）
**And** 测试覆盖至少 3 个常见场景（优先级排序、Backlog 处理、重要性分组）

---

## Brownfield Context

### Web Application

**File:** [apps/web/src/modules/task/infrastructure/api/taskApiClient.ts](apps/web/src/modules/task/infrastructure/api/taskApiClient.ts)

✅ **Existing API Client Methods:**
- `getTaskTemplates(params?)` - fetches task list with optional params
- Supports filtering by status, importance, urgency, tags
- Returns `TaskTemplateClientDTO[]`

✅ **Existing Store:**
- File: [apps/web/src/modules/task/presentation/stores/taskStore.ts](apps/web/src/modules/task/presentation/stores/taskStore.ts)
- Pinia store for task state management
- Methods: `getAllTaskTemplates()`, `getTaskTemplateByUuid()`, etc.
- Supports caching and loading states

⚠️ **What's Missing:**
- No type definition for `priority` field in current TaskTemplateClientDTO
- `getTaskTemplates()` doesn't explicitly support `sortBy` parameter
- Store doesn't have dedicated getters for priority-sorted tasks

**File:** [apps/web/src/modules/task/presentation/components/](apps/web/src/modules/task/presentation/components/)

✅ **Existing Components:**
- `TaskTemplateManagement.vue` - task list display
- Various card and widget components for rendering tasks

⚠️ **Updates Needed:**
- May need to display `priority` field in task cards
- May need to add visual indicators for priority (color, icon)

---

### Desktop Application

**File:** [apps/desktop/src/renderer/modules/task/infrastructure/](apps/desktop/src/renderer/modules/task/infrastructure/)

✅ **Existing API Integration:**
- Similar structure to Web app
- IPC-based communication with main process
- Task application services

⚠️ **What's Missing:**
- Need to verify compatibility with new `priority` field
- May need updates to IPC handlers if they transform data

---

## Refactoring Strategy

### Decision: Update Existing API Clients

**Option A (Chosen):** Update existing `taskApiClient.ts` methods
- **Rationale:** Minimal changes to existing code; backward compatible
- **Benefit:** Existing methods automatically get priority field
- **Trade-off:** Don't need to create new API methods

**Option B (Rejected):** Create new `getTasksWithPriority()` method
- **Rationale:** Explicit separation of concerns
- **Downside:** More boilerplate; confusing to have two similar methods

---

## Task Breakdown

### Task 2.2.1: Update TaskDTO Type Definitions

**Objective:** Ensure `priority` field is properly typed across Web and Desktop

**Implementation Details:**

```typescript
// File: packages/contracts/src/modules/task/aggregates/task-template-client-dto.ts

/**
 * Task Template Client DTO
 * 客户端视图模型 - 包含 priority 计算字段
 */
export interface TaskTemplateClientDTO {
  // ... existing fields ...
  
  /**
   * Importance Level (用户输入)
   * 5-level enum: Vital (5), Important (4), Moderate (3), Minor (2), Trivial (1)
   */
  importance: ImportanceLevel;
  
  /**
   * Calculated Priority Score (READ-ONLY, computed at runtime)
   * 范围: [0, 100]
   * 计算公式: Importance * 0.6 + (1/TimeRemaining) * 0.4 + OverdueBonus
   * 
   * @readonly - 不可直接修改，由后端计算提供
   */
  priority: number;
  
  // ... other fields ...
}
```

**Type Files to Update:**
1. [packages/contracts/src/modules/task/aggregates/task-template-client-dto.ts](packages/contracts/src/modules/task/aggregates/task-template-client-dto.ts)
2. [packages/contracts/src/modules/task/aggregates/task-instance-client-dto.ts](packages/contracts/src/modules/task/aggregates/task-instance-client-dto.ts)

**Verification:**
```bash
# Ensure types compile without errors
cd packages/contracts
pnpm tsc --noEmit
```

---

### Task 2.2.2: Update Web Application API Client

**Objective:** Ensure Web app correctly parses priority field from API response

**File:** [apps/web/src/modules/task/infrastructure/api/taskApiClient.ts](apps/web/src/modules/task/infrastructure/api/taskApiClient.ts)

**Changes:**

```typescript
/**
 * 获取任务模板列表
 * 
 * Story 2.1 Integration: API 现在返回按 priority 排序的任务列表
 * 每个任务包含计算得的 priority 字段 (0-100)
 */
async getTaskTemplates(params?: {
  page?: number;
  limit?: number;
  status?: string;
  folderUuid?: string;
  goalUuid?: string;
  importance?: string;
  urgency?: string; // 已弃用，但保留向后兼容
  tags?: string[];
  sortBy?: 'priority' | 'completedAt'; // NEW: Story 2.1 support
}): Promise<TaskTemplateClientDTO[]> {
  // Add sortBy param to API call if Story 2.5 implemented
  const data = await apiClient.get(this.baseUrl, { params });
  return data;
}
```

**Verification:**
- Method returns data with `priority` field
- No type errors in calling code
- API response parsing maintains backward compatibility

---

### Task 2.2.3: Update Web Application Store

**Objective:** Add getters and state management for priority-sorted tasks

**File:** [apps/web/src/modules/task/presentation/stores/taskStore.ts](apps/web/src/modules/task/presentation/stores/taskStore.ts)

**Changes:**

```typescript
export const useTaskStore = defineStore('task', {
  // ... existing state ...
  
  getters: {
    // ... existing getters ...
    
    /**
     * 获取按优先级排序的任务模板
     * Story 2.1: 任务已由后端按 priority 降序排列
     * 
     * @returns 按 priority 降序排列的 TaskTemplate 数组
     */
    getTaskTemplatesSortedByPriority(state): TaskTemplate[] {
      // 后端已按 priority 降序返回，直接返回
      // 如果需要客户端端再排一次（用于离线场景），可以添加排序逻辑
      return state.taskTemplates as TaskTemplate[];
    },
    
    /**
     * 获取按优先级分组的任务模板
     * 分组: 高优先级 (>=80) | 中优先级 (60-79) | 低优先级 (<60)
     * 
     * @returns { high: [], medium: [], low: [] }
     */
    getTaskTemplatesByPriorityGroup(state) {
      return {
        high: state.taskTemplates.filter((t) => (t as any).priority >= 80),
        medium: state.taskTemplates.filter((t) => (t as any).priority >= 60 && (t as any).priority < 80),
        low: state.taskTemplates.filter((t) => (t as any).priority < 60),
      };
    },
  },
  
  actions: {
    /**
     * 加载任务列表 (Story 2.1 集成)
     * 
     * 流程:
     * 1. 调用 API 获取任务列表 (已按 priority 排序)
     * 2. 转换为 TaskTemplate 实体
     * 3. 存储到 state
     * 
     * @param options 查询选项 (status, importance, etc.)
     */
    async loadTaskTemplates(options?: {
      status?: string;
      importance?: string;
      tags?: string[];
    }) {
      this.isLoading = true;
      try {
        const client = new TaskTemplateApiClient();
        const dtos = await client.getTaskTemplates(options);
        
        // 转换为实体对象
        this.taskTemplates = dtos.map((dto) =>
          TaskTemplate.fromClientDTO(dto)
        );
        
        this.isInitialized = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
```

**Key Points:**
- Store getters assume tasks are already sorted by backend
- Add grouping getter for UI visualization (optional)
- Action method signature compatible with existing code

---

### Task 2.2.4: Update Web Application Components

**Objective:** Display priority-sorted tasks in UI without additional sorting logic

**File:** [apps/web/src/modules/task/presentation/components/TaskTemplateManagement.vue](apps/web/src/modules/task/presentation/components/TaskTemplateManagement.vue)

**Expected Changes:**

```vue
<template>
  <div class="task-list">
    <!-- Display sorted task list (already sorted by API) -->
    <div
      v-for="task in taskStore.getTaskTemplatesSortedByPriority"
      :key="task.uuid"
      class="task-item"
      :class="getPriorityClass(task.priority)"
    >
      <div class="task-header">
        <h3>{{ task.title }}</h3>
        <span class="priority-badge">{{ Math.round(task.priority) }}</span>
      </div>
      <p>{{ task.description }}</p>
      <span class="importance-tag">{{ task.importance }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '../../stores/taskStore';

const taskStore = useTaskStore();

/**
 * 根据 priority 分数返回 CSS 类名
 * 用于视觉指示优先级
 */
function getPriorityClass(priority: number): string {
  if (priority >= 80) return 'priority-high';
  if (priority >= 60) return 'priority-medium';
  return 'priority-low';
}
</script>

<style scoped>
.priority-high {
  border-left: 4px solid #ef4444; /* red */
  background: rgba(239, 68, 68, 0.05);
}

.priority-medium {
  border-left: 4px solid #f59e0b; /* yellow */
  background: rgba(245, 158, 11, 0.05);
}

.priority-low {
  border-left: 4px solid #9ca3af; /* gray */
  background: rgba(156, 163, 175, 0.05);
}
</style>
```

**Notes:**
- Component uses `taskStore.getTaskTemplatesSortedByPriority` (already sorted)
- NO client-side re-sorting of task list
- Visual priority indicators based on priority score

---

### Task 2.2.5: Update Desktop Application

**Objective:** Ensure Desktop app also integrates priority field correctly

**Files to Update:**
1. [apps/desktop/src/renderer/modules/task/infrastructure/](apps/desktop/src/renderer/modules/task/infrastructure/)
2. [apps/desktop/src/renderer/modules/task/presentation/](apps/desktop/src/renderer/modules/task/presentation/)

**Changes Similar to Web:**
- Update API client to handle `priority` field
- Update React state management to store sorted tasks
- Update task list components to display priority-sorted results
- Ensure no client-side re-sorting

**Specific Implementation:**
```typescript
// apps/desktop/src/renderer/modules/task/application/TaskListApplicationService.ts (or similar)

/**
 * 加载任务列表 (Story 2.1 集成)
 * Desktop 应用使用 IPC 通信
 */
async loadTaskList(): Promise<TaskTemplate[]> {
  try {
    // IPC call to main process -> Backend API
    const dtos = await window.ipcRenderer.invoke('task:list', {
      // params
    });
    
    // Convert DTOs to domain models
    return dtos.map((dto) => TaskTemplate.fromClientDTO(dto));
  } catch (error) {
    console.error('Failed to load task list:', error);
    throw error;
  }
}
```

---

### Task 2.2.6: Update Type Definitions (Web & Desktop)

**Objective:** Ensure both applications use correct TaskDTO types

**Verification Steps:**

1. **Check Web Types:**
```bash
cd apps/web
pnpm tsc --noEmit
```

2. **Check Desktop Types:**
```bash
cd apps/desktop
pnpm tsc --noEmit
```

3. **Verify TaskDTO contains priority:**
```bash
# Search for TaskTemplateClientDTO definition
grep -r "priority.*number" packages/contracts/src/
```

---

### Task 2.2.7: Web Application Integration Tests

**Objective:** Verify Web app correctly displays sorted tasks

**Test File:** `apps/web/src/modules/task/presentation/stores/taskStore.spec.ts`

**Test Scenarios:**

1. **Test Case 2.2.7.1: Load Tasks with Priority Field**
   ```typescript
   describe('Task Store - Priority Integration', () => {
     it('should load tasks with priority field from API', async () => {
       // Mock API response with priority field
       const mockResponse = [
         {
           uuid: '1',
           title: 'Task A',
           priority: 95,
           importance: ImportanceLevel.VITAL,
           dueDate: tomorrow,
         },
         {
           uuid: '2',
           title: 'Task B',
           priority: 55,
           importance: ImportanceLevel.MODERATE,
           dueDate: nextWeek,
         },
       ];
       
       mockApiClient.getTaskTemplates.mockResolvedValue(mockResponse);
       
       // Load tasks
       await store.loadTaskTemplates();
       
       // Verify
       expect(store.taskTemplates).toHaveLength(2);
       expect(store.taskTemplates[0].priority).toBe(95); // First task has higher priority
     });
   });
   ```

2. **Test Case 2.2.7.2: Priority Sorting Getter**
   ```typescript
   it('should return tasks sorted by priority via getter', async () => {
     // Setup: Load unsorted mock data
     const unsorted = [
       { uuid: '1', priority: 55, ... },
       { uuid: '2', priority: 95, ... },
       { uuid: '3', priority: 75, ... },
     ];
     
     store.taskTemplates = unsorted.map((d) => TaskTemplate.fromClientDTO(d));
     
     // Execute: Call getter
     const sorted = store.getTaskTemplatesSortedByPriority;
     
     // Assert: Should be already sorted by backend, so same order
     expect(sorted[0].priority).toBe(55); // 后端已排序，前端不需要再排
   });
   ```

3. **Test Case 2.2.7.3: Priority Grouping Getter**
   ```typescript
   it('should group tasks by priority level', () => {
     // Setup tasks with different priority levels
     const tasks = [
       { uuid: '1', priority: 95, ... }, // high
       { uuid: '2', priority: 65, ... }, // medium
       { uuid: '3', priority: 45, ... }, // low
     ];
     
     store.taskTemplates = tasks.map((d) => TaskTemplate.fromClientDTO(d));
     
     // Execute
     const grouped = store.getTaskTemplatesByPriorityGroup;
     
     // Assert
     expect(grouped.high).toHaveLength(1);
     expect(grouped.medium).toHaveLength(1);
     expect(grouped.low).toHaveLength(1);
   });
   ```

---

### Task 2.2.8: Desktop Application Integration Tests

**Objective:** Verify Desktop app correctly displays sorted tasks via IPC

**Test File:** `apps/desktop/src/renderer/modules/task/application/__tests__/TaskListApplicationService.spec.ts`

**Test Scenarios:**

1. **Test Case 2.2.8.1: IPC Task List Loading**
   ```typescript
   describe('Desktop TaskListApplicationService - IPC', () => {
     it('should load sorted tasks via IPC', async () => {
       const mockTasks = [
         { uuid: '1', title: 'Task A', priority: 95 },
         { uuid: '2', title: 'Task B', priority: 55 },
       ];
       
       mockIpcRenderer.invoke.mockResolvedValue(mockTasks);
       
       const service = new TaskListApplicationService();
       const result = await service.loadTaskList();
       
       expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('task:list', expect.any(Object));
       expect(result).toHaveLength(2);
       expect(result[0].priority).toBe(95);
     });
   });
   ```

---

### Task 2.2.9: E2E Testing

**Objective:** Verify both Web and Desktop apps work with priority field in real scenario

**Test Framework:** Vitest + Playwright (for Web), Electron Spectron (for Desktop)

**Web E2E Test:**
```typescript
describe('Web App - Task List E2E', () => {
  it('should display tasks sorted by priority', async () => {
    // Setup: Start dev server with mock backend
    // Navigate to task list page
    // Verify task order matches priority: Task A (95) > Task B (55)
    // Verify priority badges displayed
  });
});
```

**Desktop E2E Test:**
```typescript
describe('Desktop App - Task List E2E', () => {
  it('should display tasks sorted by priority via IPC', async () => {
    // Setup: Launch Electron app with mock IPC handlers
    // Navigate to task list view
    // Verify task order matches priority
    // Verify no IPC errors in DevTools console
  });
});
```

---

### Task 2.2.10: Documentation & Migration Guide

**Objective:** Document API changes and provide migration guide for developers

**File:** [docs/MIGRATION-PRIORITY-REFACTOR.md](docs/MIGRATION-PRIORITY-REFACTOR.md)

**Content:**

```markdown
# Task Priority Refactor - Frontend Migration Guide

## Overview
This guide helps frontend developers migrate to the new priority-based task sorting system (Story 2.2).

## What Changed?

### New Fields
- **`priority: number`** (computed, read-only)
  - Range: [0, 100]
  - Calculated by backend
  - Provided in all TaskDTO responses

- **`importance: ImportanceLevel`** (user input)
  - 5 levels: Vital, Important, Moderate, Minor, Trivial
  - Replaces old `urgency` and `priority` input fields

### Removed Fields
- `urgency` (if present, will be removed by Story 1.6 migration)
- Old `priority` input field (computed field now)

## Web App Migration

### 1. Update Store Usage
```typescript
// OLD: No getter for sorted tasks
const allTasks = store.taskTemplates;

// NEW: Use priority-sorted getter
const sortedTasks = store.getTaskTemplatesSortedByPriority;
```

### 2. Update Components
```vue
<!-- OLD: Manual sorting in template -->
<template v-for="task in sortByPriority(tasks)">

<!-- NEW: Use store getter (tasks already sorted) -->
<template v-for="task in taskStore.getTaskTemplatesSortedByPriority">
```

### 3. Display Priority
```vue
<!-- Add priority badge to task item -->
<span class="priority">{{ Math.round(task.priority) }}/100</span>
```

## Desktop App Migration

Similar changes apply to Desktop application.

## Testing Checklist

- [ ] Tasks load successfully from API
- [ ] Tasks display in priority order (highest to lowest)
- [ ] Priority field rendered correctly
- [ ] Backlog tasks (no due date) appear at bottom
- [ ] No console errors

## Rollback Plan

If issues arise, revert Story 2.2 and keep using old sorting logic on frontend.
```

---

## Dev Notes

### API Response Structure

**Before (Story 1.5):**
```json
{
  "ok": true,
  "data": [
    {
      "uuid": "task-1",
      "title": "Important Task",
      "importance": "VITAL",
      "priority": 95,
      "dueDate": 1705334400000
    },
    {
      "uuid": "task-2",
      "title": "Regular Task",
      "importance": "MODERATE",
      "priority": 55,
      "dueDate": 1705600000000
    }
  ]
}
```

**After (Story 2.1):**
- Same structure
- **Key change:** Tasks are **already sorted by priority** (descending)
- Frontend no longer needs client-side sorting

### TypeScript Compilation

Ensure types compile without errors:
```bash
# Web
cd apps/web
pnpm tsc --noEmit

# Desktop
cd apps/desktop
pnpm tsc --noEmit

# Contracts (source of truth)
cd packages/contracts
pnpm tsc --noEmit
```

### No Client-Side Re-sorting

**Important:** Do NOT implement client-side sorting in frontend:
```typescript
// ❌ WRONG: Unnecessary re-sorting
const sorted = tasks.sort((a, b) => b.priority - a.priority);

// ✅ CORRECT: Use API-provided order
const tasks = store.getTaskTemplatesSortedByPriority; // already sorted
```

---

## Acceptance Validation Checklist

- [ ] **AC1 Validation:** API response includes `priority` field, frontend parses it correctly
- [ ] **AC2 Validation:** Task list displays in priority order matching API response
- [ ] **AC3 Validation:** TypeScript compilation passes without errors
- [ ] **AC4 Validation:** Web app runs without console errors
- [ ] **AC5 Validation:** Desktop app runs without IPC errors
- [ ] **AC6 Validation:** Integration tests pass for both Web and Desktop
- [ ] **Code Review:** Peer review confirms frontend integration is correct
- [ ] **Merge to Main:** All tests passing, PR approved

---

## Related Stories & Dependencies

**Prerequisite (Complete ✓):**
- Story 2.1: Implement In-Memory Sorting ✓

**Downstream (Blocked by this story):**
- Story 2.3: Remove Urgency/Priority Input Fields (depends on frontend accepting new DTO structure)
- Story 2.4: Task List Visual Optimization (depends on priority field being displayed)

---

## Commit Strategy

### Commit 1: Update Type Definitions
```
feat(contracts): add priority field to TaskDTO

- Add priority: number field to TaskTemplateClientDTO
- Add priority: number field to TaskInstanceClientDTO
- Mark priority as read-only computed field in JSDoc
```

### Commit 2: Update Web App API Client
```
feat(web/task): update API client for priority field

- Ensure getTaskTemplates() returns tasks with priority
- Add optional sortBy parameter support
```

### Commit 3: Update Web App Store
```
feat(web/task): add priority-sorted getters to store

- Add getTaskTemplatesSortedByPriority getter
- Add getTaskTemplatesByPriorityGroup getter
- Update loadTaskTemplates() action
```

### Commit 4: Update Web App Components
```
feat(web/task): update components for sorted task display

- Update TaskTemplateManagement.vue to use sorted getter
- Add priority badges and visual indicators
- Remove any client-side sorting logic
```

### Commit 5: Update Desktop App
```
feat(desktop/task): add priority field support

- Update IPC handlers to pass priority field
- Update application service and presentation layer
- Add priority badge display
```

### Commit 6: Add Integration Tests
```
test(web): add integration tests for priority field

test(desktop): add integration tests for priority field

- Test API response parsing
- Test store getters
- Test component rendering
```

### Commit 7: Add Documentation
```
docs: add task priority refactor migration guide

- Document API changes
- Provide migration examples
- Add testing checklist
```

---

## References

- [Story 2.1: In-Memory Sorting Logic](2-1-implement-task-list-in-memory-sorting-logic-get-tasks-with-priority-sorting.md)
- [Story 1.5: Application Layer Integration](1-5-integrate-priority-calculation-in-application-layer-task-query-service.md)
- [Web App Architecture](docs/architecture/web-app.md)
- [Desktop App Architecture](docs/architecture/desktop-app.md)

---

## Sign-Off

**Created by:** SM Agent (Sprint Planning)
**Date:** 2026-01-16
**Status:** READY FOR DEVELOPMENT
**Next Step:** Assign to Frontend Developer → Implement Story 2.2 → Merge to main
