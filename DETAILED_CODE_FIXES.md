# 详细代码修复方案

## 修复1: 导出缺失的类型定义

**文件**: `packages/contracts/src/modules/task/index.ts`

**当前状态**: TaskSortBy 和 TaskFilterBy 在 queries.ts 中定义但未导出

**修复方案**:

```typescript
// 在 packages/contracts/src/modules/task/index.ts 末尾添加:

export {
  TaskSortBy,
  TaskFilterBy,
  type QueryTasksRequest,
  type TasksListResponse,
} from './queries';
```

**验证**:
```bash
pnpm nx run contracts:typecheck
# 应该不再有 "has no exported member 'TaskSortBy'" 错误
```

---

## 修复2: 修复ImportanceLevel枚举大小写错误

**文件1**: `apps/api/src/modules/task/application/TaskQueryService.ts`

**当前问题**: 多处使用 `ImportanceLevel.VITAL` 等大写枚举值，但实际值是 `ImportanceLevel.Vital`

**位置和修复**:

```typescript
// ❌ 第121-126行 (在 enrichTasksByImportanceScore 方法中)
const importanceMap: Record<ImportanceLevel, number> = {
  [ImportanceLevel.TRIVIAL]: 20,
  [ImportanceLevel.MINOR]: 40,
  [ImportanceLevel.MODERATE]: 60,
  [ImportanceLevel.IMPORTANT]: 80,
  [ImportanceLevel.VITAL]: 100,
};

// ✅ 修复为:
const importanceMap: Record<ImportanceLevel, number> = {
  [ImportanceLevel.Trivial]: 20,
  [ImportanceLevel.Minor]: 40,
  [ImportanceLevel.Moderate]: 60,
  [ImportanceLevel.Important]: 80,
  [ImportanceLevel.Vital]: 100,
};
```

```typescript
// ❌ 第230-234行 (在 matchesImportanceFilter 方法中)
const thresholds: ImportanceLevel[] = [
  ImportanceLevel.TRIVIAL,    // 1
  ImportanceLevel.MINOR,      // 2
  ImportanceLevel.MODERATE,   // 3
  ImportanceLevel.IMPORTANT,  // 4
  ImportanceLevel.VITAL,      // 5
];

// ✅ 修复为:
const thresholds: ImportanceLevel[] = [
  ImportanceLevel.Trivial,    // 1
  ImportanceLevel.Minor,      // 2
  ImportanceLevel.Moderate,   // 3
  ImportanceLevel.Important,  // 4
  ImportanceLevel.Vital,      // 5
];
```

```typescript
// ❌ 第375-380行 (在 sortByImportance 方法中)
const importanceValues: Record<ImportanceLevel, number> = {
  [ImportanceLevel.VITAL]: 5,
  [ImportanceLevel.IMPORTANT]: 4,
  [ImportanceLevel.MODERATE]: 3,
  [ImportanceLevel.MINOR]: 2,
  [ImportanceLevel.TRIVIAL]: 1,
};

// ✅ 修复为:
const importanceValues: Record<ImportanceLevel, number> = {
  [ImportanceLevel.Vital]: 5,
  [ImportanceLevel.Important]: 4,
  [ImportanceLevel.Moderate]: 3,
  [ImportanceLevel.Minor]: 2,
  [ImportanceLevel.Trivial]: 1,
};
```

**文件2**: `apps/api/src/modules/task/application/TaskQueryValidator.ts`

**同样的修复**应应用于此文件中的所有大小写错误。

**使用批量替换工具**:
```bash
# 在 IDE 中使用 Find & Replace (Ctrl+H):
# 查找: ImportanceLevel\.VITAL
# 替换为: ImportanceLevel.Vital

# 查找: ImportanceLevel\.IMPORTANT
# 替换为: ImportanceLevel.Important

# 查找: ImportanceLevel\.MODERATE
# 替换为: ImportanceLevel.Moderate

# 查找: ImportanceLevel\.MINOR
# 替换为: ImportanceLevel.Minor

# 查找: ImportanceLevel\.TRIVIAL
# 替换为: ImportanceLevel.Trivial
```

---

## 修复3: 修复TaskContainer导入路径

**文件**: `apps/api/src/modules/task/application/TaskQueryService.ts` 第28行

**当前问题**: 
```typescript
import { TaskContainer } from '../../infrastructure/di/TaskContainer';
// ❌ 错误: Cannot find module '../../infrastructure/di/TaskContainer'
```

**查找正确路径**:
```bash
# 在项目根目录运行:
find . -name "*Container*" -type f 2>/dev/null | grep -v node_modules | head -20
find . -name "*container*" -type f 2>/dev/null | grep -v node_modules | head -20
```

**可能的修复选项**:

### 选项A: 如果 TaskContainer 存在于其他位置

假设 TaskContainer 在 `packages/infrastructure-server/src/task/container.ts`:

```typescript
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
```

### 选项B: 如果 TaskContainer 需要创建

创建 `apps/api/src/modules/task/infrastructure/di/TaskContainer.ts`:

```typescript
import { ITaskTemplateRepository } from '@dailyuse/domain-server/task';
import { TaskTemplateRepository } from '../repositories/TaskTemplateRepository';

export class TaskContainer {
  private static instance: TaskContainer;
  private templateRepository: ITaskTemplateRepository;

  private constructor() {
    // 初始化仓储
    this.templateRepository = new TaskTemplateRepository();
  }

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  getTaskTemplateRepository(): ITaskTemplateRepository {
    return this.templateRepository;
  }
}
```

### 选项C: 如果不需要容器 (推荐简化方案)

直接在 TaskQueryService 中接受仓储作为参数:

```typescript
export class TaskQueryService {
  private static instance: TaskQueryService;
  private templateRepository: ITaskTemplateRepository;

  private constructor(templateRepository: ITaskTemplateRepository) {
    this.templateRepository = templateRepository;
  }

  /**
   * 创建实例 (必须提供 templateRepository)
   */
  static async createInstance(
    templateRepository: ITaskTemplateRepository
  ): Promise<TaskQueryService> {
    if (!templateRepository) {
      throw new Error('templateRepository is required');
    }
    TaskQueryService.instance = new TaskQueryService(templateRepository);
    return TaskQueryService.instance;
  }

  /**
   * 获取实例
   */
  static async getInstance(
    templateRepository?: ITaskTemplateRepository
  ): Promise<TaskQueryService> {
    if (!TaskQueryService.instance) {
      if (!templateRepository) {
        throw new Error('templateRepository must be provided on first call');
      }
      TaskQueryService.instance = new TaskQueryService(templateRepository);
    }
    return TaskQueryService.instance;
  }

  // ... 其他方法
}
```

**然后在使用时**:

```typescript
// 在 TaskTemplateController 中
const templateRepository = TaskContainer.getInstance().getTaskTemplateRepository();
const queryService = await TaskQueryService.getInstance(templateRepository);
```

---

## 修复4: 修复dueDate类型声明

**文件**: `apps/api/src/modules/task/application/TaskQueryService.ts` 第217行

**当前问题**:
```typescript
return this.matchesDueDateFilter(dto.dueDate, dateFilter, currentTime);
// ❌ Argument of type 'number | null | undefined' is not assignable to type 'number | null'
```

**修复**:
```typescript
// 选项1: 使用 null 合并运算符
return this.matchesDueDateFilter(
  dto.dueDate ?? null,
  dateFilter,
  currentTime
);

// 选项2: 类型守卫
return this.matchesDueDateFilter(
  dto.dueDate != null ? dto.dueDate : null,
  dateFilter,
  currentTime
);

// 选项3: 修改函数签名以接受 undefined
private matchesDueDateFilter(
  dueDate: number | null | undefined,  // 添加 undefined
  dateFilter: string,
  currentTime: Date
): boolean {
  // ... 实现
}
```

**推荐**: 选项1 (最简洁)

---

## 修复5: 修复测试中的Mock对象类型

**文件**: `packages/application-server/src/task/services/task-query.service.spec.ts`

**当前问题**: 10处 mock 对象返回不匹配的类型

### 方案1: 快速修复 (使用 `as any`)

```typescript
// ❌ 原代码第662行
mockTemplateRepository.findByStatus = async (accountUuid: string, status: any) => {
  return [{ uuid: 'test', toServerDTO: () => ({...}) }];
};

// ✅ 快速修复
mockTemplateRepository.findByStatus = async (accountUuid: string, status: any) => {
  return [{ uuid: 'test', toServerDTO: () => ({...}) }] as any;
};
```

**应用于所有10处**:
- 行662, 732, 788, 841, 893, 938, 983, 1028, 1073, 1124

### 方案2: 完整修复 (创建 mock 工厂)

创建 `packages/application-server/src/task/services/__tests__/mock-factory.ts`:

```typescript
import type { TaskTemplate } from '@dailyuse/domain-server/task';
import type { TaskTemplateServerDTO } from '@dailyuse/contracts/task';

export function createMockTaskTemplate(overrides?: Partial<{
  uuid: string;
  title: string;
  importance: any;
  timeConfig: any;
}>): any {
  return {
    uuid: overrides?.uuid || 'test-uuid-' + Date.now(),
    title: overrides?.title || 'Test Task',
    importance: overrides?.importance || 'moderate',
    timeConfig: overrides?.timeConfig || null,
    status: 'ACTIVE',
    toServerDTO: (): TaskTemplateServerDTO => ({
      uuid: overrides?.uuid || 'test-uuid',
      accountUuid: 'test-account',
      title: overrides?.title || 'Test Task',
      description: null,
      taskType: 'ONE_TIME',
      importance: overrides?.importance || 'moderate',
      timeConfig: overrides?.timeConfig || null,
      status: 'ACTIVE',
      tags: [],
      color: null,
      folderUuid: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // ... 其他必需字段
    }),
  } as any;
}
```

然后在测试中使用:

```typescript
import { createMockTaskTemplate } from './mock-factory';

mockTemplateRepository.findByStatus = async () => {
  return [
    createMockTaskTemplate({ title: 'Task 1' }),
    createMockTaskTemplate({ title: 'Task 2' }),
  ];
};
```

---

## 修复6: 修复基准测试导入

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/benchmark-utils.ts`

**当前问题** (行6-7):
```typescript
import { TaskTemplateServerDTO } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';
// ❌ 这些类型不在顶级包导出中
```

**修复**:
```typescript
import { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
```

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/service-sorting.bench.ts`

**同样的修复**:
```typescript
// ❌ 当前 (行14)
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts';

// ✅ 修复为
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';
```

---

## 修复7: 修复基准测试异步调用

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/service-sorting.bench.ts`

**当前问题** (行20):
```typescript
service = TaskQueryService.getInstance();
// ❌ getInstance() 返回 Promise<TaskQueryService>，但没有 await
```

**修复** (行18-20):
```typescript
// 确保 beforeAll 是 async
beforeAll(async () => {
  service = await TaskQueryService.getInstance(mockRepository);
  // ... 其他初始化
});
```

同时检查所有其他 `getInstance()` 调用:

```bash
# 在文件中搜索
grep -n "getInstance()" apps/api/src/modules/task/application/__tests__/benchmarks/service-sorting.bench.ts
# 确认都有 await
```

---

## 修复8: 修复稳定性基准测试返回值

**文件**: `apps/api/src/modules/task/application/__tests__/benchmarks/stability.bench.ts`

**当前问题** (行56, 68):
```typescript
() => sortByPriority(tasks),
// ❌ sortByPriority 返回数组，但 benchmark 期望 void | Promise<void>
```

**修复**:
```typescript
// 选项1: 用大括号包装
() => { sortByPriority(tasks); }

// 选项2: 丢弃返回值
() => void sortByPriority(tasks)

// 选项3: 将结果赋给变量
() => { const _ = sortByPriority(tasks); }
```

**推荐**: 选项1

完整修复:
```typescript
describe('Stability Benchmarks', () => {
  // ...
  
  it('should maintain consistent performance across 100 iterations', async () => {
    const result = await benchmark(
      'sortByPriority - stability',
      () => { sortByPriority(tasks); },  // ✅ 修复
      2000,
      100
    );
    
    expect(result.stdDevMs).toBeLessThan(result.avgMs * 0.1);
  });

  it('should have no degradation from 1st to 100th operation', async () => {
    const firstHalf = await benchmark(
      'sortByPriority - first 50',
      () => { sortByPriority(tasks); },  // ✅ 修复
      2000,
      50
    );
    
    // ... 验证逻辑
  });
});
```

---

## 完整性检查 - 验证所有修复

### 运行编译检查

```bash
# 1. 类型检查
pnpm nx run-many --target=typecheck

# 2. 构建验证
pnpm nx run contracts:build
pnpm nx run domain-server:build
pnpm nx run application-server:build
pnpm nx run api:build

# 3. 测试验证
pnpm nx test application-server -- --testFile=task-query.service.spec
pnpm nx test domain-server -- --testFile=priority-calculator.service.spec

# 4. 性能基准 (如果修复完成)
pnpm nx run api:bench 2>/dev/null | head -20
```

### 预期结果

✅ 所有命令应该成功执行，无编译错误

```
✓ Typecheck: PASS (0 errors)
✓ Build: PASS (all packages)
✓ Tests: PASS (>=80% coverage)
✓ Benchmarks: EXECUTABLE
```

---

## 故障排除

### 如果修复后仍有编译错误

1. **清理缓存**:
   ```bash
   rm -rf dist node_modules/.cache .nx/cache
   pnpm install
   ```

2. **验证 tsconfig**:
   ```bash
   cat tsconfig.json | grep strict
   # 应该显示 "strict": true
   ```

3. **逐个包编译**:
   ```bash
   pnpm nx build contracts
   pnpm nx build domain-server
   # 逐个查找问题
   ```

### 如果导入仍然失败

1. **检查导出**:
   ```bash
   grep -n "export.*TaskSortBy\|export.*TaskFilterBy" packages/contracts/src/modules/task/*.ts
   ```

2. **检查 barrel 导出**:
   ```bash
   cat packages/contracts/src/modules/task/index.ts | grep -E "TaskSortBy|TaskFilterBy"
   ```

### 如果测试仍然失败

1. **检查 mock 设置**:
   ```typescript
   // 在测试顶部添加调试
   console.log('mockRepository:', mockTemplateRepository);
   console.log('findByStatus:', typeof mockTemplateRepository.findByStatus);
   ```

2. **验证 mock 返回**:
   ```typescript
   const result = await mockTemplateRepository.findByStatus('uuid', 'ACTIVE');
   console.log('Mock result:', result);
   ```

---

## 修复顺序建议

**立即执行** (15分钟):
1. 修复1: 导出缺失的类型 (5分钟)
2. 修复2: 枚举大小写 (5分钟)
3. 修复3: TaskContainer 路径 (5分钟)

**验证编译** (5分钟):
```bash
pnpm nx run-many --target=typecheck
```

**继续修复** (30分钟):
4. 修复4: dueDate 类型 (5分钟)
5. 修复5: Mock 对象 (15分钟)
6. 修复6-8: 基准测试 (10分钟)

**再次验证** (5分钟):
```bash
pnpm nx run-many --target=build
```

**总计**: 约 1 小时，应该完全解决所有 P0 编译错误。

---

## 下一步行动

修复所有 P0 编译错误后，立即开始 P1 实现:

- Story 1.5: 完成 TaskQueryService 方法实现
- Story 2.5: 完成 TaskQueryValidator 实现
- Story 2.6: 完成基准测试实现

见 [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md) 中的 Story 1.5 和 Story 2.4 部分了解详细实现要求。
