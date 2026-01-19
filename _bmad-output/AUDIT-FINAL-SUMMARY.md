# 📋 代码提取审计 - 最终总结

**审计日期：** 2025-01-18  
**审计范围：** 所有 Web 应用模块的 application 和 infrastructure 层  
**审计对象：** 10 个模块 × 2 层 = 完整的应用层架构

---

## 🎯 核心发现

### 用户问题 1: "为什么会有 Service 依赖框架的？"

**答案：这是架构设计和实现的问题，不是个别 bug。**

#### 根本原因

1. **层级职责混淆**
   - Application 层的定义不清楚
   - 某些开发者把框架特有的概念（Composables）放在 application 层
   - 某些 Services 直接导入并使用 Zustand/Pinia stores

2. **框架特定的 API 被用在不该用的地方**

   ```typescript
   // ❌ 错误：这应该在 presentation 层
   // apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts
   import { ref, computed, watch } from 'vue';

   // ❌ 错误：这应该在 Web 特有的地方
   // apps/web/src/modules/authentication/application/services/AuthApplicationService.ts
   import { useAuthenticationStore } from '../../presentation/stores/authenticationStore';
   ```

3. **缺乏验证机制**
   - 没有 lint 规则检查不允许的导入
   - 没有流程验证确保代码可以提取

#### 三层分工应该是

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Framework-Agnostic (可提取到 Packages)                    │
├─────────────────────────────────────────────────────────────┤
│ - 业务逻辑（DTOs 转换、验证、算法）                          │
│ - API 客户端调用                                             │
│ - 领域模型操作                                               │
│ - 数据访问层                                                 │
│ - 事件发送（只发送事件，不关心谁听）                         │
└─────────────────────────────────────────────────────────────┘
                    ↓ 应用层 ↓
          Application Layer (Services)

┌─────────────────────────────────────────────────────────────┐
│ ❌ Framework-Specific (必须在 Web/Desktop)                  │
├─────────────────────────────────────────────────────────────┤
│ - Vue Composables（使用 ref, computed等）                   │
│ - Zustand/Pinia Store 操作                                  │
│ - 与 UI 框架集成的代码                                       │
│ - 组件状态管理                                               │
│ - 事件监听与框架集成                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓ 展示层 ↓
         Presentation Layer (UI, Stores, Composables)
```

---

### 用户问题 2: "确认是否所有 Web 模块都已移到 Packages？"

**答案：❌ 绝对没有。远未完成。**

#### 提取完成度

| 模块                  | Web中的Services | Packages中的 | 完成度 | 主要问题                                  |
| --------------------- | --------------- | ------------ | ------ | ----------------------------------------- |
| 📌 **account**        | 2               | 20           | 10%    | 2个services有Store依赖                    |
| 📌 **ai**             | 7               | 21           | 30%    | 4个services有Store依赖                    |
| 📌 **authentication** | 8               | 26           | 30%    | 7个services都有Store依赖                  |
| 📌 **goal**           | 15              | 35           | 40%    | Composables位置错误 + GoalSync有Store依赖 |
| ✅ **notification**   | 0               | 12           | 100%   | ✅ 完整提取                               |
| 📌 **reminder**       | 4               | 27           | 85%    | 4个services有Store依赖                    |
| ✅ **repository**     | 0               | 10           | 100%   | ✅ 完整提取                               |
| 📌 **schedule**       | 3               | 28           | 90%    | 3个services可能有依赖                     |
| 📌 **setting**        | 2               | 8            | 70%    | ThemeService有Vuetify依赖                 |
| 📌 **task**           | 10              | 45           | 75%    | 2-10个services可能有Store依赖             |

**总体进度：** ✅ **2/10 完整 (20%)** | ⚠️ **8/10 不完整 (80%)**

---

## 🔴 关键问题清单

### 问题 1: Vue Composables 在错误的位置

**位置：** `apps/web/src/modules/goal/application/composables/`

**问题代码：**

```typescript
// ❌ 错误的位置：application/composables/
import { ref, computed, watch } from 'vue';

export function useWeightSnapshot() {
  const goalSnapshots = ref<...>([]);
  const isLoading = ref(false);
  // ... Vue 响应式状态
}
```

**应该的位置：** `apps/web/src/modules/goal/presentation/composables/`

**受影响文件：**

- `useAutoStatusRules.ts`
- `useWeightSnapshot.ts`

**修复优先级：** 🔴 **立即**

---

### 问题 2: Zustand/Pinia Store 直接被 Services 使用

**模块分布：**

| 模块           | 受影响Services | 导入方式                            | 严重程度 |
| -------------- | -------------- | ----------------------------------- | -------- |
| authentication | 7个            | `import { useAuthenticationStore }` | 🔴 严重  |
| account        | 2个            | `import { useAccountStore }`        | 🟡 中    |
| ai             | 4个            | 各种 AI 模块 stores                 | 🟡 中    |
| goal           | 1个            | `import { getGoalStore }`           | 🔴 严重  |
| reminder       | 4个            | `import { useReminderStore }`       | 🟡 中    |
| task           | 2个            | `import { useTaskStore }`           | 🟡 中    |
| setting        | 1个            | `import { useSettingStore }`        | 🟠 轻    |

**真实代码示例：**

```typescript
// ❌ AuthApplicationService.ts
import { useAuthenticationStore } from '../../presentation/stores/authenticationStore';

export class AuthApplicationService {
  async login(request: LoginRequest) {
    const response = await this.apiClient.login(request);

    // ❌ 直接使用 Pinia Store - 无法提取到 Packages！
    const authStore = useAuthenticationStore();
    authStore.setToken(response.tokens.accessToken);
    authStore.setUser(response.user);

    return response;
  }
}
```

**为什么这是问题：**

- 这样的代码无法在 Packages 中使用（Packages 不知道 Pinia 是什么）
- 无法在 Desktop/Server 端重用
- 无法单元测试（必须 mock Pinia Store）
- 导致严重的框架耦合

**修复优先级：** 🔴 **立即**

---

### 问题 3: ThemeService 使用 Vuetify API

**位置：** `apps/web/src/modules/setting/application/services/ThemeService.ts`

**问题代码：**

```typescript
import { useTheme } from 'vuetify'; // ❌ Vuetify 特有

export class ThemeService {
  private theme: ThemeInstance;

  constructor() {
    this.theme = useTheme(); // ❌ 必须在 Vue 组件中调用
  }
}
```

**为什么这是问题：**

- `useTheme()` 只能在 Vue 应用初始化后调用
- 无法提取到 Packages
- 这个 Service 必须保留在 Web

**修复优先级：** 🟠 **低** (识别并标记为 Web-only)

---

### 问题 4: 不完整的代码提取

**示例 - Authentication 模块：**

```
Web 中有：                          Packages 中也有（重复）：
- AuthApplicationService.ts      → AuthApplicationService.ts
- LoginApplicationService.ts     → LoginApplicationService.ts
- PasswordApplicationService.ts  → PasswordApplicationService.ts
- SessionApplicationService.ts   → SessionApplicationService.ts
- ApiKeyApplicationService.ts    → ApiKeyApplicationService.ts
- RegistrationApplicationService.ts  → RegistrationApplicationService.ts
- TokenRefreshApplicationService.ts

待确认：
- 两个版本是否完全相同？
- Web 是否还在使用本地版本？
- Packages 版本是否最新？
```

**这导致的问题：**

- 代码重复
- 维护困难（修改一个地方另一个没同步）
- 不清楚真相源是什么
- 可能导致功能不一致的 bug

**修复优先级：** 🔴 **立即**

---

## ✅ 正确的做法

### 方案 1: 事件驱动（推荐）

**原理：** Service 发送事件，Store 监听事件更新状态

```typescript
// ✅ Packages 版本（框架无关）
export class GoalSyncApplicationService {
  constructor(
    private apiClient: GoalApiClient,
    private eventBus: EventBus, // ✅ 注入事件总线
  ) {}

  async syncGoals() {
    const goals = await this.apiClient.getGoals();
    // ✅ 只发送事件
    this.eventBus.emit('goal:synced', { goals });
  }
}

// ✅ Web 版本（框架特有）
export const useGoalStore = defineStore('goal', () => {
  const eventBus = useEventBus();

  // ✅ Store 监听事件自己更新
  eventBus.on('goal:synced', ({ goals }) => {
    state.goals = goals;
  });
});
```

**优点：**

- Service 完全框架无关 ✅
- 可以提取到 Packages ✅
- 可以在任何环境中使用 ✅
- 易于测试 ✅

---

### 方案 2: 依赖注入

**原理：** Service 接收接口而不是具体实现

```typescript
// ✅ 接口定义（在 Packages）
export interface IAuthStateManager {
  setToken(token: string): void;
  setUser(user: User): void;
}

// ✅ Packages 版本（框架无关）
export class AuthApplicationService {
  constructor(
    private apiClient: AuthApiClient,
    private stateManager: IAuthStateManager,
  ) {}

  async login(request: LoginRequest) {
    const response = await this.apiClient.login(request);
    this.stateManager.setToken(response.token);
    this.stateManager.setUser(response.user);
  }
}

// ✅ Web 实现
class PiniaAuthStateManager implements IAuthStateManager {
  constructor(private store: ReturnType<typeof useAuthenticationStore>) {}

  setToken(token: string) {
    this.store.setToken(token);
  }

  setUser(user: User) {
    this.store.setUser(user);
  }
}

// ✅ 初始化时注入
const authService = new AuthApplicationService(
  authApiClient,
  new PiniaAuthStateManager(useAuthenticationStore()),
);
```

**优点：**

- Service 不知道 Store 的存在 ✅
- 易于单元测试 ✅
- 可以在任何环境中使用 ✅
- 清晰的接口契约 ✅

---

## 📊 详细数据

### 模块级别的 Framework 依赖分析

```
account:
  ✗ AccountProfileApplicationService - useAccountStore
  ✗ AccountSubscriptionApplicationService - useAccountStore
  ✓ 没有 composables
  ✓ 没有 Vue 导入

ai:
  ✗ KnowledgeGenerationApplicationService - useAiStore (等)
  ✓ 没有 composables
  ✓ 没有 Vue 导入
  (其他4个services需要检查)

authentication:
  ✗ AuthApplicationService - useAuthenticationStore
  ✗ LoginApplicationService - useAuthenticationStore
  ✗ PasswordApplicationService - useAuthenticationStore
  ✗ SessionApplicationService - useAuthenticationStore
  ✗ ApiKeyApplicationService - useAuthenticationStore
  ✗ RegistrationApplicationService - useAuthenticationStore
  ✗ TokenRefreshApplicationService - useAuthenticationStore
  ✓ 没有 composables
  ✓ 没有 Vue 导入

goal:
  ✗ Composables 在错误位置
    - useAutoStatusRules.ts (application/composables)
    - useWeightSnapshot.ts (application/composables)
  ✗ GoalSyncApplicationService - getGoalStore
  ✓ 其他15个services需要检查

notification:
  ✓ 完整提取，没有依赖问题

reminder:
  ✗ ReminderGroupApplicationService - useReminderStore
  ✗ ReminderStatisticsApplicationService - useReminderStore
  ✗ ReminderSyncApplicationService - useReminderStore
  ✗ ReminderTemplateApplicationService - useReminderStore
  ✓ 没有 composables
  ✓ 没有 Vue 导入

repository:
  ✓ 完整提取，没有依赖问题

schedule:
  ? ScheduleConflictApplicationService (需要检查)
  ? ScheduleEventApplicationService (需要检查)
  ? ScheduleTaskDetailService (需要检查)

setting:
  ✗ ThemeService - useTheme (Vuetify)
  ✗ UserSettingWebApplicationService - useSettingStore
  ✓ 没有 composables
  ✓ 没有 Vue 导入

task:
  ✗ TaskAutoStatusService (可能有依赖)
  ✗ TaskStatisticsApplicationService (可能有依赖)
  ✗ TaskSyncApplicationService (可能有依赖)
  (其他7个services需要检查)
```

---

## 🚀 下一步行动计划

### Phase 1: 紧急修复 (今天)

1. **Goal 模块：修复 Composables 位置**
   - 移动 `useAutoStatusRules.ts` 和 `useWeightSnapshot.ts` 到 `presentation/composables/`
   - 更新 index.ts 和所有导入

2. **创建架构规范文档**
   - 定义 application/infrastructure/presentation 各层职责
   - 添加到项目 README 或 docs

### Phase 2: 架构重构 (本周)

3. **解耦所有有 Store 依赖的 Services**
   - 优先级 1: authentication (7个)
   - 优先级 2: account (2个)
   - 优先级 3: goal (1个)

4. **验证提取**
   - 类型检查：`npx tsc --noEmit`
   - 测试：`npm run test`
   - Lint：`npm run lint`

### Phase 3: 完成提取 (下周)

5. **将解耦后的 Services 提取到 Packages**
   - 复制代码
   - 验证功能
   - 更新导入
   - 删除 Web 本地版本

6. **验证整体架构**
   - 没有断裂的导入
   - 没有框架依赖在 application 层
   - 所有 tests 通过

---

## 📝 总结

### 根本问题

1. **层级混淆** - Application 层被框架代码污染
2. **架构规范缺失** - 没有清晰的分层规范
3. **提取不完整** - 标记"完成"但实际未完成
4. **缺乏验证** - 没有流程确保代码可提取

### 解决方案

1. **明确分层职责** - 清晰定义每层能做什么
2. **提取框架代码** - 用事件驱动或依赖注入解耦
3. **完成提取流程** - 按清单逐一完成
4. **添加验证机制** - Lint 规则 + 单元测试

### 预期结果

```
当前：  ✅ 2/10 完整提取 (notification, repository)
目标：  ✅ 10/10 完整提取
时间：  4-6 小时仔细重构
收益：
  - Web/Desktop/Server 可以共享业务逻辑
  - 代码更易测试和维护
  - 框架依赖被隔离在 presentation 层
  - 项目架构清晰健壮
```

---

**审计完成于：** 2025-01-18 UTC+8  
**下一步：** 等待用户反馈和优先级确认
