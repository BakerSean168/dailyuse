# 🚨 完整代码提取审计报告

## 问题总结

**用户问题1：为什么会有 service 依赖框架的？**

Application层和Infrastructure层中不应该有任何框架依赖（Vue、Vuetify、Zustand等）。这些层应该是纯粹的业务逻辑，框架依赖应该在 Presentation 层处理。

**问题发现：**

- ❌ `goal/application/composables/` - Composables 是 Vue 框架特有的，不应该在 application 层
- ❌ `setting/application/services/ThemeService.ts` - 导入 `useTheme` from 'vuetify'，是框架依赖
- ❌ 多个模块的 services 导入 Zustand stores (useAccountStore, useAuthStore等)

**根本原因：**

1. **层级混淆** - 某些开发者把 Composables 放在 application 层（应该在 presentation 层）
2. **框架耦合** - 某些 ApplicationServices 直接导入 Zustand stores，导致无法提取到 Packages
3. **不完整的提取** - Packages 中的代码没有真正完全复制 Web 的业务逻辑

---

## 用户问题2：确认是否所有 Web 模块的 application、infrastructure 层都已移到 Packages 中

### 📊 对比分析

| Module             | Web服务数 | Packages服务数 | 状态          | 问题                                                                            |
| ------------------ | --------- | -------------- | ------------- | ------------------------------------------------------------------------------- |
| **account**        | 2         | 20             | ❌ 未完整提取 | Web还有 AccountProfileApplicationService, AccountSubscriptionApplicationService |
| **ai**             | 7         | 21             | ❌ 未完整提取 | Web还有 7 个 Application Services                                               |
| **authentication** | 8         | 26             | ⚠️ 部分重复   | Web和Packages都有相同的Services（看起来是复制品）                               |
| **goal**           | 15        | 35             | ❌ 未完整提取 | Web还有15个services，包括多个同步和框架相关的                                   |
| **notification**   | 0         | 12             | ✅ 完整提取   | 已正确提取                                                                      |
| **reminder**       | 4         | 27             | ❌ 未完整提取 | Web还有4个services                                                              |
| **repository**     | 0         | 10             | ✅ 完整提取   | 已正确提取                                                                      |
| **schedule**       | 3         | 28             | ❌ 未完整提取 | Web还有3个services                                                              |
| **setting**        | 2         | 8              | ❌ 未完整提取 | 包括 ThemeService（框架依赖）和 UserSettingWebApplicationService                |
| **task**           | 10        | 45             | ❌ 未完整提取 | Web还有10个services                                                             |

### 🔴 框架依赖问题

找到以下文件在 application/infrastructure 层中有框架依赖：

```
✗ apps/web/src/modules/account/application/events/accountEventHandlers.ts
✗ apps/web/src/modules/account/application/services/AccountProfileApplicationService.ts
✗ apps/web/src/modules/account/application/services/AccountSubscriptionApplicationService.ts
✗ apps/web/src/modules/ai/application/services/KnowledgeGenerationApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/ApiKeyApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/AuthApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/LoginApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/PasswordApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/RegistrationApplicationService.ts
✗ apps/web/src/modules/authentication/application/services/SessionApplicationService.ts
✗ apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts (← Vue Composable in application layer!)
✗ apps/web/src/modules/goal/application/composables/useGoal.ts (← Vue Composable in application layer!)
✗ apps/web/src/modules/goal/application/services/GoalSyncApplicationService.ts
✗ apps/web/src/modules/reminder/application/services/ReminderGroupApplicationService.ts
✗ apps/web/src/modules/reminder/application/services/ReminderStatisticsApplicationService.ts
✗ apps/web/src/modules/reminder/application/services/ReminderSyncApplicationService.ts
✗ apps/web/src/modules/reminder/application/services/ReminderTemplateApplicationService.ts
✗ apps/web/src/modules/setting/application/services/UserSettingWebApplicationService.ts
✗ apps/web/src/modules/setting/application/services/ThemeService.ts (← Vuetify dependency!)
✗ apps/web/src/modules/task/application/services/TaskStatisticsApplicationService.ts
✗ apps/web/src/modules/task/application/services/TaskSyncApplicationService.ts
```

---

## 关键发现

### 1. 结构问题：Vue Composables 不应该在 application 层

**目前的错误结构（goal 模块真实情况）：**

```
apps/web/src/modules/goal/application/
├── composables/                    ← ❌ 不应该在这里！
│   ├── useAutoStatusRules.ts       ← 使用 ref() 从 Vue
│   └── useWeightSnapshot.ts        ← 使用 ref, computed, watch
├── services/                       ← ✅ 应该在这里
│   ├── GoalFolderApplicationService.ts
│   ├── GoalManagementApplicationService.ts
│   ├── KeyResultApplicationService.ts
│   └── ...
└── ...
```

**正确的结构应该是：**

```
apps/web/src/modules/goal/
├── application/
│   ├── services/                   ← Business Logic (框架无关)
│   │   ├── GoalFolderApplicationService.ts (✅ 可以提取到 Packages)
│   │   ├── KeyResultApplicationService.ts
│   │   └── ...
│   └── ...
├── presentation/
│   ├── composables/                ← ✅ Vue Composables 应该在这里
│   │   ├── useAutoStatusRules.ts   (✅ 正确位置)
│   │   ├── useWeightSnapshot.ts    (✅ 正确位置)
│   │   └── useGoal.ts
│   ├── components/
│   └── ...
└── ...
```

**Composables 使用的 Vue API（framework-specific）：**

```typescript
// useAutoStatusRules.ts - 当前错误位置：application/composables/
import { ref } from 'vue';  ← ❌ 这是 Vue 框架特有的

export function useAutoStatusRules() {
  const isLoading = ref(false);  // ❌ Vue 响应式
  // ...
}
```

**应该移动到：**

```typescript
// 正确的位置：presentation/composables/useAutoStatusRules.ts
import { ref } from 'vue';  ← ✅ 这是正确的位置

export function useAutoStatusRules() {
  const isLoading = ref(false);  // ✅ Vue 响应式
  const statusRuleEngine = statusRuleEngineService;  // ✅ 注入业务逻辑服务
  // ...
}
```

### 2. 框架耦合：Services 直接导入 Zustand Stores

**真实代码示例1 - AuthApplicationService：**

```typescript
// apps/web/src/modules/authentication/application/services/AuthApplicationService.ts
import { useAuthenticationStore } from '../../presentation/stores/authenticationStore';  ← ❌ Pinia Store!

export class AuthApplicationService {
  private static instance: AuthApplicationService | null = null;

  static getInstance(): AuthApplicationService {
    if (!this.instance) {
      this.instance = new AuthApplicationService();
    }
    return this.instance;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const authStore = useAuthenticationStore();  // ❌ 框架依赖
    // ...
    authStore.setToken(response.token);  // ❌ 无法在 Packages 中使用
  }
}
```

**真实代码示例2 - GoalSyncApplicationService：**

```typescript
// apps/web/src/modules/goal/application/services/GoalSyncApplicationService.ts
import { getGoalStore } from '../../presentation/stores/goalStore';  ← ❌ Pinia Store!

export class GoalSyncApplicationService {
  async syncGoal() {
    const goalStore = getGoalStore();  // ❌ 框架特定的 Store 访问
    // 更新 Goal 数据到 Store
    goalStore.updateGoals(goals);  // ❌ 这依赖于 Web 框架
  }
}
```

**这些模块有 Store 耦合：**

- account (3个) ← `useAccountStore`
- ai (4个) ← 各种 AI 模块 stores
- authentication (7个) ← `useAuthenticationStore`
- goal (1个) ← `getGoalStore`
- reminder (4个) ← `useReminderStore`
- setting (1个) ← `useSettingStore`
- task (2个) ← `useTaskStore`

### 3. 不完整的提取

**对比 authentication 模块的例子：**

Web中的：

- AuthApplicationService.ts
- LoginApplicationService.ts
- PasswordApplicationService.ts
- SessionApplicationService.ts
- ApiKeyApplicationService.ts
- RegistrationApplicationService.ts
- TokenRefreshApplicationService.ts

Packages中的：

- AuthApplicationService.ts (看起来是复制品)
- LoginApplicationService.ts (看起来是复制品)
- PasswordApplicationService.ts (看起来是复制品)
- SessionApplicationService.ts (看起来是复制品)
- ApiKeyApplicationService.ts (看起来是复制品)
- RegistrationApplicationService.ts (看起来是复制品)
- 还有 20+ 个细粒度的 use cases (login.ts, register.ts等)

**问题：**

- 是否这些是真正复制过来的？
- Web 是否还在使用本地版本？
- Packages 版本是否都是最新的？
- 两个版本是否有差异导致的 bug？

---

## 根本原因

1. **缺乏清晰的架构规范**
   - Application 层定义不清楚：应该包含什么，不应该包含什么
   - Framework-specific vs Framework-agnostic 的界限模糊

2. **提取工作不完整**
   - 前面标记"完整"的提取实际上是不完整的
   - 既没有真正从 Web 移除，也没有真正在 Packages 中实现
   - 导致代码重复、状态混乱

3. **缺少验证步骤**
   - 没有检查 Web 中的 Services 是否还有框架依赖
   - 没有验证 Packages 中的版本是否真的有效
   - 没有检查删除 Web 版本后是否会破坏功能

---

## 正确的做法

### 第1步：理清层级职责

**Packages (Framework-Agnostic)**

```typescript
// 可以在这里的代码：
- 业务逻辑 (DTO 转换、验证、算法)
- 与数据库交互的逻辑
- API 调用逻辑
- 领域模型 (Domain Entities)
- 不需要框架的服务

// 示例：
export class GoalFolderApplicationService {
  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolder> {
    const validation = this.validate(request);  // ✅ 业务逻辑
    const dto = await this.apiClient.create(request);  // ✅ API 调用
    return GoalFolder.fromClientDTO(dto);  // ✅ 转换
  }
}
```

**Web Application (Framework-Specific)**

```typescript
// 应该在这里的代码：
- 使用 Zustand stores 的服务
- 使用 Vue composables 的逻辑
- 与 UI 框架集成的代码
- Web 特定的事件处理

// 示例（这类东西不应该在 application/services 中）：
export class GoalSyncApplicationService {
  async syncGoal() {
    const goalStore = useGoalStore();  // ❌ 如果在这里，就无法提取
    // ...
  }
}
```

**Web Presentation (UI Layer)**

```typescript
// 应该在这里的代码：
- Vue Composables
- 组件状态管理
- UI 逻辑
- 事件处理器

// 示例：
export function useWeightSnapshot() {  // ✅ Composable 在这里！
  const isLoading = ref(false);  // ✅ Vue 响应式状态
  const weightSnapshotService = weightSnapshotApplicationService;  // ✅ 注入服务
  // ...
}
```

### 第2步：正确的提取流程

```
For each Service in Web/src/modules/X/application/services/:
  1. 检查是否有框架依赖
     - 有 Store 导入？
     - 有 Vue 导入？
     - 有 Vuetify 导入？

  2. 如果没有框架依赖：
     - 复制到 Packages (如果还没有)
     - 验证 Packages 版本是否与 Web 相同
     - 更新 Web index.ts 导入 Packages 版本
     - 删除 Web 本地版本

  3. 如果有框架依赖：
     - ✅ 保留在 Web
     - ⚠️ 考虑重构：能否移除框架依赖？
```

---

## 下一步行动计划

### 紧急修复（应该立即做）

1. **移动 Composables 到正确的位置**

   ```bash
   mv apps/web/src/modules/goal/application/composables/*
      apps/web/src/modules/goal/presentation/composables/
   ```

2. **清理 goal/application/index.ts**
   - 删除对 composables 的任何导出

### 审计和验证

对每个模块执行完整的提取检查：

- [ ] **account** - 审计所有 Services，识别框架依赖
- [ ] **ai** - 检查 KnowledgeGenerationApplicationService
- [ ] **authentication** - 验证 Services 是否有 Store 依赖
- [ ] **goal** - 修复 composables 位置，审计其他 Services
- [ ] **reminder** - 检查 Sync 和 Statistics Services
- [ ] **schedule** - 检查 ConflictApplicationService
- [ ] **setting** - 修复 ThemeService（Vuetify 依赖）
- [ ] **task** - 检查 Sync 和 AutoStatus Services

### 长期架构改进

1. **制定清晰的分层规范**
   - 在项目文档中明确定义每层的职责
   - 添加 lint 规则检查不允许的导入

2. **建立验证流程**
   - 提取前：检查框架依赖
   - 提取后：类型检查和测试
   - 删除前：验证导入不会断裂

3. **代码审核清单**
   ```
   提取前检查：
   - [ ] Application 层没有 Vue/Vuetify/Zustand 导入
   - [ ] Infrastructure 层没有 Vue 特定 API
   - [ ] 没有 Composables 在 application 中
   - [ ] Packages 版本与 Web 版本内容一致
   - [ ] Web 中删除后没有断裂的导入
   ```

---

## 总结

**回答用户问题1："为什么会有 Service 依赖框架的？"**

- 这是一个 **架构问题**，不是个别 bug
- 根本原因：层级职责混淆 + 框架耦合
- 解决方法：
  1. 明确每层的职责
  2. 修复错误位置的代码（Composables 到 presentation）
  3. 重构有框架依赖的 Services（移除 Store 依赖）

**回答用户问题2："所有代码是否都已提取到 Packages？"**

- ❌ **不，远远没有完成**
- 完全提取的只有：notification、repository (2/10 modules)
- 8/10 模块的 Web services 还在本地
- 许多 services 有框架依赖，无法提取
- 需要大规模的架构调整和代码重构
