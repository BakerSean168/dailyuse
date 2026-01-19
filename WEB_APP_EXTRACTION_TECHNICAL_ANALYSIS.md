# Web App 代码提取 - 技术分析

**生成日期**: 2026-01-18  
**深度**: 详细技术分析

---

## 目录

1. [保留决策分析](#保留决策分析)
2. [迁移决策分析](#迁移决策分析)
3. [分离决策分析](#分离决策分析)
4. [依赖关系详解](#依赖关系详解)
5. [迁移风险评估](#迁移风险评估)
6. [包结构设计](#包结构设计)

---

## 保留决策分析

### Goal 模块 - useWeightSnapshot.ts

**📍 位置**: `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts`

**核心代码片段**:
```typescript
import { ref, computed, watch } from 'vue';

export function useWeightSnapshot() {
  const goalSnapshots = ref<KeyResultWeightSnapshotServerDTO[]>([]);
  const krSnapshots = ref<KeyResultWeightSnapshotServerDTO[]>([]);
  const weightTrend = ref<{ ... }>();
  
  // ... computed properties, watch handlers
}
```

**分析**:
- ✅ **Vue 3 特定**: 使用 `ref`, `computed`, `watch`
- ✅ **UI 状态管理**: 管理组件的响应式状态
- ✅ **Web 应用特定**: 权重快照展示是 Web UI 的一部分
- ✅ **不可复用**: 与 Vue 3 框架紧密耦合

**决策**: 🟢 **保留在 Web App**

**理由**:
1. 这不是业务逻辑，而是 UI 层的状态管理
2. Vue Composable 本质上是 Web 特定的
3. 其他应用（桌面、移动）有不同的 UI 框架
4. 迁移反而会破坏框架独立性

**处理方案**:
```typescript
// 保留在 Web App 中，但更新导入
import { weightSnapshotWebApplicationService } from '@dailyuse/application-client/goal/services';

export function useWeightSnapshot() {
  // ... 使用迁移后的服务
}
```

---

### Goal 模块 - useAutoStatusRules.ts

**📍 位置**: `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts`

**核心代码**:
```typescript
import { ref } from 'vue';
import { statusRuleEngine } from '../services/StatusRuleEngine';

export interface AutoRuleConfig {
  enabled: boolean;
  allowManualOverride: boolean;
  notifyOnChange: boolean;
}

export function useAutoStatusRules() {
  const executeHistory = ref<RuleExecutionHistory[]>([]);
  // ... Vue 响应式逻辑
}
```

**分析**:
- ✅ **Vue 3 特定**: 使用 `ref` 和响应式 API
- ✅ **UI 状态管理**: 管理规则执行历史和 UI 状态
- ✅ **规则配置接口**: AutoRuleConfig 可提取，但组合式函数本身是 Vue 特定的
- ✅ **Composable 模式**: 标准的 Vue 3 Composable

**决策**: 🟢 **保留在 Web App**

**理由**:
1. Composable 是 Vue 3 的概念，其他框架不适用
2. 状态管理逻辑与 UI 框架紧密相关
3. 规则引擎本身可迁移，但这个 Composable 不行

**处理方案**:
```typescript
// 保留 Composable，但更新导入
import { statusRuleEngine } from '@dailyuse/application-client/goal/services';

// 可选：提取 AutoRuleConfig 到 packages
export interface AutoRuleConfig {
  // ... 这部分可迁移
}
```

---

### Notification 模块 - 初始化脚本

**📍 位置**: 
- `apps/web/src/modules/notification/initialization/notificationInitialization.ts`
- `apps/web/src/modules/notification/initialization/sseInitialization.ts`

**代码**:
```typescript
// notificationInitialization.ts
export async function initializeNotificationModule() {
  const initManager = NotificationInitializationManager.getInstance();
  await initManager.initializeNotificationModule();
  
  // 在应用启动时调用
}

// 在 Web App 的 main.ts 或 app.ts 中调用
await initializeNotificationModule();
```

**分析**:
- ✅ **Web 应用启动程序**: 这是应用初始化流程的一部分
- ✅ **框架适配**: 可能包含 Vue 特定的初始化逻辑
- ✅ **应用级别**: 不是库级别的代码
- ✅ **Web 特定**: 其他应用有不同的初始化流程

**决策**: 🟢 **保留在 Web App**

**理由**:
1. 应用初始化脚本应该在应用中
2. 不同应用有不同的初始化时机和流程
3. Web 特定的初始化需求（Vue 应用生命周期）

**处理方案**:
```typescript
// 保留在 Web App 中
import { NotificationInitializationManager } from '@dailyuse/infrastructure-client/notification/initialization';

export async function initializeNotificationModule() {
  const initManager = NotificationInitializationManager.getInstance();
  await initManager.initializeNotificationModule();
  // Web 特定的初始化逻辑
}
```

---

## 迁移决策分析

### Account 模块 - accountApiClient.ts

**📍 位置**: `apps/web/src/modules/account/infrastructure/api/accountApiClient.ts`

**代码片段**:
```typescript
import { apiClient } from '@/shared/api/instances';
import type { AccountDTO, UpdateAccountRequest } from '@dailyuse/contracts/account';

export const getAccountInfo = async (): Promise<AccountDTO> => {
  return apiClient.get('/accounts/me');
};

export const updateAccountProfile = async (data: UpdateAccountRequest) => {
  return apiClient.put('/accounts/me/profile', data);
};
```

**分析**:
- ✅ **框架无关**: 只是 HTTP API 调用
- ✅ **高度可复用**: 任何应用都可能需要账户 API
- ✅ **无 UI 依赖**: 没有对 Vue 或 Web 特定组件的依赖
- ✅ **独立的关注点**: 纯基础设施代码

**决策**: ✅ **迁移至 packages/infrastructure-client/account/**

**理由**:
1. 这是标准的 API 客户端，可在任何应用中复用
2. 没有 Web 或 Vue 特定的依赖
3. 应该与业务逻辑分离
4. 多个应用可能需要相同的 API 调用

**迁移计划**:
```
原位置：
apps/web/src/modules/account/infrastructure/api/accountApiClient.ts

新位置：
packages/infrastructure-client/src/account/adapters/http/accountApiClient.ts

导入更新：
前: import { getAccountInfo } from '@/modules/account/infrastructure/api/accountApiClient'
后: import { getAccountInfo } from '@dailyuse/infrastructure-client/account/adapters/http'

导出位置：
packages/infrastructure-client/src/account/index.ts:
  export { getAccountInfo, updateAccountProfile } from './adapters/http/accountApiClient'
```

**风险**: 低 - 纯函数，没有副作用

---

### Notification 模块 - SSEClient.ts

**📍 位置**: `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

**代码片段**:
```typescript
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  async connect(url: string): Promise<void> {
    this.eventSource = new EventSource(url);
    // ... 连接逻辑、重连、token 刷新监听
  }
  
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

**分析**:
- ✅ **完全框架无关**: 只使用标准浏览器 EventSource API
- ✅ **高度可复用**: 任何 Web 应用都可能需要 SSE 客户端
- ✅ **复杂逻辑**: 包含重连、token 刷新等重要逻辑
- ✅ **不依赖 Web App 特定代码**: 独立的工具类

**决策**: ✅ **迁移至 packages/infrastructure-client/notification/adapters/sse/**

**优先级**: 🔴 **CRITICAL** - 这是关键的基础设施

**理由**:
1. SSE 客户端是核心的实时通信基础设施
2. 复杂的重连和容错逻辑值得共享
3. 完全不依赖应用特定代码
4. 其他应用（桌面、移动）也可能需要

**迁移计划**:
```
原位置：
apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts

新位置：
packages/infrastructure-client/src/notification/adapters/sse/SSEClient.ts

导入更新：
前: import { SSEClient } from '@/modules/notification/infrastructure/sse/SSEClient'
后: import { SSEClient } from '@dailyuse/infrastructure-client/notification/adapters/sse'

代码无须改动：
✅ 只需移动文件
✅ 更新导入路径
```

**风险**: 低 - 代码独立，不依赖 Web App

**迁移后验证**:
```typescript
// 在 packages 中验证
import { SSEClient } from '@dailyuse/infrastructure-client/notification/adapters/sse';

const client = new SSEClient('https://api.example.com/sse');
await client.connect();
```

---

### Goal 模块 - BuiltInRules.ts

**📍 位置**: `apps/web/src/modules/goal/application/rules/BuiltInRules.ts`

**代码**:
```typescript
export const BUILT_IN_RULES: StatusRule[] = [
  {
    id: 'rule-on-track',
    name: '进度良好',
    description: '当所有关键结果进度都达到 80% 以上时，标记为进行中',
    enabled: true,
    priority: 10,
    conditionType: 'all',
    conditions: [
      {
        metric: 'progress',
        operator: '>=',
        value: 80,
      }
    ]
  },
  // ... 更多规则
];
```

**分析**:
- ✅ **框架无关**: 纯数据定义
- ✅ **业务规则**: 不依赖 UI 框架
- ✅ **高度可复用**: 任何应用都可以使用这些规则
- ✅ **不变性**: 规则是常量，不会改变

**决策**: ✅ **迁移至 packages/application-client/goal/rules/**

**理由**:
1. 规则是业务逻辑，应该在 packages 中
2. 其他应用（桌面、移动）也需要相同的规则
3. 规则评引擎在 packages 中，规则也应该在 packages 中
4. 易于版本控制和更新

**迁移计划**:
```
原位置：
apps/web/src/modules/goal/application/rules/BuiltInRules.ts

新位置：
packages/application-client/src/goal/rules/BuiltInRules.ts

导入更新：
前: import { BUILT_IN_RULES } from '@/modules/goal/application/rules/BuiltInRules'
后: import { BUILT_IN_RULES } from '@dailyuse/application-client/goal/rules'
```

**风险**: 低 - 纯数据，没有依赖关系

---

## 分离决策分析

### Authentication 模块 - TokenRefreshRequestedHandler.ts

**📍 位置**: `apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts`

**代码**:
```typescript
import router from '@/shared/router';

export class TokenRefreshRequestedHandler {
  static async handleTokenRefresh(event: TokenRefreshEvent): Promise<void> {
    try {
      await this.tokenRefreshService.refreshToken();
      // ✅ 框架无关的逻辑
    } catch (error) {
      // ❌ Web 特定的逻辑
      router.push('/login');  // 这是 Web 特定的！
    }
  }
}
```

**问题分析**:
- ✅ **核心逻辑是通用的**: Token 刷新应该可在任何应用中工作
- ❌ **路由跳转是 Web 特定的**: 其他应用有不同的导航方式
  - 桌面应用: 可能有不同的窗口管理
  - 移动应用: 可能有不同的导航栈
  - CLI 应用: 没有路由概念

**分离策略**:

**方案 1: 提取核心逻辑，Web 层处理导航** (推荐)

```typescript
// packages/application-client/src/authentication/handlers/TokenRefreshHandler.ts
export class TokenRefreshHandler {
  static async handleTokenRefresh(event: TokenRefreshEvent): Promise<boolean> {
    try {
      await this.tokenRefreshService.refreshToken();
      return true;  // 成功
    } catch (error) {
      return false;  // 失败，需要登录
    }
  }
}

// apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts
import { TokenRefreshHandler } from '@dailyuse/application-client/authentication/handlers';
import router from '@/shared/router';

export class TokenRefreshRequestedHandler {
  static async handleTokenRefresh(event: TokenRefreshEvent): Promise<void> {
    const success = await TokenRefreshHandler.handleTokenRefresh(event);
    if (!success) {
      // Web 特定的导航
      router.push('/login');
    }
  }
}
```

**方案 2: 使用回调函数，让应用决定行为**

```typescript
// packages/application-client/src/authentication/handlers/TokenRefreshHandler.ts
export class TokenRefreshHandler {
  static async handleTokenRefresh(
    event: TokenRefreshEvent,
    onFailure?: () => void
  ): Promise<boolean> {
    try {
      await this.tokenRefreshService.refreshToken();
      return true;
    } catch (error) {
      onFailure?.();  // 让调用者决定做什么
      return false;
    }
  }
}

// apps/web/src/modules/authentication/application/event-handlers/
TokenRefreshHandler.handleTokenRefresh(event, () => {
  router.push('/login');
});
```

**方案 3: 发布事件让应用响应**

```typescript
// packages/application-client/src/authentication/handlers/TokenRefreshHandler.ts
export class TokenRefreshHandler {
  static async handleTokenRefresh(event: TokenRefreshEvent): Promise<boolean> {
    try {
      await this.tokenRefreshService.refreshToken();
      return true;
    } catch (error) {
      eventBus.emit('auth:token-refresh-failed', { reason: error });
      return false;
    }
  }
}

// apps/web/src/modules/authentication/application/event-handlers/
eventBus.on('auth:token-refresh-failed', () => {
  router.push('/login');
});
```

**推荐方案**: 方案 1 + 方案 3 结合
- 核心逻辑在 packages 中
- Web 层处理 UI 导航
- 其他应用可以有不同的响应方式

**决策**: ⚠️ **部分迁移**

**处理**:
- ✅ 迁移核心 Token 刷新逻辑到 `packages/application-client/authentication/handlers/`
- 🟢 保留 Web 特定的路由处理在 `apps/web/src/modules/authentication/application/event-handlers/`

---

## 依赖关系详解

### ApiClient 基类 - 共享依赖

**📍 位置**: 
- `apps/web/src/modules/account/infrastructure/api/ApiClient.ts`
- `apps/web/src/modules/authentication/infrastructure/api/ApiClient.ts`

**问题**: 这两个文件可能重复

**分析**:
```
accountApiClient.ts 依赖 ApiClient.ts ✅
authApiClient.ts 依赖 ApiClient.ts ✅
goalApiClient.ts 依赖 apiClient 实例 (from shared/api/instances)
scheduleTaskApi.ts 依赖 apiClient 实例 (from shared/api/instances)
... 所有 API 客户端都依赖一个基础的 HTTP 客户端
```

**去重策略**:

```
当前状态：
apps/web/src/modules/
├── account/infrastructure/api/ApiClient.ts (A)
├── authentication/infrastructure/api/ApiClient.ts (B)
└── shared/api/instances.ts (可能存在的基础实例)

新结构：
packages/infrastructure-client/src/
├── common/
│   └── http/
│       └── ApiClient.ts (统一的基础类)
└── [各模块]/
    ├── account/adapters/http/accountApiClient.ts
    ├── authentication/adapters/http/authApiClient.ts
    └── ...

迁移步骤：
1. 检查两个 ApiClient.ts 是否相同
2. 如果相同，去重到 packages/infrastructure-client/common/http/
3. 所有 API 客户端导入统一的 ApiClient 基类
4. 删除 Web 中的重复文件
```

---

### 事件总线依赖

**📍 依赖**: `@dailyuse/utils` (eventBus)

**影响**:
```
accountEventHandlers.ts ──┐
goalEventHandlers.ts ────┤
NotificationEventHandlers.ts ├──> eventBus (@dailyuse/utils)
ReminderNotificationHandler.ts ┤
SettingEventEmitter.ts ──┘

迁移后：
packages/application-client/
├── account/event-handlers/AccountEventHandlers.ts ──┐
├── goal/event-handlers/goalEventHandlers.ts ────┤
├── notification/event-handlers/NotificationEventHandlers.ts ├──> eventBus
├── notification/handlers/ReminderNotificationHandler.ts ┤
└── setting/event-emitters/SettingEventEmitter.ts ──┘

✅ 不需要任何改动，eventBus 已在 @dailyuse/utils 中
```

---

### 契约依赖

**📍 依赖**: `@dailyuse/contracts/*`

**示例**:
```typescript
import type { 
  AccountDTO, 
  UpdateAccountRequest 
} from '@dailyuse/contracts/account';

import type { 
  GoalClientDTO, 
  KeyResultClientDTO 
} from '@dailyuse/contracts/goal';
```

**分析**:
- ✅ 所有 API 客户端都依赖 `@dailyuse/contracts`
- ✅ contracts 包是平台级的，所有应用都依赖
- ✅ 迁移不会破坏任何东西

---

## 迁移风险评估

### 高风险操作

| 操作 | 风险 | 缓解措施 |
|-----|------|---------|
| 迁移 ApiClient 基类 | 中等 - 多个文件依赖 | 先在 packages 中创建，再更新所有导入 |
| 迁移 SSEClient.ts | 中等 - 复杂的连接逻辑 | 迁移后进行完整的集成测试 |
| 分离 TokenRefreshHandler | 中等 - 业务逻辑改变 | 使用方案 1（提取 + 适配），保持兼容性 |
| 迁移所有 API 客户端 | 低 - 独立的函数 | 逐个迁移，确保导入正确 |

### 中等风险操作

| 操作 | 风险 | 缓解措施 |
|-----|------|---------|
| 迁移事件处理器 | 低 - 独立逻辑 | 验证事件监听器正确注册 |
| 迁移业务规则 | 低 - 纯数据 | 验证规则引擎仍能正常评估 |
| 迁移初始化管理器 | 中等 - 初始化时机 | 在 Web App 初始化脚本中验证调用 |

### 低风险操作

| 操作 | 风险 | 缓解措施 |
|-----|------|---------|
| 更新 Composable 导入 | 低 - 只改导入 | 简单的查找替换 |
| 迁移纯数据（GoalTemplates） | 低 - 不可变数据 | 验证导入路径 |

---

## 包结构设计

### 推荐的目录结构

```
packages/
├── application-client/src/
│   ├── account/
│   │   ├── event-handlers/
│   │   │   ├── AccountEventHandlers.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── (现有或迁移的服务)
│   │   └── index.ts
│   │
│   ├── authentication/
│   │   ├── handlers/
│   │   │   ├── TokenRefreshHandler.ts (提取的核心逻辑)
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── (现有或迁移的服务)
│   │   └── index.ts
│   │
│   ├── goal/
│   │   ├── rules/
│   │   │   ├── BuiltInRules.ts
│   │   │   └── index.ts
│   │   ├── event-handlers/
│   │   │   ├── goalEventHandlers.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── (现有的服务)
│   │   └── index.ts
│   │
│   ├── notification/
│   │   ├── event-handlers/
│   │   │   ├── NotificationEventHandlers.ts
│   │   │   └── index.ts
│   │   ├── handlers/
│   │   │   ├── ReminderNotificationHandler.ts
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── notificationEvents.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── (现有的服务)
│   │   └── index.ts
│   │
│   ├── setting/
│   │   ├── event-emitters/
│   │   │   ├── SettingEventEmitter.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── (现有或迁移的服务)
│   │   └── index.ts
│   │
│   ├── schedule/
│   ├── task/
│   ├── reminder/
│   ├── ai/
│   ├── repository/
│   │
│   └── index.ts (统一导出)
│
└── infrastructure-client/src/
    ├── common/
    │   ├── http/
    │   │   ├── ApiClient.ts (基础类)
    │   │   └── index.ts
    │   └── adapters/
    │
    ├── account/
    │   ├── adapters/
    │   │   └── http/
    │   │       ├── accountApiClient.ts
    │   │       └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── authentication/
    │   ├── adapters/
    │   │   └── http/
    │   │       ├── authApiClient.ts
    │   │       └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── goal/
    │   ├── adapters/
    │   │   └── http/
    │   │       ├── goalApiClient.ts
    │   │       ├── weightSnapshotApiClient.ts
    │   │       ├── focusModeApiClient.ts
    │   │       └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── notification/
    │   ├── adapters/
    │   │   ├── sse/
    │   │   │   ├── SSEClient.ts
    │   │   │   ├── sseDebug.ts
    │   │   │   └── index.ts
    │   │   ├── http/
    │   │   │   ├── notificationApiClient.ts
    │   │   │   └── index.ts
    │   │   └── browser/
    │   │       ├── NotificationPermissionService.ts
    │   │       └── index.ts
    │   ├── services/
    │   │   ├── AudioNotificationService.ts
    │   │   ├── DesktopNotificationService.ts
    │   │   └── index.ts
    │   ├── storage/
    │   │   ├── NotificationConfigStorage.ts
    │   │   └── index.ts
    │   ├── initialization/
    │   │   ├── NotificationInitializationManager.ts
    │   │   └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── setting/
    │   ├── adapters/
    │   │   └── http/
    │   │       ├── userSettingApi.ts
    │   │       ├── userPreferencesApi.ts
    │   │       ├── SettingSyncApiClient.ts
    │   │       └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── schedule/
    │   ├── adapters/
    │   │   └── http/
    │   │       ├── scheduleTaskApi.ts
    │   │       └── index.ts
    │   ├── ports/
    │   └── index.ts
    │
    ├── task/
    ├── reminder/
    ├── ai/
    ├── repository/
    │
    └── index.ts (统一导出)
```

### 导出策略

**packages/application-client/src/index.ts**:
```typescript
// Account
export { AccountEventHandlers } from './account/event-handlers';

// Authentication  
export { TokenRefreshHandler } from './authentication/handlers';

// Goal
export { BUILT_IN_RULES } from './goal/rules';
export { default as goalEventHandlers } from './goal/event-handlers';

// Notification
export { NotificationEventHandlers } from './notification/event-handlers';
export { ReminderNotificationHandler } from './notification/handlers';
export { NOTIFICATION_EVENTS } from './notification/events';

// Setting
export { SettingEventEmitter } from './setting/event-emitters';

// ... 其他导出
```

**packages/infrastructure-client/src/index.ts**:
```typescript
// Common HTTP
export { ApiClient } from './common/http/ApiClient';

// Account API
export { getAccountInfo, updateAccountProfile } from './account/adapters/http';

// Authentication API
export { login, logout, refreshToken } from './authentication/adapters/http';

// Goal API
export { 
  getGoal, 
  getWeightSnapshots, 
  updateGoal 
} from './goal/adapters/http';

// Notification Infrastructure
export { SSEClient } from './notification/adapters/sse';
export { NotificationPermissionService } from './notification/browser';
export { NotificationConfigStorage } from './notification/storage';
export { AudioNotificationService } from './notification/services';
export { NotificationInitializationManager } from './notification/initialization';

// ... 其他导出
```

---

## 实施建议

### 1. 验证清单

迁移前：
- [ ] 确认 ApiClient 基类是否重复
- [ ] 检查是否有循环依赖
- [ ] 验证所有类型导入都来自 @dailyuse/contracts
- [ ] 检查是否有 Web 特定的依赖（如 router、store）

迁移后：
- [ ] 所有导入都指向 @dailyuse/*
- [ ] Lint 检查通过
- [ ] 类型检查通过
- [ ] 单元测试通过
- [ ] 集成测试通过

### 2. 回滚计划

如果迁移出问题：
1. 保留原始文件副本
2. 在 Web App 中添加转发导出：
   ```typescript
   export { SSEClient } from '@dailyuse/infrastructure-client/notification/adapters/sse';
   ```
3. 逐步迁移依赖项

### 3. 文档更新

需要更新的文档：
- [ ] ARCHITECTURE.md - 新的包结构
- [ ] FRONTEND_ARCHITECTURE_GUIDE.md - 文件位置变化
- [ ] 各模块的 README.md
- [ ] 贡献指南 - 新文件应该放在哪里

---

**版本**: 1.0  
**最后更新**: 2026-01-18
