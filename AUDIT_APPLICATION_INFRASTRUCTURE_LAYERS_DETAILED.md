# 补充审计报告 - 应用层代码依赖关系分析

**日期**: 2026-01-18  
**主题**: 深度分析 Web 应用中哪些应用层/基础设施层代码应该保留或提取

---

## 核心发现

经过深入分析，我发现 **大多数应该保留在 Web 应用中的代码是"初始化管理器"和"事件处理器"**，因为它们是 Web 应用特定的初始化和事件处理逻辑。

### 代码分布模式

```
apps/web/src/modules/{module}/
├── application/
│   ├── events/                    ← Web 特定的事件处理器（init/cleanup）
│   ├── initialization/            ← Web 特定的初始化逻辑
│   ├── handlers/                  ← 事件处理逻辑
│   ├── composables/               ← Vue Composables（Web 特定）
│   ├── templates/                 ← 配置数据（可保留）
│   ├── rules/                     ← 业务规则（应该提取）
│   └── services/                  ← 应用服务（应该提取）
├── infrastructure/
│   ├── api/                       ← API 客户端（应该提取）
│   ├── storage/                   ← 本地存储（Web 特定）
│   ├── sse/                       ← Server-Sent Events（Web 特定）
│   ├── browser/                   ← 浏览器 API（Web 特定）
│   └── services/                  ← 浏览器服务（Web 特定）
└── initialization/
    ├── {module}Initialization.ts  ← Web 模块初始化（应该保留）
    └── ...
```

---

## 详细分析

### 应该保留的代码

#### 1. 初始化管理器 ✓

**文件**:

- `apps/web/src/modules/{module}/initialization/{module}Initialization.ts`
- `apps/web/src/modules/{module}/application/initialization/`

**原因**:

- 注册 Web 应用级别的初始化任务
- 管理模块启动和清理
- 依赖 InitializationManager（Web 特定的启动框架）
- 无法在 packages 中通用实现

**例子**:

```typescript
// accounts/initialization/accountInitialization.ts
export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  const accountEventHandlersTask: InitializationTask = {
    name: 'account-event-handlers',
    phase: InitializationPhase.APP_STARTUP,
    initialize: async () => {
      AccountEventHandlers.initializeEventHandlers();
    },
  };
  manager.registerTask(accountEventHandlersTask);
}
```

#### 2. Web 特定的事件处理器 ✓

**文件**:

- `apps/web/src/modules/{module}/application/events/{Module}EventHandlers.ts`
- `apps/web/src/modules/{module}/application/handlers/`

**原因**:

- 连接多个模块之间的事件通信
- 使用 Web 应用的全局事件总线
- 处理 Web UI 特定的交互逻辑
- 通常初始化时注册，清理时解绑

**例子**:

```typescript
// account/application/events/accountEventHandlers.ts
export class AccountEventHandlers {
  static initializeEventHandlers(): void {
    eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, this.handleUserLoggedIn);
  }

  static destroyEventHandlers(): void {
    eventBus.off(AUTH_EVENTS.USER_LOGGED_IN, this.handleUserLoggedIn);
  }
}
```

#### 3. Web 特定基础设施 ✓

**文件**:

- `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`
- `apps/web/src/modules/notification/infrastructure/browser/`
- `apps/web/src/modules/notification/infrastructure/storage/`
- `apps/web/src/modules/notification/infrastructure/services/`

**原因**:

- 使用浏览器 API（Storage API、Notification API、SSE 等）
- 无法在服务器或其他客户端中使用
- 硬依赖 DOM、localStorage 等

#### 4. 配置和模板数据 ✓

**文件**:

- `apps/web/src/modules/goal/application/templates/GoalTemplates.ts`
- 任何静态数据或配置文件

**原因**:

- 是数据文件而非业务逻辑
- 包含 OKR 模板等预设内容
- 参考文档: "临时例外" 规则允许这类文件保留

#### 5. Vue Composables ✓

**文件**:

- `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts`
- `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts`

**原因**:

- 是 Vue.js 框架特定的组合式 API
- 与 Web UI 框架紧密耦合
- 无法在其他平台上使用

---

### 应该提取的代码

#### 1. 业务事件定义

**文件**:

- `apps/web/src/modules/authentication/application/events/authEvents.ts`
- `apps/web/src/modules/notification/application/events/notificationEvents.ts`

**原因**:

- 定义跨平台的业务事件
- 其他客户端也需要这些事件定义
- 不是 Web UI 特定的

**提取位置**: `packages/application-client/{module}/services/events.ts`

#### 2. 业务规则

**文件**:

- `apps/web/src/modules/goal/application/rules/BuiltInRules.ts`
- `apps/web/src/modules/setting/application/events/SettingEventEmitter.ts`

**原因**:

- 包含跨平台适用的业务规则
- 其他客户端应该共用相同的规则
- 不是 UI 特定的

**提取位置**: `packages/application-client/{module}/rules/`

#### 3. API 客户端

**文件**:

- `apps/web/src/modules/{module}/infrastructure/api/{Module}ApiClient.ts`

**原因**:

- 所有 HTTP API 通信都应该集中在 packages 中
- 避免重复实现 API 调用逻辑
- 可被多个客户端重用

**提取位置**: `packages/infrastructure-client/{module}/adapters/http/`

**迁移方式**:

```typescript
// Web 应用中：
import { accountApiClient } from '@dailyuse/infrastructure-client/account';

// 不再本地定义 accountApiClient
```

---

## 按优先级的行动计划

### 优先级 1: 必须立即提取的代码

> 这些代码已在 packages 中有更好的实现，保留在 Web 应用中会造成重复和维护问题

#### 需要提取的文件清单

**Account 模块**:

- [ ] `apps/web/src/modules/account/infrastructure/api/accountApiClient.ts` → packages/infrastructure-client/account
  - **理由**: API 通信应集中管理
  - **状态**: packages 中已存在对应实现

**AI 模块**:

- [ ] `apps/web/src/modules/ai/infrastructure/api/aiProviderApiClient.ts` → packages
- [ ] `apps/web/src/modules/ai/infrastructure/api/aiGenerationApiClient.ts` → packages
- [ ] `apps/web/src/modules/ai/infrastructure/api/goalGenerationApiClient.ts` → packages
- [ ] `apps/web/src/modules/ai/infrastructure/api/aiConversationApiClient.ts` → packages

**Authentication 模块**:

- [ ] `apps/web/src/modules/authentication/application/events/authEvents.ts` → packages/application-client/authentication/services/
  - **理由**: 事件定义应跨平台共享
- [ ] `apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts` → packages

**Goal 模块**:

- [ ] `apps/web/src/modules/goal/application/rules/BuiltInRules.ts` → packages/application-client/goal/
- [ ] `apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts` → packages
- [ ] `apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts` → packages
- [ ] `apps/web/src/modules/goal/infrastructure/api/focusModeApiClient.ts` → packages

**Notification 模块**:

- [ ] `apps/web/src/modules/notification/application/events/notificationEvents.ts` → packages
- [ ] `apps/web/src/modules/notification/infrastructure/api/notificationApiClient.ts` → packages

**Repository 模块**:

- [ ] `apps/web/src/modules/repository/infrastructure/api/repositoryApiClient.ts` → packages
- [ ] `apps/web/src/modules/repository/infrastructure/api/ResourceApiClient.ts` → packages

**Schedule 模块**:

- [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleApiClient.ts` → packages
- [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleEventApiClient.ts` → packages
- [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleTaskApi.ts` → packages

**Setting 模块**:

- [ ] `apps/web/src/modules/setting/infrastructure/api/userPreferencesApi.ts` → packages
- [ ] `apps/web/src/modules/setting/infrastructure/api/SettingSyncApiClient.ts` → packages
- [ ] `apps/web/src/modules/setting/infrastructure/api/userSettingApi.ts` → packages
- [ ] `apps/web/src/modules/setting/infrastructure/api/userSettingApiClient.ts` → packages

**Task 模块**:

- [ ] `apps/web/src/modules/task/infrastructure/api/taskApiClient.ts` → packages

**Reminder 模块**:

- [ ] `apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts` → packages

---

### 优先级 2: 条件保留 (需要评估)

#### Account 模块

- **文件**: `apps/web/src/modules/account/application/events/accountEventHandlers.ts`
- **分析**:
  - 注册了 `AUTH_EVENTS.USER_LOGGED_IN` 事件监听
  - 处理登录后的账户数据预加载
  - **决策**: 可以保留，但应考虑是否将事件处理逻辑提取到 packages
  - **建议**: 保留初始化/监听机制，但将业务逻辑移到 packages

#### Authentication 模块

- **文件**: `apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts`
- **分析**:
  - 处理 token 刷新事件
  - **决策**: 应该保留在 Web 应用中（涉及 Web 特定的 token 存储）

#### Setting 模块

- **文件**: `apps/web/src/modules/setting/application/events/SettingEventEmitter.ts`
- **分析**:
  - 定义和发出设置变更事件
  - **决策**: 应考虑提取事件定义到 packages，保留发出机制

#### Notification 模块

- **文件**: `apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`
- **分析**:
  - 处理提醒通知
  - **决策**: 可以保留（Web 特定的通知处理）

---

### 优先级 3: 应该保留的文件

✓ **请不要删除这些文件**

**所有模块**:

- `apps/web/src/modules/{module}/application/events/{Module}EventHandlers.ts` (Web 初始化使用)
- `apps/web/src/modules/{module}/application/initialization/` (模块初始化)
- `apps/web/src/modules/{module}/infrastructure/api/index.ts` (导出)
- `apps/web/src/modules/{module}/infrastructure/api/ApiClient.ts` (基础类)

**特定模块**:

- ✓ `apps/web/src/modules/notification/infrastructure/sse/` (SSE Web 特定)
- ✓ `apps/web/src/modules/notification/infrastructure/browser/` (浏览器 API)
- ✓ `apps/web/src/modules/notification/infrastructure/storage/` (localStorage)
- ✓ `apps/web/src/modules/notification/infrastructure/services/` (Audio, Desktop Notifications)
- ✓ `apps/web/src/modules/goal/application/templates/GoalTemplates.ts` (模板数据)
- ✓ `apps/web/src/modules/goal/application/composables/` (Vue Composables)

---

## 迁移策略

### 阶段 1: 验证 packages 中的实现完整性

在删除 Web 应用中的任何代码之前：

```bash
# 1. 检查 packages 中是否有对应的实现
find packages/infrastructure-client/account -type f -name "*.ts" | wc -l

# 2. 比较 Web 应用中的实现
find apps/web/src/modules/account/infrastructure -type f -name "*.ts" | wc -l

# 3. 确保 Web 应用中的代码没有额外的业务逻辑
diff -r apps/web/src/modules/account/infrastructure \
        packages/infrastructure-client/account
```

### 阶段 2: 更新导入语句

```typescript
// 之前：本地导入
import { accountApiClient } from '../../infrastructure/api/accountApiClient';

// 之后：从 packages 导入
import { accountApiClient } from '@dailyuse/infrastructure-client/account';
```

### 阶段 3: 删除本地实现

```bash
# 仅在确认 packages 中有完整实现后
rm apps/web/src/modules/account/infrastructure/api/accountApiClient.ts
```

### 阶段 4: 验证应用完整性

```bash
# 运行所有测试
npm run test

# 运行 Web 应用
npm run dev

# 检查是否有导入错误
npm run lint
```

---

## 预期结果

完成迁移后，Web 应用将包含：

| 类型                      | 数量  | 类型                                                                     |
| ------------------------- | ----- | ------------------------------------------------------------------------ |
| **Application 层文件**    | ~10   | 初始化器、Composables、事件处理                                          |
| **Infrastructure 层文件** | ~15   | 本地存储、浏览器 API、SSE                                                |
| **包含的导入**            | 100%+ | 来自 `@dailyuse/application-client` 和 `@dailyuse/infrastructure-client` |

---

## 验证清单

完成审计和提取后，检查：

- [ ] 所有 Web 应用的 Composables 都导入来自 packages
- [ ] 没有重复的 API 客户端实现
- [ ] Web 应用中的导入都指向 `@dailyuse/` 包
- [ ] 运行 `npm run lint` 没有导入错误
- [ ] 所有端到端测试通过
- [ ] Web 应用启动没有错误

---

## 参考

**相关文档**:

- [AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md](AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md)
- [FRONTEND_ARCHITECTURE_GUIDE.md](FRONTEND_ARCHITECTURE_GUIDE.md)
- [packages/application-client](packages/application-client) - 应用层实现
- [packages/infrastructure-client](packages/infrastructure-client) - 基础设施层实现

**关键文件**:

- Web 应用初始化: `apps/web/src/main.ts`
- 模块初始化: `apps/web/src/modules/{module}/initialization/`
- 类型定义: `packages/contracts/`

---

**审计完成**: 2026-01-18 12:35  
**审计者**: AI Code Audit System  
**下一步**: 执行代码提取和清理操作
