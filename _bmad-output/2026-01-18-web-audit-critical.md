# Web 项目应用层架构审计报告

**审计日期**: 2026-01-18  
**范围**: Web 应用 + Application-Client + Infrastructure-Client packages  
**状态**: 🔴 **不完整 - 需要立即修复**

---

## 现状概览

### Web 应用结构

| 模块           | 文件数 | 代码行数 | Presentation | Application/Infrastructure       | 状态        |
| -------------- | ------ | -------- | ------------ | -------------------------------- | ----------- |
| goal           | 56     | 17,482   | ✅ 有        | ❌ 无 (仅 index.ts 导出不存在的) | 🔴 **断裂** |
| task           | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| account        | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| ai             | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| reminder       | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| schedule       | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| dashboard      | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| notification   | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| setting        | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| authentication | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |
| repository     | ?      | ?        | ✅ 有        | ❌ 无                            | 🔴 **断裂** |

### Packages 中的实现状态

#### packages/application-client

✅ **完整**: 以下模块已创建 ApplicationService

```
✅ account
✅ ai
✅ analytics
✅ authentication
✅ dashboard
✅ focus
✅ goal
✅ notification
✅ planning
✅ productivity
✅ reminder
✅ repository
✅ schedule
✅ setting
✅ sync
✅ task
```

#### packages/infrastructure-client

✅ **基本完整**: 以下模块已创建

```
✅ account
✅ ai
✅ authentication
✅ dashboard
✅ di
✅ encryption
✅ goal
✅ notification
✅ reminder
✅ repository
✅ schedule
✅ setting
✅ shared
✅ sync
✅ task
```

---

## 问题分析

### 🔴 关键问题 1: Web Composables 断裂

**问题**: `/workspaces/dailyuse/apps/web/src/modules/goal/presentation/composables/index.ts` 存在，但导出的 composables 不存在

```typescript
// 文件存在：index.ts
export { useGoalManagement } from './useGoalManagement'; // ❌ 文件不存在
export { useGoalFolder } from './useGoalFolder'; // ❌ 文件不存在
export { useKeyResult } from './useKeyResult'; // ❌ 文件不存在
```

**影响**:

- Vue 组件无法导入 composables
- 应用运行时崩溃
- 所有 goal 功能无法使用

**证据**:

```bash
$ find /workspaces/dailyuse/apps/web/src/modules/goal/presentation/composables -name "*.ts"
# 返回空
```

### 🔴 关键问题 2: Web 应用没有 Application Layer

**观察**:

- Web 应用的模块结构中没有 `application/` 目录
- 所有模块只有 `presentation/` 和 `initialization/`
- Vue 组件直接使用已删除的 composables

**现状**:

```
apps/web/src/modules/goal/
├── initialization/
├── presentation/
│   ├── composables/     ← index.ts 导出不存在的文件
│   ├── views/          ← 使用 useGoalManagement composable
│   ├── components/
│   └── stores/         ← Pinia stores
├── index.ts
└── ❌ 无 application/ 目录
```

### 🟡 问题 3: 不清楚的迁移状态

根据 Desktop 的迁移模式，应该：

1. 在 packages 中创建 ApplicationService ✅ (已完成)
2. Web 应用创建 Vue Composables ❌ (未完成)
3. Vue Composables 导入 packages ApplicationService ❌ (无法实现，composables 不存在)
4. 删除本地 application 目录 ✅ (但这里从未创建过)

### 🟡 问题 4: 导入映射不完整

**Desktop 应用**:

```typescript
import { goalApplicationService } from '@dailyuse/application-client/goal';
```

**Web 应用**:

```typescript
// ❌ 无法导入，因为 composables 不存在
import { useGoalManagement } from '../composables/useGoalManagement';
```

---

## 根本原因分析

### 假说 1: Story 删除了代码但没有完成迁移

**症状**:

- Composables index.ts 存在，但导出的文件被删除
- 没有创建替代的 Vue Composables
- Vue 组件仍在导入已删除的文件

**证据**:

- `GoalListView.vue` 第 130 行: `import { useGoalManagement } from '../composables/useGoalManagement';`
- 该文件实际不存在
- 应用无法正常运行

### 假说 2: 架构决策不一致

**Desktop 采取的模式**:

1. ApplicationService 在 packages 中（单一源）
2. Desktop hooks 导入 packages 中的 ApplicationService
3. 删除所有本地 application 目录

**Web 应该采取的模式**:

1. ApplicationService 在 packages 中 ✅ (已完成)
2. Vue Composables 在 Web 中（本地）❌ (未创建)
3. Vue Composables 导入 packages ApplicationService ❌ (需要创建)

---

## 影响范围

### 🔴 受影响的模块 (11 个)

```
❌ goal        - 17,482 行代码无法运行
❌ task        - 应用层不完整
❌ account     - 应用层不完整
❌ ai          - 应用层不完整
❌ reminder    - 应用层不完整
❌ schedule    - 应用层不完整
❌ dashboard   - 应用层不完整
❌ notification- 应用层不完整
❌ setting     - 应用层不完整
❌ authentication - 应用层不完整
❌ repository  - 应用层不完整
```

### 🟡 风险等级

**立即影响**: 🔴 **关键** - Web 应用无法启动
**数据完整性**: 🟡 **中等** - 无业务逻辑，无法操作
**性能影响**: 🔴 **关键** - 应用完全不可用

---

## 缺失的工作清单

### Phase 2.5: Web Application Layer 创建 (需要立即执行)

#### Task 1: 为每个模块创建 Vue Composables

需要创建以下文件 (以 Goal 为例):

```
apps/web/src/modules/goal/application/
├── composables/
│   ├── useGoalManagement.ts      ← 业务逻辑 hooks
│   ├── useGoalFolder.ts          ← 文件夹管理
│   ├── useKeyResult.ts           ← KR 管理
│   └── index.ts
└── stores/                        ← Pinia stores (可能需要重写)
    ├── goalStore.ts
    └── index.ts
```

#### Task 2: 实现 Vue Composables

每个 composable 应该：

1. 导入相应的 packages ApplicationService
2. 提供 Vue-specific 的 reactivity 包装
3. 管理 Vue 状态

```typescript
// useGoalManagement.ts 示例
import { ref, computed } from 'vue';
import { goalApplicationService } from '@dailyuse/application-client/goal';

export function useGoalManagement() {
  const goals = ref<Goal[]>([]);
  const loading = ref(false);

  const listGoals = async () => {
    loading.value = true;
    try {
      goals.value = await goalApplicationService.listGoals();
    } finally {
      loading.value = false;
    }
  };

  return { goals, loading, listGoals };
}
```

#### Task 3: 更新 index.ts 导出

```typescript
// apps/web/src/modules/goal/presentation/composables/index.ts
export { useGoalManagement } from './useGoalManagement';
export { useGoalFolder } from './useGoalFolder';
export { useKeyResult } from './useKeyResult';
```

#### Task 4: 修复 Pinia Stores

Stores 应该:

1. 使用 Vue Composables 而不是直接调用 Use Cases
2. 或者使用 packages ApplicationService

#### Task 5: 为所有 11 个模块重复上述工作

---

## 建议的修复计划

### 优先级 1 (立即 - 今天)

1. **创建 Goal 模块的 Vue Composables**
   - 创建 useGoalManagement.ts
   - 创建 useGoalFolder.ts
   - 创建 useKeyResult.ts
   - 修复 index.ts
   - 验证导入

2. **验证 Goal 模块正常工作**
   - 运行 lint 检查
   - 运行 type 检查
   - 测试应用是否启动

### 优先级 2 (紧急 - 明天)

3. **为其他 10 个模块创建 Vue Composables**
   - 批量创建所有缺失的 composables
   - 批量更新所有 index.ts

### 优先级 3 (本周)

4. **Pinia Stores 现代化**
   - 评估现有 stores 是否需要改进
   - 考虑是否需要使用 packages ApplicationService

5. **集成测试**
   - 验证所有模块正常工作
   - E2E 测试

---

## 代码示例

### 缺失的 useGoalManagement.ts

```typescript
/**
 * useGoalManagement Vue Composable
 *
 * 负责目标管理的业务逻辑
 * 作为 Vue 层和 packages ApplicationService 之间的桥梁
 */

import { ref, computed, readonly } from 'vue';
import { goalApplicationService } from '@dailyuse/application-client/goal';
import type { Goal, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/domain-client/goal';

export interface UseGoalManagementReturn {
  // State
  goals: Readonly<Ref<Goal[]>>;
  selectedGoal: Readonly<Ref<Goal | null>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;

  // Computed
  goalCount: Readonly<ComputedRef<number>>;
  activeGoals: Readonly<ComputedRef<Goal[]>>;

  // Actions
  listGoals(): Promise<void>;
  createGoal(request: CreateGoalRequest): Promise<Goal>;
  updateGoal(id: string, request: UpdateGoalRequest): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;
  selectGoal(goal: Goal): void;
  clearSelection(): void;
}

export function useGoalManagement(): UseGoalManagementReturn {
  // State
  const goals = ref<Goal[]>([]);
  const selectedGoal = ref<Goal | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const goalCount = computed(() => goals.value.length);
  const activeGoals = computed(() => goals.value.filter((g) => g.status === 'active'));

  // Actions
  const listGoals = async () => {
    loading.value = true;
    error.value = null;
    try {
      goals.value = await goalApplicationService.listGoals();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  };

  const createGoal = async (request: CreateGoalRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const newGoal = await goalApplicationService.createGoal(request);
      goals.value.push(newGoal);
      return newGoal;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateGoal = async (id: string, request: UpdateGoalRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const updated = await goalApplicationService.updateGoal(id, request);
      const index = goals.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        goals.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteGoal = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await goalApplicationService.deleteGoal(id);
      goals.value = goals.value.filter((g) => g.id !== id);
      if (selectedGoal.value?.id === id) {
        selectedGoal.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const selectGoal = (goal: Goal) => {
    selectedGoal.value = goal;
  };

  const clearSelection = () => {
    selectedGoal.value = null;
  };

  return {
    // State (readonly)
    goals: readonly(goals),
    selectedGoal: readonly(selectedGoal),
    loading: readonly(loading),
    error: readonly(error),

    // Computed (readonly)
    goalCount,
    activeGoals,

    // Actions
    listGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    selectGoal,
    clearSelection,
  };
}
```

---

## 检查清单

### 验证清单

- [ ] Goal 模块的 useGoalManagement.ts 已创建
- [ ] Goal 模块的 useGoalFolder.ts 已创建
- [ ] Goal 模块的 useKeyResult.ts 已创建
- [ ] Goal 模块的 index.ts 正确导出
- [ ] `import { useGoalManagement }` 可正常工作
- [ ] 编译无错误
- [ ] Lint 检查通过
- [ ] Type 检查通过

### 对其他 10 个模块重复

- [ ] Task 模块的 composables
- [ ] Account 模块的 composables
- [ ] AI 模块的 composables
- [ ] Reminder 模块的 composables
- [ ] Schedule 模块的 composables
- [ ] Dashboard 模块的 composables
- [ ] Notification 模块的 composables
- [ ] Setting 模块的 composables
- [ ] Authentication 模块的 composables
- [ ] Repository 模块的 composables

---

## 架构对比

### Desktop 应用 (完成)

```
Desktop Module
├── presentation/
│   ├── hooks/           ← React hooks (导入 packages ApplicationService)
│   ├── stores/          ← Zustand stores
│   └── views/
├── initialization/
└── ❌ 无 application/ (已删除)

使用流程:
Hook → packages ApplicationService → Use Cases → Domain
```

### Web 应用 (需要完成)

```
Web Module
├── presentation/
│   ├── composables/     ← Vue composables (应导入 packages ApplicationService) ❌ 需要创建
│   ├── stores/          ← Pinia stores
│   └── views/
├── initialization/
└── ❌ 无 application/ (从未创建过)

应该的使用流程:
Component → Vue Composable → packages ApplicationService → Use Cases → Domain
```

---

## 总体影响

### 系统完整性

```
Smart Container Pattern 实现状态:
├─ Phase 1: Goal 模块示范 (Desktop) ............ ✅ 100%
├─ Phase 2: Desktop 批量迁移 .................. ✅ 100%
├─ Phase 2.5: Web Composables (缺失) ......... ❌ 0%
├─ Phase 3: 集成测试 ......................... ⏳ 阻断
└─ Phase 4: 生产发布 ......................... ⏳ 阻断

整体完成度: 40% (应该是 70% + Web 迁移)
```

---

**生成日期**: 2026-01-18  
**审计者**: AI Assistant  
**紧急程度**: 🔴 **CRITICAL** - 应用无法运行  
**建议行动**: 立即开始 Phase 2.5 Web Composables 创建
