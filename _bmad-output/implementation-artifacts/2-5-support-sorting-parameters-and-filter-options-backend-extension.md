# Story 2.5: 支持排序参数和过滤选项 - 后端扩展

## Metadata

- **Epic:** Epic 2 - Intelligent Sorting & UX
- **Story ID:** 2.5
- **Title:** 支持排序参数和过滤选项 - 后端扩展
- **Status:** ready-for-dev
- **Dependencies:** Stories 2.1 ✓, 2.2 ✓
- **Priority:** MEDIUM
- **Estimate:** 2-3 days (Implementation + Testing)
- **Owner:** Backend / API Developer

---

## User Story

**As a** API 设计者,
**I want** 在 GET /tasks API 中支持 `sortBy` 和 `filterBy` 参数，允许用户切换排序方式或按 Importance 过滤,
**So that** 用户在特定场景下可以灵活查看任务（如"仅显示高重要性"或"按截止日期排序"）。

---

## Acceptance Criteria

### AC1: SortBy Parameter Support

**Given** API 接收 `sortBy` 查询参数
**When** 用户调用 `GET /tasks?sortBy=priority|dueDate|createdAt`
**Then** API 返回按指定字段排序的任务列表：
  - **sortBy=priority** (default): 按 priority 降序排列（已由 Story 2.1 实现）
  - **sortBy=dueDate**: 按 dueDate 升序排列；无期限任务排在最后
  - **sortBy=createdAt**: 按创建时间降序排列（最新创建的在前）
  - **sortBy=importance**: 按 importance 值降序排列

### AC2: FilterBy Parameter Support

**Given** API 接收 `filterBy` 查询参数
**When** 用户调用 `GET /tasks?filterBy=importance:high|status:active`
**Then** API 返回符合过滤条件的任务列表：
  - **filterBy=importance:vital**: 仅返回 importance >= Vital 的任务
  - **filterBy=importance:important**: 仅返回 importance >= Important 的任务
  - **filterBy=importance:moderate**: 仅返回 importance >= Moderate 的任务
  - **filterBy=status:active**: 仅返回活跃任务（status != COMPLETED）
  - **filterBy=status:completed**: 仅返回已完成任务
  - **filterBy=dueDate:overdue**: 仅返回已逾期的任务

### AC3: Combined Parameters

**Given** API 接收多个参数的组合
**When** 用户调用 `GET /tasks?sortBy=dueDate&filterBy=importance:high&filterBy=status:active`
**Then** API 返回：
  - 先按 filterBy 过滤（importance >= Important AND status = ACTIVE）
  - 再按 sortBy 排序（按 dueDate 升序）

### AC4: Parameter Validation

**Given** API 接收无效的 sortBy 或 filterBy 参数
**When** 参数值不在允许列表中
**Then** API 返回 400 Bad Request，包含清晰的错误消息：
  ```json
  {
    "ok": false,
    "error": "Invalid sortBy value. Allowed: priority, dueDate, createdAt, importance"
  }
  ```

### AC5: Backward Compatibility

**Given** 现有客户端调用无参数的 GET /tasks
**When** 调用 `GET /tasks`（无 sortBy/filterBy）
**Then** API 返回默认行为：
  - 按 priority 降序排列（Story 2.1 行为）
  - 返回所有活跃任务

### AC6: API Documentation

**Given** API 已发布
**When** 开发者查看 OpenAPI/Swagger 文档
**Then** 文档清晰描述：
  - 所有支持的 sortBy 值和含义
  - 所有支持的 filterBy 值和含义
  - 多个 filterBy 的组合逻辑（AND vs OR）
  - 示例请求和响应

### AC7: Integration Tests

**Given** 新参数已实现
**When** 运行集成测试
**Then** 至少覆盖 3 个常见组合场景：
  1. `sortBy=priority` (default)
  2. `sortBy=dueDate&filterBy=importance:high`
  3. `filterBy=status:active&filterBy=dueDate:overdue` (应该返回空）

---

## Brownfield Context

### Current API State

**File:** [apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts](apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts)

✅ **Current Implementation:**
- GET `/task-templates` endpoint exists
- Supports filtering by: status, folderUuid, goalUuid, tags
- No sortBy parameter support
- No importance-based filtering

✅ **Related Files:**
- TaskTemplateController.ts - handles route logic
- TaskQueryService.ts (from Story 1.5) - has sorting method

⚠️ **What Needs to Change:**
- Add sortBy parameter to GET /task-templates route documentation
- Add filterBy parameters to route documentation
- Implement parameter validation
- Update controller to pass parameters to QueryService

**File:** [apps/api/src/modules/task/application/TaskQueryService.ts](TaskQueryService.ts)

✅ **Already Exists (from Story 2.1):**
- `getTasksWithPrioritySorting()` method (sorts by priority)
- Repository access to fetch tasks
- Priority calculation integration

⚠️ **New Methods Needed:**
- `getTasksSortedBy(accountUuid, sortBy)` - generic sorting by field
- `getTasksFiltered(accountUuid, filters)` - generic filtering
- `getTasksWithSorting AndFiltering(accountUuid, sortBy, filters)` - combined

---

## Refactoring Strategy

### Decision: Extend TaskQueryService with Flexible Sorting/Filtering

**Option A (Chosen):** Add flexible methods to TaskQueryService
- **Rationale:** Keeps query logic centralized; builds on Story 2.1 foundation
- **Benefit:** Reusable methods; clean separation of concerns
- **Trade-off:** TaskQueryService will grow slightly (but still manageable)

**Option B (Rejected):** Create separate TaskFilterService
- **Rationale:** More modular
- **Downside:** Unnecessary abstraction for relatively simple logic

---

## Task Breakdown

### Task 2.5.1: Add sortBy and filterBy Type Definitions

**Objective:** Define valid parameter values as enums/types

**File:** [packages/contracts/src/modules/task/queries.ts](packages/contracts/src/modules/task/queries.ts)

```typescript
/**
 * 任务排序字段
 */
export enum TaskSortBy {
  PRIORITY = 'priority',       // 按优先级降序
  DUE_DATE = 'dueDate',        // 按截止日期升序
  CREATED_AT = 'createdAt',    // 按创建时间降序
  IMPORTANCE = 'importance',   // 按重要性降序
}

/**
 * 任务过滤条件
 * 
 * 格式: 'field:value'
 * 例如: 'importance:vital', 'status:active', 'dueDate:overdue'
 */
export enum TaskFilterBy {
  // Importance-based filters
  IMPORTANCE_VITAL = 'importance:vital',
  IMPORTANCE_IMPORTANT = 'importance:important',
  IMPORTANCE_MODERATE = 'importance:moderate',
  IMPORTANCE_MINOR = 'importance:minor',
  IMPORTANCE_TRIVIAL = 'importance:trivial',
  
  // Status-based filters
  STATUS_ACTIVE = 'status:active',
  STATUS_COMPLETED = 'status:completed',
  STATUS_BLOCKED = 'status:blocked',
  STATUS_CANCELLED = 'status:cancelled',
  
  // Time-based filters
  DUE_DATE_OVERDUE = 'dueDate:overdue',
  DUE_DATE_TODAY = 'dueDate:today',
  DUE_DATE_UPCOMING = 'dueDate:upcoming',      // 未来 7 天
  DUE_DATE_NO_DUE_DATE = 'dueDate:noDueDate',  // 无截止期
}

/**
 * 查询任务列表的请求参数
 */
export interface QueryTasksRequest {
  accountUuid: string;
  sortBy?: TaskSortBy | string;  // 允许字符串以支持新值
  filterBy?: (TaskFilterBy | string)[];  // 多个过滤条件 AND 关系
  page?: number;
  limit?: number;
}

/**
 * 任务列表响应
 */
export interface TasksListResponse {
  ok: boolean;
  data?: Array<TaskTemplateServerDTO & { priority: number }>;
  error?: string;
  meta?: {
    count: number;
    sortedBy: string;
    filteredBy: string[];
  };
}
```

---

### Task 2.5.2: Implement Parameter Validation Utility

**Objective:** Create helper to validate and parse sortBy/filterBy parameters

**File:** [apps/api/src/modules/task/application/TaskQueryValidator.ts](TaskQueryValidator.ts)

```typescript
/**
 * Task Query Parameter Validator
 * 
 * 验证 sortBy 和 filterBy 参数的有效性
 */

import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';

export class TaskQueryValidator {
  /**
   * 有效的 sortBy 值列表
   */
  private static readonly VALID_SORT_BY = [
    TaskSortBy.PRIORITY,
    TaskSortBy.DUE_DATE,
    TaskSortBy.CREATED_AT,
    TaskSortBy.IMPORTANCE,
  ];

  /**
   * 有效的 filterBy 值列表
   */
  private static readonly VALID_FILTER_BY = [
    TaskFilterBy.IMPORTANCE_VITAL,
    TaskFilterBy.IMPORTANCE_IMPORTANT,
    TaskFilterBy.IMPORTANCE_MODERATE,
    TaskFilterBy.IMPORTANCE_MINOR,
    TaskFilterBy.IMPORTANCE_TRIVIAL,
    TaskFilterBy.STATUS_ACTIVE,
    TaskFilterBy.STATUS_COMPLETED,
    TaskFilterBy.STATUS_BLOCKED,
    TaskFilterBy.STATUS_CANCELLED,
    TaskFilterBy.DUE_DATE_OVERDUE,
    TaskFilterBy.DUE_DATE_TODAY,
    TaskFilterBy.DUE_DATE_UPCOMING,
    TaskFilterBy.DUE_DATE_NO_DUE_DATE,
  ];

  /**
   * 验证 sortBy 参数
   * 
   * @param sortBy 排序字段
   * @returns 有效的 sortBy 值或 null
   * @throws ValidationError 如果无效
   */
  static validateSortBy(sortBy?: string): TaskSortBy | null {
    if (!sortBy) return null;

    if (!this.VALID_SORT_BY.includes(sortBy as TaskSortBy)) {
      throw new Error(
        `Invalid sortBy value: "${sortBy}". Allowed values: ${this.VALID_SORT_BY.join(', ')}`
      );
    }

    return sortBy as TaskSortBy;
  }

  /**
   * 验证 filterBy 参数（可能是单个字符串或数组）
   * 
   * @param filterBy 单个过滤条件或数组
   * @returns 有效的 filterBy 值数组
   * @throws ValidationError 如果无效
   */
  static validateFilterBy(filterBy?: string | string[]): TaskFilterBy[] {
    if (!filterBy) return [];

    const filters = Array.isArray(filterBy) ? filterBy : [filterBy];

    for (const filter of filters) {
      if (!this.VALID_FILTER_BY.includes(filter as TaskFilterBy)) {
        throw new Error(
          `Invalid filterBy value: "${filter}". Allowed values: ${this.VALID_FILTER_BY.join(', ')}`
        );
      }
    }

    return filters as TaskFilterBy[];
  }
}
```

---

### Task 2.5.3: Extend TaskQueryService with Sorting/Filtering Methods

**Objective:** Implement flexible sorting and filtering in application layer

**File:** [apps/api/src/modules/task/application/TaskQueryService.ts](TaskQueryService.ts)

**Add New Methods:**

```typescript
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';

export class TaskQueryService {
  // ... existing methods from Story 2.1 ...

  /**
   * 按指定字段和过滤条件查询任务
   * 
   * 流程:
   * 1. 获取所有活跃任务
   * 2. 按过滤条件过滤
   * 3. 按排序字段排序
   * 
   * @param accountUuid 账户 UUID
   * @param sortBy 排序字段 (default: priority)
   * @param filterBy 过滤条件数组 (AND 关系)
   * @param currentTime 当前时间（用于优先级计算和相对日期过滤）
   * @returns 排序和过滤后的任务 DTO 数组
   */
  async getTasksWithSortingAndFiltering(
    accountUuid: string,
    sortBy: TaskSortBy = TaskSortBy.PRIORITY,
    filterBy: TaskFilterBy[] = [],
    currentTime: Date = new Date(),
  ): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
    // Step 1: 获取所有活跃任务
    const templates = await this.getAllActiveTemplates(accountUuid);
    
    // Step 2: 转换为 DTO 并计算优先级
    const dtos = templates.map((t) => t.toServerDTO());
    const enriched = enrichMultipleWithPriority(dtos, currentTime);
    
    // Step 3: 按过滤条件过滤
    let filtered = enriched;
    if (filterBy.length > 0) {
      filtered = this.applyFilters(enriched, filterBy, currentTime);
    }
    
    // Step 4: 按排序字段排序
    return this.applySort(filtered, sortBy, currentTime);
  }

  /**
   * 按过滤条件过滤任务
   * 
   * @param dtos 任务 DTO 数组
   * @param filters 过滤条件
   * @param currentTime 当前时间
   * @returns 过滤后的 DTO 数组
   */
  private applyFilters(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
    filters: TaskFilterBy[],
    currentTime: Date,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    return dtos.filter((dto) => {
      // 所有过滤条件必须满足 (AND 关系)
      return filters.every((filter) => this.matchesFilter(dto, filter, currentTime));
    });
  }

  /**
   * 检查任务是否匹配单个过滤条件
   * 
   * @param dto 任务 DTO
   * @param filter 过滤条件
   * @param currentTime 当前时间
   * @returns true 如果匹配
   */
  private matchesFilter(
    dto: TaskTemplateServerDTO & { priority: number },
    filter: TaskFilterBy,
    currentTime: Date,
  ): boolean {
    if (filter.startsWith('importance:')) {
      const level = filter.split(':')[1];
      return this.matchesImportanceFilter(dto.importance, level);
    }

    if (filter.startsWith('status:')) {
      const status = filter.split(':')[1];
      return this.matchesStatusFilter(dto.status, status);
    }

    if (filter.startsWith('dueDate:')) {
      const dateFilter = filter.split(':')[1];
      return this.matchesDueDateFilter(dto.dueDate, dateFilter, currentTime);
    }

    return true;
  }

  /**
   * 检查 importance 是否匹配过滤条件
   * 
   * 过滤逻辑: filterBy=importance:important 返回 importance >= Important 的任务
   */
  private matchesImportanceFilter(importance: ImportanceLevel, level: string): boolean {
    const importanceLevels = [
      ImportanceLevel.TRIVIAL,   // 1
      ImportanceLevel.MINOR,     // 2
      ImportanceLevel.MODERATE,  // 3
      ImportanceLevel.IMPORTANT, // 4
      ImportanceLevel.VITAL,     // 5
    ];

    const filterLevelIndex = importanceLevels.findIndex((l) => l === level);
    const taskLevelIndex = importanceLevels.findIndex((l) => l === importance);

    if (filterLevelIndex === -1) return true; // 无效的过滤条件，不过滤

    // importance >= filterLevel
    return taskLevelIndex >= filterLevelIndex;
  }

  /**
   * 检查 status 是否匹配过滤条件
   */
  private matchesStatusFilter(status: TaskTemplateStatus, statusFilter: string): boolean {
    return status === statusFilter;
  }

  /**
   * 检查 dueDate 是否匹配过滤条件
   */
  private matchesDueDateFilter(dueDate: number | null, dateFilter: string, currentTime: Date): boolean {
    if (!dueDate) {
      return dateFilter === 'noDueDate';
    }

    const dueDateObj = new Date(dueDate);
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    switch (dateFilter) {
      case 'overdue':
        return dueDateObj < today;
      case 'today':
        return dueDateObj >= today && dueDateObj < tomorrow;
      case 'upcoming':
        return dueDateObj >= today && dueDateObj < inSevenDays;
      default:
        return true;
    }
  }

  /**
   * 按指定字段排序任务
   * 
   * @param dtos 任务 DTO 数组
   * @param sortBy 排序字段
   * @param currentTime 当前时间
   * @returns 排序后的 DTO 数组
   */
  private applySort(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
    sortBy: TaskSortBy,
    currentTime: Date,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    const sorted = [...dtos]; // 避免修改原数组

    switch (sortBy) {
      case TaskSortBy.PRIORITY:
        return this.sortByPriority(sorted); // 已存在于 Story 2.1

      case TaskSortBy.DUE_DATE:
        return this.sortByDueDate(sorted);

      case TaskSortBy.CREATED_AT:
        return this.sortByCreatedAt(sorted);

      case TaskSortBy.IMPORTANCE:
        return this.sortByImportance(sorted);

      default:
        return this.sortByPriority(sorted); // 默认按优先级排序
    }
  }

  /**
   * 按截止日期升序排序，无期限任务排在最后
   */
  private sortByDueDate(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    return dtos.sort((a, b) => {
      const aHasDue = a.dueDate != null;
      const bHasDue = b.dueDate != null;

      // 无期限的任务排在最后
      if (!aHasDue && bHasDue) return 1;
      if (aHasDue && !bHasDue) return -1;

      // 都没有期限，保持原顺序
      if (!aHasDue && !bHasDue) return 0;

      // 都有期限，按升序排列
      return (a.dueDate as number) - (b.dueDate as number);
    });
  }

  /**
   * 按创建时间降序排序（最新创建的在前）
   */
  private sortByCreatedAt(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    return dtos.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // 降序
    });
  }

  /**
   * 按重要性降序排序
   */
  private sortByImportance(
    dtos: Array<TaskTemplateServerDTO & { priority: number }>,
  ): Array<TaskTemplateServerDTO & { priority: number }> {
    const importanceValues: { [key in ImportanceLevel]: number } = {
      [ImportanceLevel.VITAL]: 5,
      [ImportanceLevel.IMPORTANT]: 4,
      [ImportanceLevel.MODERATE]: 3,
      [ImportanceLevel.MINOR]: 2,
      [ImportanceLevel.TRIVIAL]: 1,
    };

    return dtos.sort((a, b) => {
      const aValue = importanceValues[a.importance] || 0;
      const bValue = importanceValues[b.importance] || 0;
      return bValue - aValue; // 降序
    });
  }

  /**
   * 获取所有活跃任务
   * 私有方法
   */
  private async getAllActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const activeStatuses = [
      TaskTemplateStatus.ACTIVE,
      TaskTemplateStatus.PAUSED,
    ];

    const templates: TaskTemplate[] = [];
    for (const status of activeStatuses) {
      const byStatus = await this.templateRepository.findByStatus(accountUuid, status);
      templates.push(...byStatus);
    }

    return templates;
  }
}
```

---

### Task 2.5.4: Update API Controller

**Objective:** Update route handler to accept and validate parameters

**File:** [apps/api/src/modules/task/interface/http/controllers/TaskTemplateController.ts](TaskTemplateController.ts)

**Update getTaskTemplates Method:**

```typescript
/**
 * 获取任务模板列表
 * 
 * Story 2.5: 支持 sortBy 和 filterBy 参数
 * 
 * 查询参数:
 * - sortBy: priority (default) | dueDate | createdAt | importance
 * - filterBy: importance:vital | status:active | dueDate:overdue (可多个，用逗号分隔)
 * 
 * 示例:
 * GET /task-templates?sortBy=dueDate&filterBy=importance:high&filterBy=status:active
 */
async getTaskTemplates(req: Request, res: Response): Promise<void> {
  try {
    const accountUuid = req.user?.uuid;
    if (!accountUuid) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }

    // 解析参数
    const sortBy = (req.query.sortBy as string) || TaskSortBy.PRIORITY;
    const filterByRaw = req.query.filterBy;
    const filterBy = Array.isArray(filterByRaw)
      ? filterByRaw
      : filterByRaw
        ? [filterByRaw]
        : [];

    // 验证参数
    try {
      TaskQueryValidator.validateSortBy(sortBy);
      TaskQueryValidator.validateFilterBy(filterBy);
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid parameters',
      });
      return;
    }

    // 查询服务
    const queryService = TaskQueryService.getInstance();
    const tasks = await queryService.getTasksWithSortingAndFiltering(
      accountUuid,
      sortBy as TaskSortBy,
      filterBy as TaskFilterBy[],
    );

    // 响应
    res.json({
      ok: true,
      data: tasks,
      meta: {
        count: tasks.length,
        sortedBy: sortBy,
        filteredBy: filterBy,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

---

### Task 2.5.5: Update OpenAPI/Swagger Documentation

**Objective:** Document new parameters in API specification

**File:** [apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts](taskTemplateRoutes.ts)

**Update GET /task-templates Documentation:**

```typescript
/**
 * @swagger
 * /task-templates:
 *   get:
 *     tags: [Task Templates]
 *     summary: 获取任务模板列表
 *     description: |
 *       获取用户的任务模板列表，支持灵活的排序和过滤
 *       
 *       ### 排序选项 (sortBy)
 *       - `priority` (默认): 按优先级降序 (由importance和dueDate自动计算)
 *       - `dueDate`: 按截止日期升序，无期限任务排在最后
 *       - `createdAt`: 按创建时间降序 (最新创建的在前)
 *       - `importance`: 按重要性降序 (Vital > Important > Moderate > Minor > Trivial)
 *       
 *       ### 过滤选项 (filterBy)
 *       **重要性过滤**:
 *       - `importance:vital`: 仅返回"极其重要"的任务
 *       - `importance:important`: 仅返回"重要"及以上的任务
 *       - `importance:moderate`: 仅返回"中等重要"及以上的任务
 *       - `importance:minor`: 仅返回"次要"及以上的任务
 *       - `importance:trivial`: 返回所有任务
 *       
 *       **状态过滤**:
 *       - `status:active`: 仅返回激活的任务
 *       - `status:completed`: 仅返回已完成的任务
 *       - `status:blocked`: 仅返回被阻塞的任务
 *       - `status:cancelled`: 仅返回已取消的任务
 *       
 *       **截止日期过滤**:
 *       - `dueDate:overdue`: 仅返回已逾期的任务
 *       - `dueDate:today`: 仅返回今天到期的任务
 *       - `dueDate:upcoming`: 仅返回未来7天内到期的任务
 *       - `dueDate:noDueDate`: 仅返回无截止期的任务
 *       
 *       ### 多个过滤条件
 *       多个 filterBy 之间是 **AND 关系**:
 *       `?filterBy=importance:important&filterBy=status:active` 返回"重要"且"激活"的任务
 *       
 *       ### 示例
 *       - 获取所有高优先级的活跃任务: `?sortBy=priority&filterBy=importance:important&filterBy=status:active`
 *       - 获取今天到期的任务，按截止日期排序: `?sortBy=dueDate&filterBy=dueDate:today`
 *       - 获取已逾期的任务: `?filterBy=dueDate:overdue`
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [priority, dueDate, createdAt, importance]
 *           default: priority
 *         description: 排序字段
 *       - in: query
 *         name: filterBy
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - importance:vital
 *               - importance:important
 *               - importance:moderate
 *               - importance:minor
 *               - importance:trivial
 *               - status:active
 *               - status:completed
 *               - status:blocked
 *               - status:cancelled
 *               - dueDate:overdue
 *               - dueDate:today
 *               - dueDate:upcoming
 *               - dueDate:noDueDate
 *         description: 过滤条件 (可多个，AND关系)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, ARCHIVED, DELETED]
 *         description: '[已弃用] 改用 filterBy=status:*'
 *       - in: query
 *         name: folderUuid
 *         schema:
 *           type: string
 *         description: 按文件夹过滤 (兼容)
 *       - in: query
 *         name: goalUuid
 *         schema:
 *           type: string
 *         description: 按目标过滤 (兼容)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 按标签过滤（逗号分隔，兼容）
 *     responses:
 *       200:
 *         description: 成功返回任务模板列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uuid:
 *                         type: string
 *                       title:
 *                         type: string
 *                       importance:
 *                         type: string
 *                       priority:
 *                         type: number
 *                         description: 计算得的优先级分数 (0-100)
 *                       dueDate:
 *                         type: number
 *                         description: 截止日期 (毫秒时间戳)
 *                       status:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     sortedBy:
 *                       type: string
 *                     filteredBy:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: 参数无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid sortBy value. Allowed: priority, dueDate, createdAt, importance"
 */
router.post('/', TaskTemplateController.createTaskTemplate);
router.get('/', TaskTemplateController.getTaskTemplates);
```

---

### Task 2.5.6: Unit Tests - Query Validator

**Objective:** Test parameter validation logic

**Test File:** [apps/api/src/modules/task/application/__tests__/TaskQueryValidator.spec.ts](TaskQueryValidator.spec.ts)

```typescript
describe('TaskQueryValidator', () => {
  
  it('should validate valid sortBy values', () => {
    expect(() => TaskQueryValidator.validateSortBy('priority')).not.toThrow();
    expect(() => TaskQueryValidator.validateSortBy('dueDate')).not.toThrow();
    expect(() => TaskQueryValidator.validateSortBy('createdAt')).not.toThrow();
    expect(() => TaskQueryValidator.validateSortBy('importance')).not.toThrow();
  });

  it('should throw on invalid sortBy value', () => {
    expect(() => TaskQueryValidator.validateSortBy('invalid')).toThrow();
    expect(() => TaskQueryValidator.validateSortBy('unknown')).toThrow();
  });

  it('should validate valid filterBy values', () => {
    expect(() => TaskQueryValidator.validateFilterBy('importance:vital')).not.toThrow();
    expect(() => TaskQueryValidator.validateFilterBy(['importance:vital', 'status:active'])).not.toThrow();
  });

  it('should throw on invalid filterBy value', () => {
    expect(() => TaskQueryValidator.validateFilterBy('invalid:value')).toThrow();
  });

  it('should return empty array for no filterBy', () => {
    const result = TaskQueryValidator.validateFilterBy();
    expect(result).toEqual([]);
  });

  it('should handle array of filterBy values', () => {
    const result = TaskQueryValidator.validateFilterBy([
      'importance:important',
      'status:active',
    ]);
    expect(result).toHaveLength(2);
  });
});
```

---

### Task 2.5.7: Integration Tests - Sorting & Filtering

**Objective:** Test combined sorting and filtering scenarios

**Test File:** [apps/api/src/modules/task/application/__tests__/TaskQueryService.sorting.spec.ts](TaskQueryService.sorting.spec.ts)

```typescript
describe('TaskQueryService - Sorting & Filtering', () => {
  let service: TaskQueryService;

  beforeEach(() => {
    service = TaskQueryService.createInstance();
  });

  describe('Scenario 1: Default (sortBy=priority)', () => {
    it('should return tasks sorted by priority (descending) by default', async () => {
      const accountUuid = 'test-account';
      const tasks = [
        { importance: VITAL, dueDate: tomorrow(), expectedPriority: 95 },
        { importance: MODERATE, dueDate: nextWeek(), expectedPriority: 55 },
        { importance: IMPORTANT, dueDate: today(), expectedPriority: 90 },
      ];

      // Mock repository
      mockTemplateRepository.findByStatus.mockResolvedValue(
        tasks.map((t) => createMockTemplate(t))
      );

      const result = await service.getTasksWithSortingAndFiltering(accountUuid);

      // Verify sorting: 95 > 90 > 55
      expect(result[0].priority).toBe(95);
      expect(result[1].priority).toBe(90);
      expect(result[2].priority).toBe(55);
    });
  });

  describe('Scenario 2: SortBy=dueDate with FilterBy=importance:important', () => {
    it('should return important tasks sorted by dueDate (ascending)', async () => {
      const accountUuid = 'test-account';

      const tasks = [
        { importance: VITAL, dueDate: nextMonth() },        // important, far away
        { importance: IMPORTANT, dueDate: today() },        // important, today
        { importance: MODERATE, dueDate: tomorrow() },      // not important
        { importance: IMPORTANT, dueDate: nextWeek() },     // important, next week
      ];

      mockTemplateRepository.findByStatus.mockResolvedValue(
        tasks.map((t) => createMockTemplate(t))
      );

      const result = await service.getTasksWithSortingAndFiltering(
        accountUuid,
        TaskSortBy.DUE_DATE,
        [TaskFilterBy.IMPORTANCE_IMPORTANT]
      );

      // Should return 3 important tasks (VITAL=5 >= IMPORTANT=4, yes)
      expect(result).toHaveLength(3);
      
      // Should be sorted by dueDate ascending: today < nextWeek < nextMonth
      expect(result[0].dueDate).toBeLessThan(result[1].dueDate);
      expect(result[1].dueDate).toBeLessThan(result[2].dueDate);
    });
  });

  describe('Scenario 3: FilterBy=status:active and FilterBy=dueDate:overdue', () => {
    it('should return empty if combining incompatible filters', async () => {
      // Active tasks and overdue tasks are usually contradictory
      // But let's assume we have an active task that is overdue
      
      const tasks = [
        { status: ACTIVE, dueDate: yesterday() },  // overdue and active
      ];

      mockTemplateRepository.findByStatus.mockResolvedValue(
        tasks.map((t) => createMockTemplate(t))
      );

      const result = await service.getTasksWithSortingAndFiltering(
        accountUuid,
        TaskSortBy.PRIORITY,
        [TaskFilterBy.STATUS_ACTIVE, TaskFilterBy.DUE_DATE_OVERDUE]
      );

      expect(result).toHaveLength(1); // One task matching both filters
    });
  });
});
```

---

### Task 2.5.8: E2E Tests - HTTP Endpoint

**Objective:** Test API endpoint with various parameter combinations

**Test File:** [apps/api/src/modules/task/interface/http/__tests__/taskTemplates.e2e.spec.ts](taskTemplates.e2e.spec.ts)

```typescript
describe('GET /task-templates - Sorting & Filtering E2E', () => {
  
  it('should return tasks with default sorting (priority)', async () => {
    const response = await request(app)
      .get('/task-templates')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.meta.sortedBy).toBe('priority');
    expect(response.body.meta.count).toBeGreaterThan(0);
  });

  it('should return tasks sorted by dueDate when requested', async () => {
    const response = await request(app)
      .get('/task-templates')
      .query({ sortBy: 'dueDate' })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.meta.sortedBy).toBe('dueDate');
  });

  it('should filter by importance:important', async () => {
    const response = await request(app)
      .get('/task-templates')
      .query({ filterBy: 'importance:important' })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.meta.filteredBy).toContain('importance:important');
    
    // All returned tasks should have importance >= important
    response.body.data.forEach((task) => {
      const level = getImportanceLevel(task.importance);
      expect(level).toBeGreaterThanOrEqual(IMPORTANT_LEVEL);
    });
  });

  it('should return 400 error for invalid sortBy parameter', async () => {
    const response = await request(app)
      .get('/task-templates')
      .query({ sortBy: 'invalid' })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.ok).toBe(false);
    expect(response.body.error).toContain('Invalid sortBy');
  });

  it('should combine sortBy and filterBy parameters', async () => {
    const response = await request(app)
      .get('/task-templates')
      .query({ 
        sortBy: 'dueDate',
        filterBy: ['importance:vital', 'status:active']
      })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.meta.sortedBy).toBe('dueDate');
    expect(response.body.meta.filteredBy).toContain('importance:vital');
    expect(response.body.meta.filteredBy).toContain('status:active');
  });
});
```

---

### Task 2.5.9: Update Client SDKs

**Objective:** Ensure client libraries support new parameters

**Files to Update:**
- [apps/web/src/modules/task/infrastructure/api/taskApiClient.ts](taskApiClient.ts) - Web
- [apps/desktop/src/renderer/modules/task/infrastructure/](task infrastructure) - Desktop

**Update getTaskTemplates Method (Web):**
```typescript
async getTaskTemplates(params?: {
  page?: number;
  limit?: number;
  status?: string;  // deprecated, use filterBy
  folderUuid?: string;
  goalUuid?: string;
  importance?: string;  // deprecated, use filterBy
  urgency?: string;  // deprecated
  tags?: string[];
  // NEW: Story 2.5 parameters
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'importance';
  filterBy?: string[];  // e.g., ['importance:vital', 'status:active']
}): Promise<TaskTemplateClientDTO[]> {
  const data = await apiClient.get(this.baseUrl, { params });
  return data;
}
```

---

### Task 2.5.10: Documentation & Migration Guide

**Objective:** Document new API capabilities

**File:** [docs/API-SORTING-FILTERING.md](docs/API-SORTING-FILTERING.md)

```markdown
# Task API - Sorting & Filtering Guide (Story 2.5)

## Overview

The Task API now supports flexible sorting and filtering of task lists.

## Sorting Options (sortBy)

### priority (default)
Returns tasks sorted by calculated priority score (descending).
- Formula: Importance * 0.6 + (1/TimeRemaining) * 0.4
- Backlog tasks (no due date) sorted by importance

### dueDate
Returns tasks sorted by due date (ascending).
- Tasks with earlier due dates appear first
- Tasks without due date appear last

### createdAt
Returns tasks sorted by creation time (descending).
- Most recently created tasks appear first

### importance
Returns tasks sorted by importance level (descending).
- Vital > Important > Moderate > Minor > Trivial

## Filtering Options (filterBy)

All filters support multiple values with AND logic.

### Importance Filters
- `importance:vital`: Vital tasks only
- `importance:important`: Important and above
- `importance:moderate`: Moderate and above
- `importance:minor`: Minor and above
- `importance:trivial`: All tasks

### Status Filters
- `status:active`: Active tasks
- `status:completed`: Completed tasks
- `status:blocked`: Blocked tasks
- `status:cancelled`: Cancelled tasks

### Time Filters
- `dueDate:overdue`: Overdue tasks
- `dueDate:today`: Due today
- `dueDate:upcoming`: Due in next 7 days
- `dueDate:noDueDate`: No due date

## Examples

```
# Get high-priority active tasks
GET /task-templates?sortBy=priority&filterBy=importance:important&filterBy=status:active

# Get all tasks due in next 7 days, sorted by due date
GET /task-templates?sortBy=dueDate&filterBy=dueDate:upcoming

# Get all overdue tasks
GET /task-templates?filterBy=dueDate:overdue

# Get vital tasks sorted by creation time
GET /task-templates?sortBy=createdAt&filterBy=importance:vital
```

## Implementation Notes

- Multiple filterBy parameters are combined with AND logic
- sortBy defaults to 'priority' if not specified
- Invalid parameters return 400 Bad Request
- Parameter values are case-sensitive
```

---

## Dev Notes

### Performance Considerations

- All filtering/sorting happens in-memory after fetching tasks
- For large task sets (>10,000), consider database-level optimization (future enhancement)
- Current implementation suitable for typical daily-use scenarios (<5,000 tasks)

### Backward Compatibility

- Old parameters (status, importance, urgency) still supported but deprecated
- Clients should migrate to new sortBy/filterBy format
- No breaking changes to existing API responses

### Future Enhancements

- Pagination with sorting/filtering
- Database-level sorting for performance
- Custom sort orders (saved filters)
- Faceted search UI in frontend

---

## Acceptance Validation Checklist

- [ ] **AC1 Validation:** sortBy parameter support for all 4 sort types
- [ ] **AC2 Validation:** filterBy parameter support for all filter types
- [ ] **AC3 Validation:** Combined parameters work correctly (filter then sort)
- [ ] **AC4 Validation:** Parameter validation returns 400 for invalid values
- [ ] **AC5 Validation:** Default behavior unchanged (backward compatible)
- [ ] **AC6 Validation:** OpenAPI/Swagger documentation complete
- [ ] **AC7 Validation:** Integration tests cover 3+ scenarios
- [ ] **Unit Tests:** TaskQueryValidator tests passing
- [ ] **E2E Tests:** HTTP endpoint tests passing
- [ ] **Code Review:** Peer review confirms clean implementation
- [ ] **Documentation:** Migration guide and API docs updated

---

## Related Stories & Dependencies

**Prerequisite (Complete ✓):**
- Story 2.1: Implement In-Memory Sorting ✓
- Story 2.2: Frontend API Integration ✓

**Downstream (Enabled by this story):**
- Story 2.6: Performance Testing (can now test various sort/filter combinations)

---

## Commit Strategy

### Commit 1: Add Type Definitions & Validator
```
feat(contracts): add task query type definitions

- Add TaskSortBy enum
- Add TaskFilterBy enum
- Add QueryTasksRequest interface
```

### Commit 2: Add Query Validator
```
feat(api/task): implement task query parameter validator

- Add TaskQueryValidator class
- Validate sortBy and filterBy parameters
- Throw errors for invalid values
```

### Commit 3: Extend TaskQueryService
```
feat(api/task): extend query service with sorting and filtering

- Add getTasksWithSortingAndFiltering() method
- Implement applyFilters() and applySort() methods
- Support 4 sort types and 13 filter types
```

### Commit 4: Update Controller & Routes
```
feat(api/task): update controller and routes for sorting/filtering

- Update getTaskTemplates() to accept and validate parameters
- Update Swagger documentation
- Add comprehensive examples
```

### Commit 5: Add Unit Tests
```
test(api/task): add query validator and sorting tests

- Test parameter validation
- Test sorting logic for each type
- Test filtering logic for each type
```

### Commit 6: Add E2E Tests
```
test(api/task): add integration tests for sorting/filtering

- Test HTTP endpoint with various parameter combinations
- Test error cases
- Test backward compatibility
```

### Commit 7: Update Client SDKs
```
feat(web/api): update API client for sorting/filtering parameters

feat(desktop/api): update API client for sorting/filtering parameters
```

### Commit 8: Update Documentation
```
docs: add sorting/filtering API documentation

- Update API-SORTING-FILTERING.md
- Update CHANGELOG.md
- Add migration guide for clients
```

---

## References

- [Story 2.1: Priority Sorting](2-1-implement-task-list-in-memory-sorting-logic-get-tasks-with-priority-sorting.md)
- [Story 2.2: Frontend Integration](2-2-frontend-api-integration-get-sorted-task-list.md)
- [Task Contracts](packages/contracts/src/modules/task/)
- [OpenAPI Specification](docs/openapi.yaml)

---

## Sign-Off

**Created by:** SM Agent (Sprint Planning)
**Date:** 2026-01-16
**Status:** READY FOR DEVELOPMENT
**Next Step:** Assign to Backend Developer → Implement Story 2.5 → Merge to main
