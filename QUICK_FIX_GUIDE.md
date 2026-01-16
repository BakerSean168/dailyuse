# 快速修复指南 - 12个故事编译错误和缺陷

## 🚨 紧急修复清单 (优先级排序)

### ✅ 修复1: 导出缺失的类型定义 (5分钟)

**文件**: `packages/contracts/src/modules/task/index.ts`

**问题**: `TaskSortBy`, `TaskFilterBy`, `TasksListResponse` 未导出

**修复**:
```typescript
// 在文件末尾添加导出
export { TaskSortBy, TaskFilterBy, type TasksListResponse } from './queries';
```

**验证**:
```bash
pnpm nx run contracts:typecheck
```

---

### ✅ 修复2: 修复ImportanceLevel枚举大小写 (15分钟)

**文件**: `apps/api/src/modules/task/application/TaskQueryService.ts`

**问题**: 使用 `ImportanceLevel.VITAL` 但应该是 `ImportanceLevel.Vital` (小写首字母)

**查找和替换的修复点**:

```
第121-126行:
OLD: [ImportanceLevel.TRIVIAL]: 20, ImportanceLevel.MINOR]: 40, ...
NEW: [ImportanceLevel.Trivial]: 20, [ImportanceLevel.Minor]: 40, [ImportanceLevel.Moderate]: 60, [ImportanceLevel.Important]: 80, [ImportanceLevel.Vital]: 100,

第230-234行:
OLD: ImportanceLevel.TRIVIAL, ImportanceLevel.MINOR, ImportanceLevel.MODERATE, ImportanceLevel.IMPORTANT, ImportanceLevel.VITAL
NEW: ImportanceLevel.Trivial, ImportanceLevel.Minor, ImportanceLevel.Moderate, ImportanceLevel.Important, ImportanceLevel.Vital

第375-380行:
OLD: [ImportanceLevel.VITAL]: 5, [ImportanceLevel.IMPORTANT]: 4, ...
NEW: [ImportanceLevel.Vital]: 5, [ImportanceLevel.Important]: 4, [ImportanceLevel.Moderate]: 3, [ImportanceLevel.Minor]: 2, [ImportanceLevel.Trivial]: 1,
```

**文件**: `apps/api/src/modules/task/application/TaskQueryValidator.ts`

同样的修复在此文件中多处出现。

---

### ✅ 修复3: 修复TaskContainer导入路径 (15分钟)

**文件**: `apps/api/src/modules/task/application/TaskQueryService.ts` 行28

**问题**: 
```typescript
import { TaskContainer } from '../../infrastructure/di/TaskContainer';  // ❌ 路径不对
```

**查找正确的路径**:
```bash
find . -name "*Container*" -o -name "*DI*" -o -name "*di*" | grep -i task
```

**可能的位置**:
- `apps/api/src/modules/task/infrastructure/TaskContainer.ts`
- `packages/infrastructure-server/src/task/container.ts`
- 或者根本不存在，需要创建

**临时修复** (如果找不到，使用此方法):
```typescript
// 如果 TaskContainer 不存在，改为直接创建实例
private constructor(templateRepository: ITaskTemplateRepository) {
  this.templateRepository = templateRepository;
}

static async createInstance(
  templateRepository?: ITaskTemplateRepository
): Promise<TaskQueryService> {
  if (!templateRepository) {
    throw new Error('templateRepository must be provided');
  }
  TaskQueryService.instance = new TaskQueryService(templateRepository);
  return TaskQueryService.instance;
}
```

---

### ✅ 修复4: 修复dueDate类型声明 (10分钟)

**文件**: `apps/api/src/modules/task/application/TaskQueryService.ts` 行217

**问题**:
```typescript
return this.matchesDueDateFilter(dto.dueDate, dateFilter, currentTime);
// ❌ dto.dueDate 可能是 number | null | undefined，但期望 number | null
```

**修复**:
```typescript
return this.matchesDueDateFilter(
  dto.dueDate ?? null,  // 将 undefined 转换为 null
  dateFilter, 
  currentTime
);
```

---

### ✅ 修复5: 修复测试中的mock对象类型 (30分钟)

**文件**: `packages/application-server/src/task/services/task-query.service.spec.ts`

**问题**: 有10处 mock 对象返回不正确的类型

```typescript
// ❌ 错误的
mockTemplateRepository.findByStatus = async (accountUuid: string, status: any) => {
  return [{ uuid: 'test', toServerDTO: () => ({...}) }];
};

// ✅ 正确的
mockTemplateRepository.findByStatus = async (accountUuid: string, status: any) => {
  const mockTemplate = {
    uuid: 'test-uuid',
    toServerDTO: () => ({
      uuid: 'test-uuid',
      accountUuid: 'account-123',
      title: 'Test Task',
      // ... 其他必需字段
    }),
  };
  return [mockTemplate] as any; // 使用 as any 作为临时修复
};
```

**更好的长期修复**:
创建一个 mock 工厂函数:
```typescript
function createMockTaskTemplate(overrides?: Partial<TaskTemplate>): TaskTemplate {
  return {
    uuid: 'test-uuid',
    toServerDTO: () => ({ /* ... */ }),
    ...overrides,
  } as TaskTemplate;
}

// 然后在测试中使用:
mockTemplateRepository.findByStatus = async () => {
  return [createMockTaskTemplate()];
};
```

---

### ✅ 修复6: 修复基准测试导入 (15分钟)

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/benchmark-utils.ts`

**问题**:
```typescript
import { TaskTemplateServerDTO } from '@dailyuse/contracts';  // ❌ 路径不对
import { ImportanceLevel } from '@dailyuse/contracts';        // ❌ 路径不对
```

**修复**:
```typescript
import { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
```

---

### ✅ 修复7: 修复基准测试异步调用 (5分钟)

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/service-sorting.bench.ts` 行20

**问题**:
```typescript
service = TaskQueryService.getInstance();  // ❌ 返回 Promise，需要 await
```

**修复**:
```typescript
service = await TaskQueryService.getInstance();
```

同时确保 beforeAll 是 async:
```typescript
beforeAll(async () => {
  service = await TaskQueryService.getInstance();
  // ...
});
```

---

### ✅ 修复8: 修复稳定性基准测试返回值 (5分钟)

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/stability.bench.ts` 行56, 68

**问题**:
```typescript
() => sortByPriority(tasks),  // ❌ 返回数组，但 benchmark 期望 void
```

**修复**:
```typescript
() => { sortByPriority(tasks); }  // 用大括号包装，使其不返回值
```

---

## 验证修复 (按顺序执行)

```bash
# 1. 类型检查
pnpm nx run-many --target=typecheck

# 2. 构建检查
pnpm nx run-many --target=build

# 3. 测试 (可能仍需更多修复)
pnpm nx test application-server --testFile=task-query.service.spec

# 4. API 构建
pnpm nx build api
```

---

## Story 1.5 关键缺失实现

**文件**: `packages/application-server/src/task/services/task-query.service.ts`

**需要添加的方法**:

```typescript
/**
 * 为单个任务 DTO 丰富优先级信息
 */
private enrichWithPriority(
  dto: TaskTemplateServerDTO,
  currentTime: Date = new Date()
): TaskTemplateServerDTO & { priority: number } {
  const dueDate = this.extractDueDate(dto);
  const priority = calculateTaskPriority(dto.importance, dueDate, currentTime);
  return { ...dto, priority };
}

/**
 * 为多个任务批量计算优先级
 */
private enrichMultipleWithPriority(
  dtos: TaskTemplateServerDTO[],
  currentTime: Date = new Date()
): Array<TaskTemplateServerDTO & { priority: number }> {
  return dtos.map(dto => this.enrichWithPriority(dto, currentTime));
}

/**
 * 从 DTO 中提取截止日期
 * TaskTemplate 使用 TimeConfig 对象，需要特殊处理
 */
private extractDueDate(dto: TaskTemplateServerDTO): Date | null {
  if (!dto.timeConfig) return null;
  if (typeof dto.timeConfig.dueDate === 'number') {
    return new Date(dto.timeConfig.dueDate);
  }
  return null;
}

/**
 * 获取按优先级排序的活跃任务列表
 */
async getTasksWithPrioritySorting(
  accountUuid: string,
  sortBy: 'priority' | 'completedAt' = 'priority',
  currentTime: Date = new Date()
): Promise<Array<TaskTemplateServerDTO & { priority: number }>> {
  // 查询活跃任务
  const activeStatuses = [TaskTemplateStatus.ACTIVE, TaskTemplateStatus.PAUSED];
  
  let templates: TaskTemplate[] = [];
  for (const status of activeStatuses) {
    const byStatus = await this.templateRepository.findByStatus(accountUuid, status);
    templates.push(...byStatus);
  }
  
  // 转换为 DTO
  const dtos = templates.map(t => t.toServerDTO());
  
  // 计算优先级
  const enriched = this.enrichMultipleWithPriority(dtos, currentTime);
  
  // 排序
  return this.sortByPriority(enriched);
}

/**
 * 按优先级排序 (Backlog 任务排在最后)
 */
private sortByPriority(
  dtos: Array<TaskTemplateServerDTO & { priority: number }>
): Array<TaskTemplateServerDTO & { priority: number }> {
  return dtos.sort((a, b) => {
    const aHasDueDate = a.timeConfig?.dueDate != null;
    const bHasDueDate = b.timeConfig?.dueDate != null;
    
    // 有期限的任务排在前
    if (aHasDueDate && !bHasDueDate) return -1;
    if (!aHasDueDate && bHasDueDate) return 1;
    
    // 按优先级降序
    return b.priority - a.priority;
  });
}
```

---

## Story 2.4 关键缺失实现

**文件**: `apps/web/src/modules/task/presentation/components/cards/TaskTemplateCard.vue`

**需要添加的部分**:

```vue
<template>
  <!-- 添加优先级颜色类绑定 -->
  <v-card
    class="template-card"
    :class="getPriorityClass(template.priority)"
    elevation="2"
  >
    <v-card-title class="template-header">
      <!-- 优先级指示符 icon (>=80 时显示) -->
      <div v-if="template.priority >= 80" class="priority-indicator">
        <v-icon
          :color="getPriorityColor(template.priority)"
          :class="{ 'pulse-animation': template.priority >= 90 }"
        >
          {{ getPriorityIcon(template.priority) }}
        </v-icon>
      </div>

      <h3 class="template-title">{{ template.title }}</h3>
    </v-card-title>
    <!-- 其他内容... -->
  </v-card>
</template>

<script setup lang="ts">
function getPriorityClass(priority: number): string {
  if (priority >= 80) return 'priority-high';
  if (priority >= 60) return 'priority-medium';
  return 'priority-low';
}

function getPriorityColor(priority: number): string {
  if (priority >= 80) return '#DC2626';  // red-600
  if (priority >= 60) return '#F59E0B';  // amber-500
  return '#9CA3AF';                      // gray-400
}

function getPriorityIcon(priority: number): string {
  if (priority >= 90) return 'mdi-flash';  // ⚡
  if (priority >= 80) return 'mdi-arrow-up';  // ⬆️
  return 'mdi-pin';  // 📌
}
</script>

<style scoped>
.priority-high {
  border: 2px solid var(--priority-high-border, #DC2626);
  background-color: var(--priority-high-bg, #FEE2E2);
}

.priority-medium {
  border: 2px solid var(--priority-medium-border, #F59E0B);
  background-color: var(--priority-medium-bg, #FFFBEB);
}

.priority-low {
  border: 2px solid var(--priority-low-border, #9CA3AF);
  background-color: var(--priority-low-bg, #F3F4F6);
}

.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Dark 主题 */
[data-theme='dark'] .priority-high {
  border-color: var(--priority-high-border-dark, #FCA5A5);
  background-color: var(--priority-high-bg-dark, #7F1D1D);
  color: var(--priority-high-text-dark, #FECACA);
}

[data-theme='dark'] .priority-medium {
  border-color: var(--priority-medium-border-dark, #FBBF24);
  background-color: var(--priority-medium-bg-dark, #78350F);
  color: var(--priority-medium-text-dark, #FCD34D);
}

[data-theme='dark'] .priority-low {
  border-color: var(--priority-low-border-dark, #9CA3AF);
  background-color: var(--priority-low-bg-dark, #374151);
  color: var(--priority-low-text-dark, #D1D5DB);
}
</style>
```

---

## 总结：修复时间估算

| 修复项 | 耗时 | 优先级 |
|--------|------|--------|
| 1. 类型导出 | 5分 | P0 |
| 2. 枚举大小写 | 15分 | P0 |
| 3. TaskContainer 导入 | 15分 | P0 |
| 4. dueDate 类型 | 10分 | P0 |
| 5. Mock 对象修复 | 30分 | P0 |
| 6. 基准测试导入 | 15分 | P0 |
| 7. 异步调用 | 5分 | P0 |
| 8. 返回值修复 | 5分 | P0 |
| **小计** | **1小时30分** | **P0** |
| 9. Story 1.5 完整实现 | 2小时 | P1 |
| 10. Story 2.4 实现 | 2小时 | P1 |
| **总计** | **5小时30分** | - |

---

## 验证步骤

完成所有修复后:

```bash
# 1. 清理
rm -rf dist node_modules/.cache

# 2. 完整类型检查
pnpm nx run-many --target=typecheck

# 3. 全量构建
pnpm nx run-many --target=build

# 4. 运行关键测试
pnpm nx test application-server -- --testFile=task-query.service.spec
pnpm nx test domain-server -- --testFile=priority-calculator

# 5. 端到端测试 (如果有)
pnpm nx e2e web
pnpm nx e2e desktop

# 最后检查编译：
pnpm nx affected --target=build
```

成功标志：所有命令都返回 exit code 0，无错误信息。
