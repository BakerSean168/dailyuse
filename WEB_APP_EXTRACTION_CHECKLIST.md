# Web App Application 和 Infrastructure 迁移清单

**生成日期**: 2026-01-18  
**状态**: 准备迁移  

---

## 📋 清单概览

### 统计数据
- **保留在 Web App**: 5 个文件
- **需要分离（部分迁移）**: 1 个文件
- **完整迁移至 packages**: ~48 个文件
- **总计**: ~54 个文件需要处理

---

## 🟢 保留在 Web App 中

这些文件是 **Vue 3 特定的** 或 **Web 应用初始化特定的**，应保留在 Web 应用中。

### Goal 模块 - Composables

- [ ] `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts`
  - **原因**: Vue 3 Composable，使用 ref/computed/watch，UI 状态管理
  - **依赖**: weightSnapshotWebApplicationService（应迁移）
  - **处理**: 保留，但更新导入以使用 packages 中迁移后的服务

- [ ] `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts`
  - **原因**: Vue 3 Composable，使用 Vue 响应式 API
  - **依赖**: statusRuleEngine（应迁移）
  - **处理**: 保留，但更新导入

### Goal 模块 - 数据模板（可选保留）

- [ ] `apps/web/src/modules/goal/application/templates/GoalTemplates.ts`
  - **原因**: 目标模板数据集，主要用于 Web UI 展示
  - **可选**: 可迁移至 `packages/domain-client/goal/templates/` 或保留
  - **当前建议**: 👉 **保留在 Web App**（暂时）- 可在第二阶段迁移

### Notification 模块 - Web 初始化

- [ ] `apps/web/src/modules/notification/initialization/notificationInitialization.ts`
  - **原因**: Web 应用启动时调用，Web 特定的初始化流程
  - **处理**: 保留，调用迁移后的 `packages/infrastructure-client` 中的初始化器

- [ ] `apps/web/src/modules/notification/initialization/sseInitialization.ts`
  - **原因**: Web 应用启动时调用，Web 特定的初始化流程
  - **处理**: 保留或迁移到 packages（取决于是否在其他应用中需要）
  - **当前建议**: 👉 **保留在 Web App**

---

## 🟡 需要分离的文件

这些文件包含既有应用层逻辑，又有 Web 特定逻辑，需要提取后分离。

### Authentication 模块 - Token 刷新处理

- [ ] `apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts`
  - **当前位置**: `apps/web/src/modules/authentication/application/event-handlers/`
  - **分离计划**:
    1. **提取核心逻辑** → `packages/application-client/authentication/handlers/TokenRefreshHandler.ts`
       - 移除对 `router` 的依赖
       - 只保留 token 刷新逻辑
    2. **保留 Web 适配层** → `apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts`
       - 导入 `packages/application-client` 中的处理器
       - 添加路由跳转逻辑（Web 特定）
  - **优先级**: 🔴 HIGH - 第一阶段处理

---

## 🔴 完整迁移至 packages 的文件

### 📁 Account 模块

#### 应用层

- [ ] `apps/web/src/modules/account/application/events/accountEventHandlers.ts`
  - **迁移目标**: `packages/application-client/src/account/event-handlers/AccountEventHandlers.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: @dailyuse/utils (eventBus), useAccountStore (保留 Web 中), API 客户端
  - **更新导入**: Web 中的导入改为 `import { AccountEventHandlers } from '@dailyuse/application-client/account'`

- [ ] `apps/web/src/modules/account/application/index.ts`
  - **处理**: 随后删除，或转换为转发导出
  - **新的导出来源**: `packages/application-client/src/account/index.ts`

#### 基础设施层

- [ ] `apps/web/src/modules/account/infrastructure/api/accountApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/account/adapters/http/accountApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **注意**: 删除与 Web 特定的依赖（如 useAccountStore）
  - **依赖**: ApiClient 基类

- [ ] `apps/web/src/modules/account/infrastructure/api/ApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/common/http/ApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 基础 HTTP 客户端类，多个模块共享
  - **共享**: Account 和 Authentication 模块都使用这个基类

- [ ] `apps/web/src/modules/account/infrastructure/api/index.ts`
  - **处理**: 删除，使用 packages 中的导出

---

### 📁 Authentication 模块

#### 基础设施层

- [ ] `apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/authentication/adapters/http/authApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: ApiClient 基类

- [ ] `apps/web/src/modules/authentication/infrastructure/api/ApiClient.ts`
  - **处理**: 与 Account 模块相同，迁移到 `packages/infrastructure-client/src/common/http/`
  - **优先级**: 🔴 HIGH
  - **说明**: 可能与 Account 模块中的 ApiClient.ts 重复

- [ ] `apps/web/src/modules/authentication/infrastructure/api/index.ts`
  - **处理**: 删除，使用 packages 中的导出

#### 应用层

- [ ] `apps/web/src/modules/authentication/application/index.ts`
  - **处理**: 删除或转换为转发导出

---

### 📁 Goal 模块

#### 应用层

- [ ] `apps/web/src/modules/goal/application/rules/BuiltInRules.ts`
  - **迁移目标**: `packages/application-client/src/goal/rules/BuiltInRules.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 业务规则，与 UI 框架无关
  - **依赖**: @dailyuse/contracts/goal

- [ ] `apps/web/src/modules/goal/application/events/goalEventHandlers.ts`
  - **迁移目标**: `packages/application-client/src/goal/event-handlers/goalEventHandlers.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: eventBus, API 客户端

- [ ] `apps/web/src/modules/goal/application/index.ts`
  - **处理**: 删除或转换为转发导出

#### 基础设施层

- [ ] `apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/goal/adapters/http/goalApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/goal/adapters/http/weightSnapshotApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/goal/infrastructure/api/focusModeApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/goal/adapters/http/focusModeApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **依赖**: apiClient 实例

---

### 📁 Task 模块

#### 应用层

- [ ] `apps/web/src/modules/task/application/index.ts`
  - **处理**: 根据内容决定是否迁移

#### 基础设施层

- [ ] `apps/web/src/modules/task/infrastructure/api/index.ts`
  - **处理**: 检查是否有实际的 API 客户端文件需要迁移
  - **迁移目标**: `packages/infrastructure-client/src/task/adapters/http/`
  - **优先级**: 🟡 MEDIUM

---

### 📁 Schedule 模块

#### 应用层

- [ ] `apps/web/src/modules/schedule/application/index.ts`
  - **处理**: 根据内容决定是否迁移

#### 基础设施层

- [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleTaskApi.ts`
  - **迁移目标**: `packages/infrastructure-client/src/schedule/adapters/http/scheduleTaskApi.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/schedule/infrastructure/api/index.ts`
  - **处理**: 删除，使用 packages 中的导出

---

### 📁 Reminder 模块

#### 应用层

- [ ] `apps/web/src/modules/reminder/application/index.ts`
  - **处理**: 根据内容决定是否迁移

#### 基础设施层

- [ ] `apps/web/src/modules/reminder/infrastructure/api/` （如果存在文件）
  - **迁移目标**: `packages/infrastructure-client/src/reminder/adapters/http/`
  - **优先级**: 🟡 MEDIUM

---

### 📁 Setting 模块

#### 应用层

- [ ] `apps/web/src/modules/setting/application/events/SettingEventEmitter.ts`
  - **迁移目标**: `packages/application-client/src/setting/event-emitters/SettingEventEmitter.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: eventBus, ThemeEvents

#### 基础设施层

- [ ] `apps/web/src/modules/setting/infrastructure/api/userSettingApi.ts`
  - **迁移目标**: `packages/infrastructure-client/src/setting/adapters/http/userSettingApi.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/setting/infrastructure/api/userPreferencesApi.ts`
  - **迁移目标**: `packages/infrastructure-client/src/setting/adapters/http/userPreferencesApi.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/setting/infrastructure/api/SettingSyncApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/setting/adapters/http/SettingSyncApiClient.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

---

### 📁 AI 模块

#### 基础设施层

- [ ] `apps/web/src/modules/ai/infrastructure/api/goalGenerationApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/ai/adapters/http/goalGenerationApiClient.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

- [ ] `apps/web/src/modules/ai/infrastructure/api/aiConversationApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/ai/adapters/http/aiConversationApiClient.ts`
  - **优先级**: 🟡 MEDIUM
  - **依赖**: apiClient 实例

#### 应用层

- [ ] `apps/web/src/modules/ai/application/index.ts`
  - **处理**: 根据内容决定是否迁移

---

### 📁 Repository 模块

#### 基础设施层

- [ ] `apps/web/src/modules/repository/infrastructure/api/index.ts` 
  - **处理**: 检查是否有实际的 API 客户端文件
  - **迁移目标**: `packages/infrastructure-client/src/repository/adapters/http/`
  - **优先级**: 🟡 MEDIUM

---

### 🎯 📁 Notification 模块 (最优先)

这是最重要的模块，包含大量可复用的基础设施代码。

#### 应用层 - 类型定义

- [ ] `apps/web/src/modules/notification/application/types.ts`
  - **迁移目标**: `packages/domain-client/src/notification/types/notificationTypes.ts` 或 `packages/application-client/src/notification/types/`
  - **优先级**: 🔴 HIGH
  - **说明**: 类型定义，与框架无关，高度复用
  - **内容**: NotificationType, NotificationPriority 等枚举和接口
  - **处理**: 直接迁移，Web 中改为导入

#### 应用层 - 初始化管理

- [ ] `apps/web/src/modules/notification/application/initialization/NotificationInitializationManager.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/initialization/NotificationInitializationManager.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 初始化管理器，包含 SSE 连接、权限请求等核心基础设施初始化
  - **与 Web 的关系**: 框架无关，可在任何应用中使用
  - **处理**: 迁移后，Web 中的初始化脚本调用它

#### 应用层 - 事件处理

- [ ] `apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`
  - **迁移目标**: `packages/application-client/src/notification/handlers/ReminderNotificationHandler.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 提醒通知事件处理器
  - **处理**: 迁移，Web 中的初始化脚本导入使用

- [ ] `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`
  - **迁移目标**: `packages/application-client/src/notification/event-handlers/NotificationEventHandlers.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 通知事件处理器
  - **处理**: 迁移

- [ ] `apps/web/src/modules/notification/application/events/notificationEvents.ts`
  - **迁移目标**: `packages/domain-client/src/notification/events/notificationEvents.ts` 或 `packages/application-client/src/notification/events/`
  - **优先级**: 🔴 HIGH
  - **说明**: 通知事件常量定义
  - **处理**: 迁移

#### 基础设施层 - API 客户端

- [ ] `apps/web/src/modules/notification/infrastructure/api/notificationApiClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/adapters/http/notificationApiClient.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 通知相关的 HTTP API 调用
  - **依赖**: apiClient 实例

#### 基础设施层 - SSE 客户端 ⭐ 最关键

- [ ] `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/adapters/sse/SSEClient.ts`
  - **优先级**: 🔴 **CRITICAL** - 必须第一个迁移！
  - **说明**: Server-Sent Events 客户端，实现实时推送连接
  - **重要性**: 
    - 这是核心的实时通知基础设施
    - 完全框架无关
    - 可在其他应用（桌面、移动）中复用
    - 包含重连逻辑、token 刷新监听等复杂逻辑
  - **处理**: 优先迁移，Web 中的初始化脚本导入使用
  - **无须改动**: 只需移动文件位置

- [ ] `apps/web/src/modules/notification/infrastructure/sse/sseDebug.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/adapters/sse/sseDebug.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: SSE 调试信息
  - **处理**: 与 SSEClient.ts 一起迁移

#### 基础设施层 - 存储服务

- [ ] `apps/web/src/modules/notification/infrastructure/storage/NotificationConfigStorage.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/storage/NotificationConfigStorage.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 通知配置的 localStorage 存储管理
  - **重要性**: 
    - 独立的存储服务
    - 可在其他应用中复用
    - 与 Web 框架无关
  - **处理**: 直接迁移

#### 基础设施层 - 浏览器权限服务

- [ ] `apps/web/src/modules/notification/infrastructure/browser/NotificationPermissionService.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/browser/NotificationPermissionService.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 浏览器通知权限检测和请求
  - **重要性**: 
    - Web 浏览器特定但框架无关
    - 可在其他浏览器应用中复用
  - **处理**: 直接迁移

#### 基础设施层 - 通知服务

- [ ] `apps/web/src/modules/notification/infrastructure/services/AudioNotificationService.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/services/AudioNotificationService.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 音频通知播放
  - **处理**: 直接迁移

- [ ] `apps/web/src/modules/notification/infrastructure/services/DesktopNotificationService.ts`
  - **迁移目标**: `packages/infrastructure-client/src/notification/services/DesktopNotificationService.ts`
  - **优先级**: 🔴 HIGH
  - **说明**: 桌面通知（使用 Notification API）
  - **处理**: 直接迁移

---

### 📁 Repository 模块

- [ ] `apps/web/src/modules/repository/infrastructure/api/` （如果存在 API 客户端）
  - **迁移目标**: `packages/infrastructure-client/src/repository/adapters/http/`
  - **优先级**: 🟡 MEDIUM

---

## 迁移执行顺序

### ✅ 第一阶段 - 基础设施 (Week 1)

优先级: 🔴 **CRITICAL**

1. **准备工作**
   - [ ] 在 packages 中创建目录结构
   - [ ] 创建 ApiClient 基类在 `packages/infrastructure-client/src/common/http/`

2. **Notification 模块 - 核心基础设施**
   - [ ] 迁移 `SSEClient.ts` + `sseDebug.ts` → `packages/infrastructure-client/notification/adapters/sse/`
   - [ ] 迁移 `NotificationConfigStorage.ts` → `packages/infrastructure-client/notification/storage/`
   - [ ] 迁移 `NotificationPermissionService.ts` → `packages/infrastructure-client/notification/browser/`
   - [ ] 迁移 `AudioNotificationService.ts` + `DesktopNotificationService.ts` → `packages/infrastructure-client/notification/services/`
   - [ ] 迁移 `notificationApiClient.ts` → `packages/infrastructure-client/notification/adapters/http/`
   - [ ] 迁移 `NotificationInitializationManager.ts` → `packages/infrastructure-client/notification/initialization/`

3. **Notification 模块 - 应用层**
   - [ ] 迁移 `types.ts` → `packages/domain-client/notification/types/`
   - [ ] 迁移 `notificationEvents.ts` → `packages/domain-client/notification/events/`
   - [ ] 迁移 `NotificationEventHandlers.ts` → `packages/application-client/notification/event-handlers/`
   - [ ] 迁移 `ReminderNotificationHandler.ts` → `packages/application-client/notification/handlers/`

4. **Account 和 Authentication 基础设施**
   - [ ] 迁移 `ApiClient.ts` 基类 (去重) → `packages/infrastructure-client/common/http/`
   - [ ] 迁移 `accountApiClient.ts` → `packages/infrastructure-client/account/adapters/http/`
   - [ ] 迁移 `authApiClient.ts` → `packages/infrastructure-client/authentication/adapters/http/`

5. **Account 和 Authentication 应用层**
   - [ ] 迁移 `accountEventHandlers.ts` → `packages/application-client/account/event-handlers/`
   - [ ] 分离 `TokenRefreshRequestedHandler.ts`
     - 核心逻辑 → `packages/application-client/authentication/handlers/`
     - Web 适配 → 保留在 Web

### ✅ 第二阶段 - 业务模块 (Week 2-3)

优先级: 🔴 **HIGH**

1. **Goal 模块**
   - [ ] 迁移 `BuiltInRules.ts` → `packages/application-client/goal/rules/`
   - [ ] 迁移 `goalEventHandlers.ts` → `packages/application-client/goal/event-handlers/`
   - [ ] 迁移 `goalApiClient.ts` → `packages/infrastructure-client/goal/adapters/http/`
   - [ ] 迁移 `weightSnapshotApiClient.ts` → `packages/infrastructure-client/goal/adapters/http/`
   - [ ] 迁移 `focusModeApiClient.ts` → `packages/infrastructure-client/goal/adapters/http/`

### ✅ 第三阶段 - 其他模块 (Week 3-4)

优先级: 🟡 **MEDIUM**

1. **Schedule 模块**
   - [ ] 迁移 `scheduleTaskApi.ts` → `packages/infrastructure-client/schedule/adapters/http/`

2. **Setting 模块**
   - [ ] 迁移 `SettingEventEmitter.ts` → `packages/application-client/setting/event-emitters/`
   - [ ] 迁移 `userSettingApi.ts` → `packages/infrastructure-client/setting/adapters/http/`
   - [ ] 迁移 `userPreferencesApi.ts` → `packages/infrastructure-client/setting/adapters/http/`
   - [ ] 迁移 `SettingSyncApiClient.ts` → `packages/infrastructure-client/setting/adapters/http/`

3. **AI 模块**
   - [ ] 迁移 `goalGenerationApiClient.ts` → `packages/infrastructure-client/ai/adapters/http/`
   - [ ] 迁移 `aiConversationApiClient.ts` → `packages/infrastructure-client/ai/adapters/http/`

4. **其他模块**
   - [ ] 迁移 Task、Reminder、Repository 等模块的 API 客户端

### ✅ 第四阶段 - 清理和验证 (Week 4)

1. **更新导入**
   - [ ] 更新 Web App 中所有导入语句，指向 packages
   - [ ] 添加转发导出到 Web App（兼容性）

2. **更新 package.json**
   - [ ] 确保所有依赖关系正确

3. **测试和验证**
   - [ ] 运行 lint
   - [ ] 运行单元测试
   - [ ] 运行集成测试
   - [ ] 检查是否有导入错误

4. **文档更新**
   - [ ] 更新模块文档
   - [ ] 更新导入指南
   - [ ] 更新架构文档

---

## 依赖关系映射

### ApiClient 基类
```
account/infrastructure/api/ApiClient.ts ──┐
                                          ├──> packages/infrastructure-client/common/http/ApiClient.ts
authentication/infrastructure/api/ApiClient.ts ┘

所有 API 客户端依赖:
├── goalApiClient.ts
├── accountApiClient.ts
├── authApiClient.ts
├── scheduleTaskApi.ts
├── userSettingApi.ts
├── notificationApiClient.ts
└── ... (其他)
```

### 事件总线依赖
```
@dailyuse/utils (eventBus) ◄─── 
├── accountEventHandlers.ts
├── goalEventHandlers.ts
├── NotificationEventHandlers.ts
├── ReminderNotificationHandler.ts
└── SettingEventEmitter.ts
```

### 合约依赖
```
@dailyuse/contracts/* ◄───
├── Goal 模块
├── Account 模块
├── Authentication 模块
├── Notification 模块
└── ... (所有业务模块)
```

---

## 迁移完成标志

✅ 迁移完成后应满足以下条件：

1. **所有 API 客户端在 `packages/infrastructure-client` 中**
   - [ ] 能够从 `@dailyuse/infrastructure-client` 导入所有 API 客户端

2. **所有应用层服务在 `packages/application-client` 中**
   - [ ] 能够从 `@dailyuse/application-client` 导入所有应用层服务

3. **类型定义在 `packages/domain-client` 中**
   - [ ] 能够从 `@dailyuse/domain-client` 或 `@dailyuse/contracts` 导入所有类型

4. **Web App 中的导入已更新**
   - [ ] 所有导入语句都指向 packages
   - [ ] 没有循环依赖

5. **测试通过**
   - [ ] 所有 lint 检查通过
   - [ ] 所有单元测试通过
   - [ ] 集成测试验证功能正常

6. **文档已更新**
   - [ ] 架构文档已更新
   - [ ] 导入指南已更新
   - [ ] 模块文档已更新

---

**版本**: 1.0  
**最后更新**: 2026-01-18
