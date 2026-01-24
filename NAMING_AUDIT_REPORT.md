# 命名标准化实施审计报告

> 生成时间: 2026-01-24  
> 状态: 进行中 (Task 2/6)

## 摘要

代码库中存在 **200+ 个 `title` 字段**，但并非所有都需要修改为 `name`。需要进行**选择性重构**：

### 分类统计

| 类别 | 数量 | 处理方式 | 优先级 |
|-----|------|--------|------|
| **主要对象标识符** (需改为 `name`) | ~30-40 | ✏️ 改为 `name` | 🔴 HIGH |
| **显示/通知文本** (保持 `title`) | ~60-80 | ⏭️ 跳过 | 🟢 LOW |
| **UI 组件/辅助字段** (保持 `title`) | ~80-100 | ⏭️ 跳过 | 🟢 LOW |

## 详细分析

### 1. ✏️ 需要改为 `name` 的字段

这些是实体的**主要对象标识符**，应该改为 `name` 以符合命名规范：

#### A. TaskTemplate (任务模板)

**文件**: [contracts/src/modules/task/aggregates/TaskTemplateServer.ts](contracts/src/modules/task/aggregates/TaskTemplateServer.ts)

```typescript
// ❌ BEFORE
export interface TaskTemplateServerDTO {
  title: string;      // 主要标识符
  description?: string;
}

// ✅ AFTER
export interface TaskTemplateServerDTO {
  name: string;       // ✓ 改为 name
  description?: string;
}
```

**影响范围**:
- `TaskTemplateServerDTO` 接口
- `TaskTemplatePersistenceDTO` 接口
- `TaskTemplateClientDTO` 接口 (UI 显示用的 `displayTitle` 分离)
- Domain 实体类: `TaskTemplate` (_title → _name)
- Repository 映射: 所有 rowToTemplate() 方法

#### B. Goal (目标)

**文件**: [contracts/src/modules/goal/aggregates/GoalServer.ts](contracts/src/modules/goal/aggregates/GoalServer.ts)

```typescript
// ❌ BEFORE
export interface GoalServerDTO {
  title: string;      // 主要标识符
}

// ✅ AFTER
export interface GoalServerDTO {
  name: string;       // ✓ 改为 name
}
```

**影响范围**:
- `GoalServerDTO` 接口
- `GoalPersistenceDTO` 接口
- `GoalClientDTO` 接口
- Domain 实体类: `Goal` (_title → _name)
- Repository 映射: prisma-goal-repository.ts

#### C. Schedule (日程)

**文件**: [contracts/src/modules/schedule/aggregates/ScheduleServer.ts](contracts/src/modules/schedule/aggregates/ScheduleServer.ts)

```typescript
// ❌ BEFORE
export interface ScheduleServerDTO {
  readonly title: string;    // 主要标识符
}

// ✅ AFTER
export interface ScheduleServerDTO {
  readonly name: string;     // ✓ 改为 name
}
```

**影响范围**:
- `ScheduleServerDTO` 接口
- `ScheduleClientDTO` 接口
- `SchedulePersistenceDTO` 接口
- Domain 实体类: `Schedule` (_title → _name)
- Repository 映射: schedule-prisma.repository.ts

#### D. ReminderTemplate (提醒模板)

**文件**: [contracts/src/modules/reminder/aggregates/ReminderTemplateServer.ts](contracts/src/modules/reminder/aggregates/ReminderTemplateServer.ts)

```typescript
// ❌ BEFORE
export interface ReminderTemplateServerDTO {
  title: string;      // 主要标识符
}

// ✅ AFTER
export interface ReminderTemplateServerDTO {
  name: string;       // ✓ 改为 name
}
```

### 2. ⏭️ 保持 `title` 的字段

这些字段保持不变，因为它们不是主要对象标识符：

| 字段名 | 用途 | 保留原因 |
|-------|------|--------|
| `displayTitle` | UI 显示标题(可能截断) | 显式标记为显示用 |
| `templateTitle` | 嵌套对象的模板标题 | 关联对象的标识符文本 |
| `notification.title` | 通知内容标题 | 通知内容的一部分 |
| `render().title` | 渲染后的通知标题 | 返回值命名约定 |
| 测试数据中的 `title` | 测试 fixture | 不需要更改 |
| 事件数据中的 `title` | 事件负载数据 | 历史兼容性 |

## 实施计划

### 第一阶段: DTO 接口更新 (1-2小时)

1. **Contracts Package** - 更新所有 DTO 定义
   - [ ] TaskTemplateServerDTO, TaskTemplatePersistenceDTO, TaskTemplateClientDTO
   - [ ] GoalServerDTO, GoalPersistenceDTO, GoalClientDTO
   - [ ] ScheduleServerDTO, ScheduleClientDTO
   - [ ] ReminderTemplateServerDTO 等

   **方法**: 使用 `replace_string_in_file` 批量替换 `title: string;` → `name: string;`
   
   **验证**: TypeScript 编译应该报错（expected，因为 domain/infrastructure 还未更新）

### 第二阶段: Domain 实体类更新 (1-1.5小时)

2. **Domain-Server Package** - 更新实体类
   - [ ] TaskTemplate: `_title` → `_name`, `get title()` → `get name()`
   - [ ] Goal: 同上
   - [ ] Schedule: 同上
   - [ ] ReminderTemplate: 同上

   **方法**: 
   - 替换字段定义: `private _title: string;` → `private _name: string;`
   - 替换 getter: `get title()` → `get name()`
   - 替换 setter/updater: `updateTitle()` → `updateName()`
   - 替换内部引用: `this._title` → `this._name`
   - 替换 DTO 映射: `title: this._title` → `name: this._name`

   **验证**: TypeScript 编译应该只报告 DTO 不匹配（expected）

### 第三阶段: Repository 映射更新 (45分钟-1小时)

3. **Infrastructure-Server Package** - 更新仓储映射
   - [ ] SQLite repositories: `title: row.title` → `name: row.name` (or `row.title` if DB still uses title)
   - [ ] Prisma repositories: 同上

   **注意**: 数据库列名可能仍然是 `title`，映射层负责转换
   
   **验证**: 所有包应该编译成功，TypeScript 零错误

### 第四阶段: 构建验证 (20分钟)

4. **完整构建测试**
   - [ ] `pnpm nx build contracts`
   - [ ] `pnpm nx build domain-server`
   - [ ] `pnpm nx build infrastructure-server`
   - [ ] `pnpm nx build application-server`

## 需要修改的具体文件

### Contracts (18-20 个文件)
- `modules/task/aggregates/TaskTemplateServer.ts` - 3 个接口
- `modules/task/aggregates/TaskTemplateClient.ts` - 2 个接口
- `modules/task/api-requests.ts` - CreateTaskTemplateRequest 等
- `modules/goal/aggregates/GoalServer.ts` - 2 个接口
- `modules/goal/aggregates/GoalClient.ts` - 2 个接口
- `modules/schedule/aggregates/ScheduleServer.ts` - 1 接口
- `modules/schedule/aggregates/ScheduleClient.ts` - 1 接口
- `modules/reminder/aggregates/ReminderTemplateServer.ts` - 2 接口
- `modules/reminder/aggregates/ReminderTemplateClient.ts` - 2 接口
- 其他 API request/response DTOs

### Domain-Server (6-8 个文件)
- `task/aggregates/TaskTemplate.ts` - 完整类重构
- `goal/aggregates/Goal.ts` - 完整类重构
- `schedule/aggregates/Schedule.ts` - 完整类重构
- `reminder/aggregates/ReminderTemplate.ts` - 完整类重构
- 相关的 Factory/Builder 方法

### Infrastructure-Server (8-10 个文件)
- `task/adapters/sqlite/task-template-sqlite.repository.ts`
- `task/adapters/prisma/task-template-prisma.repository.ts`
- `goal/repositories/prisma-goal-repository.ts`
- `schedule/adapters/prisma/schedule-prisma.repository.ts`
- `reminder/adapters/sqlite/reminder-template-sqlite.repository.ts`
- 其他相关仓储

**总计**: ~30-40 个文件需要修改

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|--------|
| 遗漏某些引用 | 中 | 高 | 完整后进行 grep 验证，确保无残留 title 引用 |
| 数据库兼容性 | 低 | 高 | 确保映射层正确转换，SQL 列名不变 |
| 事件兼容性 | 中 | 中 | 保持事件定义中的 title，但让映射层处理 |
| 测试失败 | 高 | 中 | 更新所有测试中的 DTO 创建代码 |

## 验证清单

完成所有更改后，运行以下验证：

```bash
# 1. 确保没有遗留的错误引用
grep -r "\.title" packages/contracts --include="*.ts" | grep -v "displayTitle\|templateTitle\|notification\|render"

# 2. 构建验证
pnpm nx build infrastructure-server 2>&1 | grep -i "error"

# 3. 类型检查
pnpm tsc --noEmit

# 4. 测试
pnpm nx test infrastructure-server
```

## 时间估计

| 阶段 | 任务 | 估时 | 实际 |
|-----|------|------|------|
| 1 | DTO 接口更新 | 1-1.5h | - |
| 2 | Domain 实体更新 | 1-1.5h | - |
| 3 | Repository 映射 | 45m-1h | - |
| 4 | 构建验证 | 20m | - |
| **总计** | **整个实施** | **3-4小时** | - |

---

## 更新历史

| 日期 | 更新 |
|-----|------|
| 2026-01-24 | 初始审计报告，确定改改范围和实施计划 |
