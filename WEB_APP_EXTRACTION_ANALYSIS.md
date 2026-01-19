# Web 应用 Application 和 Infrastructure 提取分析报告

**分析日期**: 2026-01-18  
**目的**: 完整分析 Web 应用中所有未迁移到 packages 的 application 和 infrastructure 代码

---

## 执行摘要

Web 应用 (`apps/web/src/modules`) 中存在大量 **application** 和 **infrastructure** 层代码，需要根据其性质分别处理：

- **应保留在 Web App 中**: UI 特定的 composables、演示组件、Web 特定的初始化逻辑
- **应迁移到 packages**: API 客户端、基础设施服务、事件处理器、应用层服务

---

## 详细模块分析

### 1. **Account 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/events/accountEventHandlers.ts` | 事件处理器 | 监听 AUTH_EVENTS，更新账户存储。**特定于应用初始化**，包含业务逻辑 | ✅ **迁移至** `packages/application-client/account/event-handlers/` |
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务一起迁移 |
| `application/services/` | 应用服务 | （如有）应用层业务逻辑 | ✅ 迁移至 `packages/application-client/account/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/ApiClient.ts` | HTTP 客户端基类 | 通用 API 客户端基础设施 | ✅ **迁移至** `packages/infrastructure-client/` 或 `packages/ui-core/` |
| `infrastructure/api/accountApiClient.ts` | API 客户端 | 账户相关的 API 调用（获取账户、更新资料等） | ✅ **迁移至** `packages/infrastructure-client/account/adapters/http/` |
| `infrastructure/api/index.ts` | 导出文件 | 导出 API 客户端 | ✅ 随客户端迁移 |

**迁移优先级**: 🔴 **HIGH** - 核心基础设施

---

### 2. **Authentication 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/event-handlers/TokenRefreshRequestedHandler.ts` | 事件处理器 | 处理 token 刷新事件，与路由有紧密耦合 | ⚠️ **部分迁移** - 核心逻辑迁移到 `packages/application-client/authentication/handlers/`，Web 路由部分保留 |
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | 认证相关服务 | ✅ 迁移至 `packages/application-client/authentication/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/ApiClient.ts` | HTTP 客户端基类 | 同 Account 模块 | ✅ 迁移至 `packages/infrastructure-client/` 或共用基类 |
| `infrastructure/api/authApiClient.ts` | API 客户端 | 认证 API（登录、注册、token 刷新等） | ✅ **迁移至** `packages/infrastructure-client/authentication/adapters/http/` |
| `infrastructure/api/index.ts` | 导出文件 | 导出 API 客户端 | ✅ 随客户端迁移 |

**迁移优先级**: 🔴 **HIGH** - 核心认证基础设施

---

### 3. **Goal 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/composables/useWeightSnapshot.ts` | Vue Composable | **Vue 特定**，使用 `ref`, `computed`, `watch`。包含 UI 状态管理逻辑 | 🟢 **保留在 Web App** - 这是 Vue 特定的 UI 组合函数 |
| `application/composables/useAutoStatusRules.ts` | Vue Composable | **Vue 特定**，使用状态管理。应该在 Web 中保留 | 🟢 **保留在 Web App** - Vue 特定的状态管理 |
| `application/templates/GoalTemplates.ts` | 数据常量 | 目标模板数据集。**可复用的业务数据**，但主要用于 Web UI 展示 | 🟡 **可选迁移** - 作为数据集可迁移至 `packages/domain-client/goal/templates/`，但目前保留在 Web 也可接受 |
| `application/rules/BuiltInRules.ts` | 规则引擎数据 | 内置状态更新规则。**可复用的业务规则**，独立于 UI 框架 | ✅ **应迁移至** `packages/domain-client/goal/rules/` 或 `packages/application-client/goal/rules/` |
| `application/events/goalEventHandlers.ts` | 事件处理器 | 处理 goal 相关事件 | ✅ **迁移至** `packages/application-client/goal/event-handlers/` |
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | Goal 管理、权重快照等服务 | ✅ 迁移至 `packages/application-client/goal/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/goalApiClient.ts` | API 客户端 | Goal CRUD 操作的 API 调用 | ✅ **迁移至** `packages/infrastructure-client/goal/adapters/http/` |
| `infrastructure/api/weightSnapshotApiClient.ts` | API 客户端 | 权重快照的 API 调用 | ✅ **迁移至** `packages/infrastructure-client/goal/adapters/http/` |
| `infrastructure/api/focusModeApiClient.ts` | API 客户端 | 焦点模式的 API 调用 | ✅ **迁移至** `packages/infrastructure-client/goal/adapters/http/` |

**迁移优先级**: 🔴 **HIGH** - 但注意 Composables 保留

---

### 4. **Authentication 模块（续）- 特别说明**

> ⚠️ **TokenRefreshRequestedHandler 迁移策略**
>
> 这个文件既有应用层逻辑，又有 Web 特定逻辑（router）。建议：
> 1. 提取核心的 Token 刷新逻辑 → `packages/application-client/authentication/handlers/`
> 2. 在 Web App 中创建适配层 → `apps/web/src/modules/authentication/application/handlers/` 用于路由集成
> 3. 或者完全保留在 Web App，因为路由跳转是 Web 特定的

---

### 5. **Task 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | （如有）任务管理服务 | ✅ 迁移至 `packages/application-client/task/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/index.ts` | 导出文件 | 导出 API 客户端 | ✅ 随客户端迁移 |
| `infrastructure/api/taskApiClient.ts` (如果存在) | API 客户端 | 任务 API 调用 | ✅ 迁移至 `packages/infrastructure-client/task/adapters/http/` |

**迁移优先级**: 🟡 **MEDIUM** - 根据具体内容

---

### 6. **Reminder 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | 提醒相关服务 | ✅ 迁移至 `packages/application-client/reminder/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/` | API 客户端 | （如果存在）提醒 API 调用 | ✅ 迁移至 `packages/infrastructure-client/reminder/adapters/http/` |

**迁移优先级**: 🟡 **MEDIUM**

---

### 7. **Schedule 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | 日程管理服务 | ✅ 迁移至 `packages/application-client/schedule/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/scheduleTaskApi.ts` | API 客户端 | 日程 API 调用 | ✅ **迁移至** `packages/infrastructure-client/schedule/adapters/http/` |
| `infrastructure/api/index.ts` | 导出文件 | 导出 API 客户端 | ✅ 随客户端迁移 |

**迁移优先级**: 🟡 **MEDIUM**

---

### 8. **AI 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | AI 相关服务 | ✅ 迁移至 `packages/application-client/ai/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/goalGenerationApiClient.ts` | API 客户端 | AI 目标生成 API 调用 | ✅ **迁移至** `packages/infrastructure-client/ai/adapters/http/` |
| `infrastructure/api/aiConversationApiClient.ts` | API 客户端 | AI 对话 API 调用 | ✅ **迁移至** `packages/infrastructure-client/ai/adapters/http/` |

**迁移优先级**: 🟡 **MEDIUM**

---

### 9. **Setting 模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/events/SettingEventEmitter.ts` | 事件发射器 | 发送设置变更事件到事件总线。**包含业务逻辑**但高度通用 | ✅ **迁移至** `packages/application-client/setting/event-emitters/` |
| `application/index.ts` | 导出文件 | 导出服务 | ✅ 随服务迁移 |
| `application/services/` | 应用服务 | 设置管理服务 | ✅ 迁移至 `packages/application-client/setting/services/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/userSettingApi.ts` | API 客户端 | 用户设置 API 调用 | ✅ **迁移至** `packages/infrastructure-client/setting/adapters/http/` |
| `infrastructure/api/userPreferencesApi.ts` | API 客户端 | 用户偏好 API 调用 | ✅ **迁移至** `packages/infrastructure-client/setting/adapters/http/` |
| `infrastructure/api/SettingSyncApiClient.ts` | API 客户端 | 设置同步 API 调用 | ✅ **迁移至** `packages/infrastructure-client/setting/adapters/http/` |

**迁移优先级**: 🟡 **MEDIUM**

---

### 10. **Notification 模块** 🎯 **最复杂的模块**

#### 📍 应用层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `application/types.ts` | 类型定义 | 通知系统的核心类型（NotificationType, NotificationPriority 等）。**框架无关，高度可复用** | ✅ **迁移至** `packages/domain-client/notification/types/` 或 `packages/contracts/notification` |
| `application/initialization/NotificationInitializationManager.ts` | 初始化管理 | **基础设施初始化**，包含 SSE 连接、权限请求等。**非 UI 特定** | ✅ **迁移至** `packages/infrastructure-client/notification/initialization/` |
| `application/handlers/ReminderNotificationHandler.ts` | 事件处理器 | 处理提醒通知事件。**业务逻辑** | ✅ **迁移至** `packages/application-client/notification/handlers/` |
| `application/events/NotificationEventHandlers.ts` | 事件处理器 | 通知事件处理 | ✅ **迁移至** `packages/application-client/notification/event-handlers/` |
| `application/events/notificationEvents.ts` | 事件定义 | 通知事件常量定义 | ✅ **迁移至** `packages/domain-client/notification/events/` 或 `packages/application-client/notification/events/` |

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/notificationApiClient.ts` | API 客户端 | 通知 API 调用 | ✅ **迁移至** `packages/infrastructure-client/notification/adapters/http/` |
| `infrastructure/sse/SSEClient.ts` | SSE 客户端 | **关键基础设施**。实现 Server-Sent Events 连接、重连、token 刷新等。**完全框架无关，高度通用** | ✅ **迁移至** `packages/infrastructure-client/notification/adapters/sse/` |
| `infrastructure/sse/sseDebug.ts` | 调试工具 | SSE 调试信息 | ✅ **迁移至** `packages/infrastructure-client/notification/adapters/sse/` |
| `infrastructure/storage/NotificationConfigStorage.ts` | 存储服务 | **关键基础设施**。持久化存储通知配置到 localStorage。**框架无关** | ✅ **迁移至** `packages/infrastructure-client/notification/storage/` 或 `packages/infrastructure-client/common/storage/` |
| `infrastructure/browser/NotificationPermissionService.ts` | 权限服务 | **关键基础设施**。检测浏览器通知权限。**Web 特定但框架无关** | ✅ **迁移至** `packages/infrastructure-client/notification/browser/` |
| `infrastructure/services/AudioNotificationService.ts` | 音频服务 | 音频通知播放 | ✅ **迁移至** `packages/infrastructure-client/notification/services/` |
| `infrastructure/services/DesktopNotificationService.ts` | 桌面通知服务 | 桌面通知展示（Notification API） | ✅ **迁移至** `packages/infrastructure-client/notification/services/` |

#### 📍 初始化层（Web 特定）

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `initialization/notificationInitialization.ts` | 初始化脚本 | Web 应用初始化时调用通知模块。**Web 特定的初始化流程** | 🟢 **保留在 Web App** - `apps/web/src/modules/initialization/` |
| `initialization/sseInitialization.ts` | 初始化脚本 | SSE 连接初始化。**Web 特定的初始化流程** | 🟢 **保留在 Web App** - 或迁移到 `packages/infrastructure-client` 并在 Web 中调用 |

**迁移优先级**: 🔴 **HIGH** - 大量基础设施代码应迁移

> 💡 **特别说明**: 
> - Notification 模块有大量可独立使用的基础设施代码
> - SSEClient、NotificationConfigStorage、NotificationPermissionService 等都可在其他应用中复用
> - 只有初始化逻辑需要保留在 Web App 中

---

### 11. **Repository 模块**

#### 📍 基础设施层

| 文件 | 类型 | 分析 | 建议 |
|-----|------|------|------|
| `infrastructure/api/` | API 客户端 | Repository 相关 API 调用 | ✅ 迁移至 `packages/infrastructure-client/repository/adapters/http/` |

**迁移优先级**: 🟡 **MEDIUM**

---

## 迁移路径规划

### packages 中的目标结构

```
packages/
├── application-client/
│   ├── account/
│   │   ├── event-handlers/
│   │   │   └── AccountEventHandlers.ts
│   │   └── services/
│   ├── authentication/
│   │   ├── handlers/
│   │   │   └── TokenRefreshRequestedHandler.ts  # 提取核心逻辑
│   │   └── services/
│   ├── goal/
│   │   ├── rules/
│   │   │   └── BuiltInRules.ts
│   │   ├── event-handlers/
│   │   │   └── goalEventHandlers.ts
│   │   └── services/
│   ├── notification/
│   │   ├── event-handlers/
│   │   │   └── NotificationEventHandlers.ts
│   │   ├── handlers/
│   │   │   └── ReminderNotificationHandler.ts
│   │   └── events/
│   │       └── notificationEvents.ts
│   ├── setting/
│   │   ├── event-emitters/
│   │   │   └── SettingEventEmitter.ts
│   │   └── services/
│   ├── schedule/
│   │   ├── services/
│   │   └── event-handlers/
│   ├── task/
│   │   ├── services/
│   │   └── event-handlers/
│   ├── reminder/
│   │   ├── services/
│   │   └── event-handlers/
│   └── ai/
│       ├── services/
│       └── event-handlers/
│
├── infrastructure-client/
│   ├── account/
│   │   └── adapters/http/
│   │       └── accountApiClient.ts
│   ├── authentication/
│   │   └── adapters/http/
│   │       └── authApiClient.ts
│   ├── goal/
│   │   └── adapters/http/
│   │       ├── goalApiClient.ts
│   │       ├── weightSnapshotApiClient.ts
│   │       └── focusModeApiClient.ts
│   ├── notification/
│   │   ├── adapters/
│   │   │   ├── sse/
│   │   │   │   ├── SSEClient.ts
│   │   │   │   └── sseDebug.ts
│   │   │   ├── http/
│   │   │   │   └── notificationApiClient.ts
│   │   │   └── browser/
│   │   │       └── NotificationPermissionService.ts
│   │   ├── services/
│   │   │   ├── AudioNotificationService.ts
│   │   │   └── DesktopNotificationService.ts
│   │   ├── storage/
│   │   │   └── NotificationConfigStorage.ts
│   │   └── initialization/
│   │       └── NotificationInitializationManager.ts
│   ├── setting/
│   │   └── adapters/http/
│   │       ├── userSettingApi.ts
│   │       ├── userPreferencesApi.ts
│   │       └── SettingSyncApiClient.ts
│   ├── schedule/
│   │   └── adapters/http/
│   │       └── scheduleTaskApi.ts
│   ├── task/
│   │   └── adapters/http/
│   ├── reminder/
│   │   └── adapters/http/
│   ├── repository/
│   │   └── adapters/http/
│   ├── ai/
│   │   └── adapters/http/
│   │       ├── goalGenerationApiClient.ts
│   │       └── aiConversationApiClient.ts
│   └── common/
│       ├── http/
│       │   └── ApiClient.ts  # 基础 HTTP 客户端类
│       └── adapters/
│
└── domain-client/
    ├── goal/
    │   └── rules/
    │       └── BuiltInRules.ts  # 或保留在 application-client
    └── notification/
        └── types/
            └── notificationTypes.ts
```

---

## 完整迁移清单

### 🟢 **保留在 Web App 中**

| 文件 | 原路径 | 原因 |
|-----|-------|------|
| `useWeightSnapshot.ts` | `goal/application/composables/` | Vue 3 Composable，UI 状态管理 |
| `useAutoStatusRules.ts` | `goal/application/composables/` | Vue 3 Composable，UI 特定逻辑 |
| `GoalTemplates.ts` (可选) | `goal/application/templates/` | 主要用于 Web UI 展示（临时例外）|
| `notificationInitialization.ts` | `notification/initialization/` | Web 应用启动初始化 |
| `sseInitialization.ts` | `notification/initialization/` | Web 应用启动初始化 |

### 🟡 **需要分离的文件（部分逻辑迁移，部分保留）**

| 文件 | 核心逻辑迁移至 | Web 保留部分 | 说明 |
|-----|---------------|------------|------|
| `TokenRefreshRequestedHandler.ts` | `packages/application-client/authentication/handlers/` | 路由重定向适配层 | 提取核心 token 刷新逻辑，Web 层处理路由跳转 |

### 🔴 **应迁移至 packages 的文件**

#### Account 模块
```
✅ applications/events/accountEventHandlers.ts 
   → packages/application-client/account/event-handlers/AccountEventHandlers.ts

✅ infrastructure/api/accountApiClient.ts 
   → packages/infrastructure-client/account/adapters/http/accountApiClient.ts

✅ infrastructure/api/ApiClient.ts (基类)
   → packages/infrastructure-client/common/http/ApiClient.ts
```

#### Authentication 模块
```
✅ infrastructure/api/authApiClient.ts 
   → packages/infrastructure-client/authentication/adapters/http/authApiClient.ts

✅ infrastructure/api/ApiClient.ts (基类)
   → packages/infrastructure-client/common/http/ApiClient.ts
```

#### Goal 模块
```
✅ application/rules/BuiltInRules.ts 
   → packages/application-client/goal/rules/BuiltInRules.ts

✅ application/events/goalEventHandlers.ts 
   → packages/application-client/goal/event-handlers/goalEventHandlers.ts

✅ infrastructure/api/goalApiClient.ts 
   → packages/infrastructure-client/goal/adapters/http/goalApiClient.ts

✅ infrastructure/api/weightSnapshotApiClient.ts 
   → packages/infrastructure-client/goal/adapters/http/weightSnapshotApiClient.ts

✅ infrastructure/api/focusModeApiClient.ts 
   → packages/infrastructure-client/goal/adapters/http/focusModeApiClient.ts
```

#### Task 模块
```
✅ infrastructure/api/taskApiClient.ts 
   → packages/infrastructure-client/task/adapters/http/taskApiClient.ts
```

#### Schedule 模块
```
✅ infrastructure/api/scheduleTaskApi.ts 
   → packages/infrastructure-client/schedule/adapters/http/scheduleTaskApi.ts
```

#### Reminder 模块
```
✅ infrastructure/api/* 
   → packages/infrastructure-client/reminder/adapters/http/
```

#### Setting 模块
```
✅ application/events/SettingEventEmitter.ts 
   → packages/application-client/setting/event-emitters/SettingEventEmitter.ts

✅ infrastructure/api/userSettingApi.ts 
   → packages/infrastructure-client/setting/adapters/http/userSettingApi.ts

✅ infrastructure/api/userPreferencesApi.ts 
   → packages/infrastructure-client/setting/adapters/http/userPreferencesApi.ts

✅ infrastructure/api/SettingSyncApiClient.ts 
   → packages/infrastructure-client/setting/adapters/http/SettingSyncApiClient.ts
```

#### AI 模块
```
✅ infrastructure/api/goalGenerationApiClient.ts 
   → packages/infrastructure-client/ai/adapters/http/goalGenerationApiClient.ts

✅ infrastructure/api/aiConversationApiClient.ts 
   → packages/infrastructure-client/ai/adapters/http/aiConversationApiClient.ts
```

#### Repository 模块
```
✅ infrastructure/api/* 
   → packages/infrastructure-client/repository/adapters/http/
```

#### 🎯 Notification 模块（最重要）
```
✅ application/types.ts 
   → packages/domain-client/notification/types/notificationTypes.ts

✅ application/initialization/NotificationInitializationManager.ts 
   → packages/infrastructure-client/notification/initialization/NotificationInitializationManager.ts

✅ application/handlers/ReminderNotificationHandler.ts 
   → packages/application-client/notification/handlers/ReminderNotificationHandler.ts

✅ application/events/NotificationEventHandlers.ts 
   → packages/application-client/notification/event-handlers/NotificationEventHandlers.ts

✅ application/events/notificationEvents.ts 
   → packages/domain-client/notification/events/notificationEvents.ts

✅ infrastructure/api/notificationApiClient.ts 
   → packages/infrastructure-client/notification/adapters/http/notificationApiClient.ts

✅ infrastructure/sse/SSEClient.ts 
   → packages/infrastructure-client/notification/adapters/sse/SSEClient.ts

✅ infrastructure/sse/sseDebug.ts 
   → packages/infrastructure-client/notification/adapters/sse/sseDebug.ts

✅ infrastructure/storage/NotificationConfigStorage.ts 
   → packages/infrastructure-client/notification/storage/NotificationConfigStorage.ts

✅ infrastructure/browser/NotificationPermissionService.ts 
   → packages/infrastructure-client/notification/browser/NotificationPermissionService.ts

✅ infrastructure/services/AudioNotificationService.ts 
   → packages/infrastructure-client/notification/services/AudioNotificationService.ts

✅ infrastructure/services/DesktopNotificationService.ts 
   → packages/infrastructure-client/notification/services/DesktopNotificationService.ts
```

---

## 迁移优先级

### 🔴 **第一阶段（最高优先级）**
1. **Notification 模块基础设施**
   - SSEClient - 关键的实时通知基础设施
   - NotificationInitializationManager - 初始化管理
   - NotificationConfigStorage - 配置存储
   - NotificationPermissionService - 权限服务

2. **Account 模块**
   - accountApiClient.ts - 核心 API 客户端
   - accountEventHandlers.ts - 事件处理

3. **Authentication 模块**
   - authApiClient.ts - 核心 API 客户端
   - TokenRefreshRequestedHandler - token 刷新

4. **Goal 模块**
   - BuiltInRules.ts - 业务规则
   - API 客户端

### 🟡 **第二阶段（中等优先级）**
1. Task、Schedule、Reminder、AI、Setting 模块的 API 客户端
2. Setting 模块的事件发射器
3. 其他通知模块组件

### 🟢 **第三阶段（低优先级/可选）**
1. GoalTemplates.ts（数据集，可保留在 Web 或迁移）
2. 其他可选的数据常量

---

## 实施注意事项

### 1. **依赖关系管理**
- API 客户端需要基础 HTTP 客户端类 (`ApiClient.ts`)
- 需要统一管理 HTTP 客户端的创建和配置
- 事件处理器依赖事件总线 (`@dailyuse/utils`)

### 2. **导出和导入更新**
- 迁移后需要更新 Web App 中的导入语句
- 更新 `packages/*/src/index.ts` 的导出声明
- 检查 package.json 中的依赖声明

### 3. **测试**
- 为每个迁移的模块编写单元测试
- 集成测试验证 API 调用正常工作
- 事件处理器测试确保事件流正确

### 4. **向后兼容性**
- 保留 Web App 中的导出，转发到新位置
- 或使用 package.json 的 exports 字段指向新位置

### 5. **文档更新**
- 更新模块文档，说明组件位置
- 更新导入指南
- 更新架构文档

---

## 总体统计

| 类别 | 数量 | 优先级 |
|-----|------|--------|
| 应保留在 Web App | ~5 个 | - |
| 需要分离的文件 | ~1 个 | HIGH |
| 应迁移至 packages | ~50+ 个 | HIGH/MEDIUM |

**迁移总计**: 约 50+ 个文件需要迁移到 packages

---

## 建议的实施步骤

1. **第一步**: 创建 packages 中的目录结构
2. **第二步**: 迁移 Notification 模块（优先级最高）
3. **第三步**: 迁移 Account 和 Authentication 模块
4. **第四步**: 迁移 Goal、Schedule、Task、Reminder 等业务模块
5. **第五步**: 更新 Web App 中的所有导入语句
6. **第六步**: 运行测试和 lint，验证没有破坏
7. **第七步**: 更新文档和指南

---

## 附录：文件完整清单

### 现有的 application 文件
```
✅ account/application/events/accountEventHandlers.ts
✅ account/application/index.ts
✅ authentication/application/event-handlers/TokenRefreshRequestedHandler.ts
✅ authentication/application/index.ts
✅ goal/application/composables/useWeightSnapshot.ts
✅ goal/application/composables/useAutoStatusRules.ts
✅ goal/application/templates/GoalTemplates.ts
✅ goal/application/rules/BuiltInRules.ts
✅ goal/application/events/goalEventHandlers.ts
✅ goal/application/index.ts
✅ notification/application/types.ts
✅ notification/application/initialization/NotificationInitializationManager.ts
✅ notification/application/handlers/ReminderNotificationHandler.ts
✅ notification/application/events/NotificationEventHandlers.ts
✅ notification/application/events/notificationEvents.ts
✅ schedule/application/index.ts
✅ task/application/index.ts
✅ reminder/application/index.ts
✅ setting/application/events/SettingEventEmitter.ts
✅ ai/application/index.ts
```

### 现有的 infrastructure 文件
```
✅ account/infrastructure/api/ApiClient.ts
✅ account/infrastructure/api/accountApiClient.ts
✅ account/infrastructure/api/index.ts
✅ authentication/infrastructure/api/ApiClient.ts
✅ authentication/infrastructure/api/authApiClient.ts
✅ authentication/infrastructure/api/index.ts
✅ goal/infrastructure/api/goalApiClient.ts
✅ goal/infrastructure/api/weightSnapshotApiClient.ts
✅ goal/infrastructure/api/focusModeApiClient.ts
✅ notification/infrastructure/api/notificationApiClient.ts
✅ notification/infrastructure/sse/SSEClient.ts
✅ notification/infrastructure/sse/sseDebug.ts
✅ notification/infrastructure/storage/NotificationConfigStorage.ts
✅ notification/infrastructure/browser/NotificationPermissionService.ts
✅ notification/infrastructure/services/AudioNotificationService.ts
✅ notification/infrastructure/services/DesktopNotificationService.ts
✅ schedule/infrastructure/api/scheduleTaskApi.ts
✅ schedule/infrastructure/api/index.ts
✅ setting/infrastructure/api/userSettingApi.ts
✅ setting/infrastructure/api/userPreferencesApi.ts
✅ setting/infrastructure/api/SettingSyncApiClient.ts
✅ ai/infrastructure/api/goalGenerationApiClient.ts
✅ ai/infrastructure/api/aiConversationApiClient.ts
✅ task/infrastructure/api/index.ts
✅ repository/infrastructure/api/index.ts
```

---

**生成时间**: 2026-01-18  
**版本**: 1.0
