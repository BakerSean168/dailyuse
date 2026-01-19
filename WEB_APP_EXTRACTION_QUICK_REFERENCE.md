# Web App 代码提取快速参考

**生成日期**: 2026-01-18

---

## 📊 快速概览

| 类别 | 数量 | 目标 | 优先级 |
|-----|------|------|--------|
| 保留在 Web App | 5 | - | - |
| 部分迁移（分离） | 1 | packages | HIGH |
| 完整迁移 | ~48 | packages | HIGH/MEDIUM |
| **总计** | **54** | - | - |

---

## 🎯 按模块快速清单

### Account 模块
```
迁移至 packages/infrastructure-client/account/:
  ✅ infrastructure/api/accountApiClient.ts
  ✅ infrastructure/api/ApiClient.ts (共享)

迁移至 packages/application-client/account/:
  ✅ application/events/accountEventHandlers.ts
```

### Authentication 模块
```
迁移至 packages/infrastructure-client/authentication/:
  ✅ infrastructure/api/authApiClient.ts
  ✅ infrastructure/api/ApiClient.ts (共享)

需要分离:
  ⚠️ application/event-handlers/TokenRefreshRequestedHandler.ts
     → 核心逻辑迁移，Web 路由部分保留
```

### Goal 模块
```
保留在 Web App:
  🟢 application/composables/useWeightSnapshot.ts (Vue Composable)
  🟢 application/composables/useAutoStatusRules.ts (Vue Composable)
  🟢 application/templates/GoalTemplates.ts (可选)

迁移至 packages/application-client/goal/:
  ✅ application/rules/BuiltInRules.ts
  ✅ application/events/goalEventHandlers.ts

迁移至 packages/infrastructure-client/goal/:
  ✅ infrastructure/api/goalApiClient.ts
  ✅ infrastructure/api/weightSnapshotApiClient.ts
  ✅ infrastructure/api/focusModeApiClient.ts
```

### 🎯 Notification 模块（最优先）
```
保留在 Web App:
  🟢 initialization/notificationInitialization.ts
  🟢 initialization/sseInitialization.ts

迁移至 packages/infrastructure-client/notification/:
  ✅ infrastructure/sse/SSEClient.ts ⭐ CRITICAL
  ✅ infrastructure/sse/sseDebug.ts
  ✅ infrastructure/storage/NotificationConfigStorage.ts
  ✅ infrastructure/browser/NotificationPermissionService.ts
  ✅ infrastructure/services/AudioNotificationService.ts
  ✅ infrastructure/services/DesktopNotificationService.ts
  ✅ infrastructure/api/notificationApiClient.ts
  ✅ application/initialization/NotificationInitializationManager.ts

迁移至 packages/application-client/notification/:
  ✅ application/handlers/ReminderNotificationHandler.ts
  ✅ application/events/NotificationEventHandlers.ts

迁移至 packages/domain-client/notification/:
  ✅ application/types.ts
  ✅ application/events/notificationEvents.ts
```

### Schedule 模块
```
迁移至 packages/infrastructure-client/schedule/:
  ✅ infrastructure/api/scheduleTaskApi.ts
```

### Setting 模块
```
迁移至 packages/application-client/setting/:
  ✅ application/events/SettingEventEmitter.ts

迁移至 packages/infrastructure-client/setting/:
  ✅ infrastructure/api/userSettingApi.ts
  ✅ infrastructure/api/userPreferencesApi.ts
  ✅ infrastructure/api/SettingSyncApiClient.ts
```

### AI 模块
```
迁移至 packages/infrastructure-client/ai/:
  ✅ infrastructure/api/goalGenerationApiClient.ts
  ✅ infrastructure/api/aiConversationApiClient.ts
```

### Task 模块
```
迁移至 packages/infrastructure-client/task/:
  ✅ infrastructure/api/* (如果存在)
```

### Reminder 模块
```
迁移至 packages/infrastructure-client/reminder/:
  ✅ infrastructure/api/* (如果存在)
```

### Repository 模块
```
迁移至 packages/infrastructure-client/repository/:
  ✅ infrastructure/api/* (如果存在)
```

---

## 🔑 关键点

### 1. API 客户端基类 (ApiClient.ts)
- **位置**: Account 和 Authentication 模块中都有
- **处理**: 去重，统一迁移到 `packages/infrastructure-client/common/http/ApiClient.ts`
- **影响**: 所有 API 客户端依赖这个基类

### 2. Vue Composables
- **保留规则**: 所有 Vue 特定的 Composables（使用 ref/computed/watch）保留在 Web App
- **示例**: `useWeightSnapshot.ts`, `useAutoStatusRules.ts`
- **处理**: 更新导入，指向迁移后的服务

### 3. 事件处理器和发射器
- **原则**: 事件处理逻辑迁移到 packages
- **初始化**: Web 中的初始化脚本调用 packages 中的处理器注册函数

### 4. Notification 模块特殊说明
- **最优先**: SSEClient.ts 是关键的实时基础设施
- **完整可复用**: 所有 notification infrastructure 代码都可迁移到 packages
- **初始化脚本**: Web 中的初始化脚本调用迁移后的初始化管理器

### 5. TokenRefreshRequestedHandler 处理
- **特殊性**: 既有业务逻辑，又依赖 Web 路由
- **建议**: 
  - 提取核心 token 刷新逻辑到 packages
  - 在 Web 中创建适配层处理路由跳转
  - 或保留在 Web 中（取决于是否在其他应用中需要）

---

## 📋 导入更新示例

### 迁移前 (Web App)
```typescript
import { accountEventHandlers } from '@/modules/account/application/events/accountEventHandlers';
import { accountApiClient } from '@/modules/account/infrastructure/api/accountApiClient';
import { SSEClient } from '@/modules/notification/infrastructure/sse/SSEClient';
import { NotificationInitializationManager } from '@/modules/notification/application/initialization/NotificationInitializationManager';
```

### 迁移后 (Web App)
```typescript
import { AccountEventHandlers } from '@dailyuse/application-client/account/event-handlers';
import { getAccountApiClient } from '@dailyuse/infrastructure-client/account/adapters/http';
import { SSEClient } from '@dailyuse/infrastructure-client/notification/adapters/sse';
import { NotificationInitializationManager } from '@dailyuse/infrastructure-client/notification/initialization';
```

---

## 🚀 迁移顺序建议

### 第一周：基础设施和核心
1. **准备**: 创建 packages 目录结构
2. **Notification**: SSEClient + 相关基础设施
3. **Account/Auth**: API 客户端和基类
4. **更新导入**: Web App 中的导入语句

### 第二周：业务模块
1. **Goal**: 规则、事件处理、API 客户端
2. **Setting**: 事件发射器、API 客户端
3. **Schedule**: API 客户端

### 第三周：验证和测试
1. **Lint**: 确保没有导入错误
2. **Test**: 运行所有测试
3. **Doc**: 更新文档

---

## ✅ 完成标志

```
☑ 所有 API 客户端在 packages/infrastructure-client 中
☑ 所有应用层服务在 packages/application-client 中
☑ 所有基础设施在 packages/infrastructure-client 中
☑ Web App 中的导入已更新为 @dailyuse/* 格式
☑ 没有循环依赖
☑ Lint 检查通过
☑ 测试通过
☑ 文档已更新
```

---

## 📞 依赖关系

```
Web App
├── application/
│   └── Composables (保留)
├── infrastructure/
│   └── API 客户端 (迁移)
└── initialization/
    └── 调用 packages 中的初始化器

packages/
├── infrastructure-client/
│   ├── API 客户端
│   ├── 基础设施服务
│   └── 存储、权限等
├── application-client/
│   ├── 应用层服务
│   ├── 事件处理器
│   └── 规则引擎
└── domain-client/
    ├── 类型定义
    └── 事件定义
```

---

**版本**: 1.0  
**最后更新**: 2026-01-18
