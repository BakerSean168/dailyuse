---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: 
  - docs/PRD-Task-Priority-Simplification.md
  - _bmad-output/planning-artifacts/architecture.md
project_name: dailyuse
workflowType: create-epics-and-stories
user_name: Baker
date: '2026-01-15 07:18'
status: 'COMPLETE - Ready for Development'
---

# dailyuse - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dailyuse, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR-001 (Entity Update):** Task entity must decouple from persisted urgency and priority.
- **FR-002 (New Field - Importance):** Task entity enforces importance (User Input: Low/Medium/High/Critical).
- **FR-003 (New Field - Time Anchor):** Task entity enforces TaskTimeConfig/DueDate.
- **FR-004 (Domain Logic):** Implement PriorityCalculator as a pure Domain Service.
- **FR-005 (Algorithm):** Priority formula ~ Importance * W1 + (1/TimeRemaining) * W2. Must handle infinite/null DueDates and Overdue tasks.
- **FR-006 (Contract):** API TaskDTO preserves priority field but it is now **read-only/computed**.
- **FR-007 (Sorting):** 
  - **Active View:** Support dynamic `sortBy=priority` (in-memory sorting in Application Layer for active tasks).
  - **Archive View:** Fallback to `sortBy=completedAt` (DB Index).

### NonFunctional Requirements

- **NFR-001 (Performance):** Dynamic sorting O(n log n) in application layer is acceptable for N < 2000 active tasks.
- **NFR-002 (UX Stability):** Tasks must **not** auto-reorder while the user is viewing the list (avoids jumping UI). Priority calculation happens on Data Fetch.
- **NFR-003 (Architecture):** Strict Clean Architecture layering. Domain services must be pure and testable.
- **NFR-004 (Dev Simplicity):** Breaking changes are permitted over complex backward compatibility for this refactor.

### Additional Requirements

- **UX - Form Simplification:** Remove Priority and Urgency input fields from Task Creation/Edit forms. Add Importance controls (e.g., slider/switch).
- **UX - List Visualization:** Implicitly indicate priority (e.g., color heat, ordering) rather than explicit labels.
- **Tech - Migration:** Strategy is to drop old priority columns and default new Importance to 'Medium'.
- **Tech - Structure:** DTOs must live in `packages/contracts` to be shared across API, Web, and Desktop.

### FR Coverage Map

- **Epic 1 (Dynamic Priority Foundation):** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-003, NFR-004
- **Epic 2 (Intelligent Sorting & UX):** FR-007, NFR-001, NFR-002, UX Requirements

## Epic List

1. **Dynamic Priority Foundation:** Establish the new data model based on Importance & Time, and implement the domain-driven priority calculation service.
2. **Intelligent Sorting & UX:** Implement application-layer dynamic sorting and optimize frontend interaction (remove redundant fields, visualize smart sorting).

## Epic 1: Dynamic Priority Foundation

**Goal:** Transform the task management core by replacing static priority fields with a dynamic importance-based model and implementing a real-time domain calculation engine.

**Requirements Covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-003, NFR-004

### Story 1.1: 更新 Task 实体 - 移除旧字段，添加 Importance

As a 系统架构师,
I want Task 实体移除 `priority` 和 `urgency` 持久化字段，新增 `importance` 字段,
So that 数据模型反映新的概念设计，并减少冗余性。

**Acceptance Criteria:**

**Given** Task 实体已存在于 `packages/contracts/src/modules/task/task-defs.ts`
**When** 开发者修改实体定义
**Then** 移除 `priority` 和 `urgency` 字段
**And** 新增 `importance: ImportanceLevel` 枚举字段（值：Vital, Important, Moderate, Minor, Trivial）
**And** 单元测试验证新字段存在

### Story 1.2: 创建 PriorityCalculator 域服务及其测试框架

As a 后端开发者,
I want 实现一个纯域服务 `PriorityCalculator`，接收 Importance、DueDate、CurrentTime，输出 CalculatedPriority,
So that 优先级计算逻辑与任何外层框架解耦，易于单元测试。

**Acceptance Criteria:**

**Given** `packages/domain-server/src/task/services/` 目录已存在
**When** 开发者创建 `priority-calculator.service.ts`
**Then** 服务导出纯函数 `calculatePriority(importance: ImportanceLevel, dueDate: Date | null, currentTime: Date): number`
**And** 返回 0-100 范围的数值优先级分
**And** 对于 null/Infinity DueDate（无截止）的任务，使用降级公式确保其不被淹没
**And** 完整的单元测试覆盖 (>=90%) 包括：Backlog/Normal/Overdue/ZeroDaysRemaining 场景

### Story 1.3: 实现优先级计算算法 - Importance & Time 权重

As a 产品工程师,
I want 在 PriorityCalculator 中实现完整的算法：`Priority = Importance * W1 + (1 / TimeRemaining) * W2`,
So that 系统能智能判断"既重要又紧急"的任务应该排在前面。

**Acceptance Criteria:**

**Given** PriorityCalculator 框架已建立
**When** 计算优先级分数
**Then** Importance 权重（W1）= 0.6
**And** TimeRemaining 权重（W2）= 0.4
**And** 对于 Overdue 任务（DueDate < CurrentTime），应附加极高的紧迫性（例如 +50 分）
**And** 对于 Backlog 任务（无 DueDate），TimeRemaining 视为一个很大的常数（如 999999）
**And** 实现边界值处理：确保返回值始终在 [0, 100] 范围内
**And** 单元测试验证至少 5 个典型场景（Very Important & Today, Important & Next Week, Minor & Backlog, Overdue, etc.)

### Story 1.4: 更新 TaskDTO 和 API 契约 - 优先级为只读计算字段

As a API 开发者,
I want 修改 `packages/contracts/src/modules/task/task-dtos.ts` 中的 TaskDTO，使 `priority` 成为只读的计算字段，新增 `importance: ImportanceLevel`,
So that 前端和客户端明确知道 priority 无法直接修改，而 importance 是用户可输入的。

**Acceptance Criteria:**

**Given** TaskDTO 已存在
**When** 开发者更新 DTO 定义
**Then** 移除 `priority` 和 `urgency` 作为用户输入字段
**And** 新增 `importance: ImportanceLevel` 字段
**And** 新增只读计算字段 `priority: number` (范围 0-100)
**And** DTO 中清晰标注 `priority` 为 "@readonly / Computed at runtime"
**And** 创建或更新 Swagger/OpenAPI 文档反映新字段

### Story 1.5: 在应用层集成优先级计算 - TaskQueryService

As a 应用层开发者,
I want 在 `packages/application-server/src/task/services/task-query.service.ts` 中调用 PriorityCalculator，为每个任务计算优先级，并填充到 DTO,
So that API 返回的任务包含实时计算的优先级分数。

**Acceptance Criteria:**

**Given** PriorityCalculator 域服务已实现
**When** TaskQueryService 执行任务查询操作
**Then** 对每个返回的任务实体，调用 `PriorityCalculator.calculatePriority()`
**And** 将计算结果赋值给 TaskDTO 的 `priority` 字段
**And** 不修改数据库中的任何 priority 列（保持数据库无优先级存储）
**And** 单元测试验证计算过程的完整性

### Story 1.6: 数据库迁移 - 删除旧字段，添加 Importance 列

As a DBA / 基础设施工程师,
I want 执行 Prisma 迁移，从 Task 表移除 `priority` 和 `urgency` 列，新增 `importance` 列（默认值 'Moderate'),
So that 生产数据库与新的实体模型对齐。

**Acceptance Criteria:**

**Given** Prisma Schema 已定义了新的 Task 实体
**When** 运行 `pnpm prisma migrate dev --name refactor_task_priority`
**Then** 生成迁移文件位于 `apps/api/prisma/migrations/`
**And** 迁移脚本删除 `priority` 和 `urgency` 列
**And** 迁移脚本添加 `importance` 列，枚举类型为 ImportanceLevel，默认值 'Moderate'
**And** 迁移脚本为现有任务设定合理的 importance 值（例如都设为 'Moderate'）
**And** 迁移脚本可在开发/测试环境成功执行，无 SQL 错误

## Epic 2: Intelligent Sorting & UX

**Goal:** Deliver the user-facing value of the priority refactor by simplifying input forms and implementing a performant, stable dynamic sorting mechanism in the task list view.

**Requirements Covered:** FR-007, NFR-001, NFR-002, UX Requirements

### Story 2.1: 实现任务列表内存排序逻辑 - GetTasksWithPrioritySorting

As a 应用层开发者,
I want 在 TaskQueryService 中实现 `getTasksWithPrioritySorting()` 方法，将任务列表按计算得的 priority 分数降序排列,
So that API 返回的任务列表已按智能优先级顺序排列。

**Acceptance Criteria:**

**Given** PriorityCalculator 已集成在 TaskQueryService 中
**When** 调用 `getTasksWithPrioritySorting(userId: string, sortBy: 'priority' | 'completedAt' = 'priority')`
**Then** 返回该用户的所有活跃任务（status != 'completed'）
**And** 按计算的 priority 分数降序排列（最高优先级在前）
**And** 对于 Backlog 任务（无 DueDate），应排在有截止期的任务下方
**And** 性能满足 NFR（O(n log n) 排序，可在 <2000 活跃任务场景下 <100ms 完成）
**And** 单元测试验证排序顺序的正确性（3-5 个典型场景）

### Story 2.2: 前端 API 集成 - 获取排序后的任务列表

As a 前端开发者（Web/Desktop）,
I want 前端应用调用更新后的 GET /tasks API，接收包含 `priority` 字段的任务列表,
So that 前端可以直接基于 API 返回的顺序展示任务，无需前端二次排序。

**Acceptance Criteria:**

**Given** 后端 API 已实现 priority 计算和排序
**When** 前端发起 `GET /tasks?userId=xxx`
**Then** 响应体包含任务列表，每个任务含 `priority: number`（0-100）
**And** 任务列表已按 priority 降序排列
**And** 前端成功解析新的 TaskDTO 结构（importance + priority 字段）
**And** 集成测试覆盖 Web 和 Desktop 应用

### Story 2.3: 移除任务表单中的 Urgency 和 Priority 输入字段

As a UI/UX 工程师,
I want 从任务创建/编辑表单中移除 `Urgency` 和 `Priority` 选择框，仅保留 `Importance` 控件,
So that 用户在填写任务时认知负担降低，表单更加极简。

**Acceptance Criteria:**

**Given** 任务表单存在于 `apps/web/src/components/TaskForm.tsx` 和 `apps/desktop/src/components/TaskForm.tsx`
**When** 开发者编辑表单组件
**Then** 移除 `<PrioritySelect />` 和 `<UrgencySelect />` 组件
**And** 保留或新增 `<ImportanceSelector />` 组件（可选：支持 5 级选择或滑块）
**And** 更新表单的 label 和 placeholder 文本以反映新的语义
**And** 视觉测试验证表单layout 仍然清晰（移除两个字段后）

### Story 2.4: 任务列表视觉优化 - 基于优先级的色彩和排序提示

As a UX 设计师/前端开发者,
I want 在任务列表中用视觉线索（颜色、排序位置、icon）隐式表达任务优先级，无需显式标签,
So that 用户一眼就能识别最紧迫的任务，提升用户体验。

**Acceptance Criteria:**

**Given** 任务列表组件存在于 `apps/web/src/components/TaskList.tsx` 和 `apps/desktop/src/components/TaskList.tsx`
**When** 任务列表渲染
**Then** 根据 priority 分数应用样式：priority >= 80 显示红色/紧急标记；60-79 显示黄色/重要标记；<60 显示灰色/普通
**And** 任务已按 API 返回的顺序（即 priority 排序）展示，强化"自动排序"的感知
**And** （可选）在极高优先级任务（priority > 90）旁添加"⚡"或"🔥"图标以吸引注意
**And** 样式在 Light/Dark 主题下都保持可读性
**And** 视觉回归测试验证各优先级的色彩、图标等一致性

### Story 2.5: 支持排序参数和过滤选项 - 后端扩展

As a API 设计者,
I want 在 GET /tasks API 中支持 `sortBy` 和 `filterBy` 参数，允许用户切换排序方式或按 Importance 过滤,
So that 用户在特定场景下可以灵活查看任务（如"仅显示高重要性"或"按截止日期排序"）。

**Acceptance Criteria:**

**Given** TaskQueryService 已实现了 priority 排序
**When** API 支持查询参数：`?sortBy=priority|dueDate|createdAt&filterBy=importance|status`
**Then** `sortBy=priority`（默认）返回按 priority 降序的任务
**And** `sortBy=dueDate` 返回按 DueDate 升序的任务（无期限任务排在最后）
**And** `sortBy=createdAt` 返回按创建时间降序的任务
**And** `filterBy=importance:high` 仅返回 Importance >= Important 的任务
**And** 参数验证确保仅允许有效的 sortBy/filterBy 值
**And** 集成测试覆盖至少 3 个常见组合场景

### Story 2.6: 性能测试与优化 - 确保排序不阻塞

As a 性能工程师,
I want 对任务列表的排序操作进行性能基准测试，确保在 <2000 活跃任务场景下响应时间 < 100ms,
So that 系统即使在任务量较多时也能提供快速的列表查询体验。

**Acceptance Criteria:**

**Given** TaskQueryService 的 `getTasksWithPrioritySorting()` 已实现
**When** 对 N=100, 500, 1000, 1500, 2000 个活跃任务执行排序
**Then** 响应时间分别不超过 10ms, 20ms, 40ms, 60ms, 100ms
**And** CPU 使用率不超过 5%（单线程）
**And** 内存占用在合理范围内（<50MB for 2000 tasks）
**And** 性能报告文档化基准结果和优化建议
**And** 如果性能未达标，根据瓶颈进行优化（如批量计算、缓存等）
