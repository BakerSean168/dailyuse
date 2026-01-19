# 快速参考 - Web 应用代码审计结果

## 📊 总体统计

| 指标                         | 数值              |
| ---------------------------- | ----------------- |
| Web 应用 Application 文件    | 21                |
| Web 应用 Infrastructure 文件 | 34                |
| **应该保留的文件**           | ~25 (74%)         |
| **应该提取/删除的文件**      | ~30 (88%)         |
| **packages 中有对应实现**    | 10/10 模块 (100%) |

---

## ✅ 应该保留

### 按模块汇总

| 模块               | 保留文件                                                | 位置                          |
| ------------------ | ------------------------------------------------------- | ----------------------------- |
| **account**        | AccountEventHandlers.ts                                 | application/events/           |
| **ai**             | -                                                       | ✓ 全部提取                    |
| **authentication** | TokenRefreshRequestedHandler.ts                         | application/event-handlers/   |
| **goal**           | GoalTemplates.ts, useWeightSnapshot, useAutoStatusRules | application/                  |
| **notification**   | 初始化器、SSE、浏览器、存储服务                         | application/, infrastructure/ |
| **reminder**       | -                                                       | ✓ 全部提取                    |
| **repository**     | -                                                       | ✓ 全部提取                    |
| **schedule**       | -                                                       | ✓ 全部提取                    |
| **setting**        | SettingEventEmitter.ts (待评估)                         | application/events/           |
| **task**           | -                                                       | ✓ 全部提取                    |

### 具体文件清单

```
✓ 保留 (Web 特定):
  - */application/events/*EventHandlers.ts (事件初始化和监听)
  - */application/initialization/*.ts (模块启动)
  - */application/composables/*.ts (Vue Composables)
  - */application/handlers/*.ts (事件处理逻辑)
  - */infrastructure/sse/*.ts (Server-Sent Events)
  - */infrastructure/browser/*.ts (浏览器 API)
  - */infrastructure/storage/*.ts (本地存储)
  - */infrastructure/services/*.ts (浏览器特定服务)
```

---

## ❌ 应该提取/删除

### 按优先级

**优先级 1: 立即提取 (API 客户端)**

```
- apps/web/src/modules/account/infrastructure/api/accountApiClient.ts
- apps/web/src/modules/ai/infrastructure/api/ai*.ts (4个文件)
- apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts
- apps/web/src/modules/goal/infrastructure/api/*.ts (3个文件)
- apps/web/src/modules/notification/infrastructure/api/notificationApiClient.ts
- apps/web/src/modules/repository/infrastructure/api/*.ts (2个文件)
- apps/web/src/modules/schedule/infrastructure/api/*.ts (3个文件)
- apps/web/src/modules/setting/infrastructure/api/*.ts (4个文件)
- apps/web/src/modules/task/infrastructure/api/taskApiClient.ts
- apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts
```

**小计**: ~30 个文件

**优先级 2: 条件提取 (事件定义)**

```
- apps/web/src/modules/authentication/application/events/authEvents.ts
- apps/web/src/modules/notification/application/events/notificationEvents.ts
- apps/web/src/modules/goal/application/rules/BuiltInRules.ts
```

**小计**: ~3 个文件

---

## 🔄 迁移步骤

### 1️⃣ 验证 packages 完整性

```bash
# 检查 packages 中的实现
ls -la packages/infrastructure-client/{account,ai,goal,...}/

# 比较文件数
find packages/infrastructure-client -name "*.ts" | wc -l
find apps/web/src/modules -path "*/infrastructure/*.ts" | wc -l
```

### 2️⃣ 更新导入 (示例)

```typescript
// account module
// 之前
import { accountApiClient } from '../../infrastructure/api/accountApiClient';
// 之后
import { accountApiClient } from '@dailyuse/infrastructure-client/account';

// authentication module
// 之前
import { LOGIN, LOGOUT } from '../application/events/authEvents';
// 之后
import { LOGIN, LOGOUT } from '@dailyuse/application-client/authentication';
```

### 3️⃣ 删除本地实现

```bash
# 删除已提取的文件
rm -f apps/web/src/modules/account/infrastructure/api/accountApiClient.ts
rm -f apps/web/src/modules/ai/infrastructure/api/ai*.ts
# ... 等等

# 删除空目录
find apps/web/src/modules -type d -empty -delete
```

### 4️⃣ 测试验证

```bash
npm run lint
npm run test
npm run dev
```

---

## 📋 按模块的具体行动

### Account 模块

```
应该保留:
  ✓ application/events/accountEventHandlers.ts (事件初始化)

应该提取:
  ❌ infrastructure/api/accountApiClient.ts → packages/infrastructure-client/account

状态:
  packages/application-client/account (22 files)
  packages/infrastructure-client/account (5 files)
```

### AI 模块

```
应该保留:
  (无，仅有 index.ts)

应该提取:
  ❌ infrastructure/api/aiProviderApiClient.ts
  ❌ infrastructure/api/aiGenerationApiClient.ts
  ❌ infrastructure/api/goalGenerationApiClient.ts
  ❌ infrastructure/api/aiConversationApiClient.ts

状态:
  packages/application-client/ai (26 files)
  packages/infrastructure-client/ai (26 files)
```

### Authentication 模块

```
应该保留:
  ✓ application/event-handlers/TokenRefreshRequestedHandler.ts

应该提取:
  ❌ application/events/authEvents.ts → packages/application-client/auth
  ❌ infrastructure/api/authApiClient.ts → packages/infrastructure-client/auth

状态:
  packages/application-client/authentication (28 files)
  packages/infrastructure-client/authentication (5 files)
```

### Goal 模块

```
应该保留:
  ✓ application/templates/GoalTemplates.ts (配置数据)
  ✓ application/composables/useWeightSnapshot.ts (Vue)
  ✓ application/composables/useAutoStatusRules.ts (Vue)

应该提取:
  ❌ application/rules/BuiltInRules.ts → packages
  ❌ application/events/goalEventHandlers.ts → packages
  ❌ infrastructure/api/goalApiClient.ts
  ❌ infrastructure/api/weightSnapshotApiClient.ts
  ❌ infrastructure/api/focusModeApiClient.ts

状态:
  packages/application-client/goal (48 files)
  packages/infrastructure-client/goal (10 files)
```

### Notification 模块

```
应该保留:
  ✓ application/initialization/NotificationInitializationManager.ts (Web特定)
  ✓ infrastructure/sse/SSEClient.ts (Web特定)
  ✓ infrastructure/browser/NotificationPermissionService.ts (Web特定)
  ✓ infrastructure/storage/NotificationConfigStorage.ts (浏览器存储)
  ✓ infrastructure/services/AudioNotificationService.ts (浏览器)
  ✓ infrastructure/services/DesktopNotificationService.ts (浏览器)

应该提取:
  ❌ application/events/notificationEvents.ts → packages
  ❌ infrastructure/api/notificationApiClient.ts → packages

状态:
  packages/application-client/notification (20 files)
  packages/infrastructure-client/notification (5 files)
```

### Reminder 模块

```
应该保留:
  (无，仅有 index.ts)

应该提取:
  ❌ infrastructure/api/reminderApiClient.ts

状态:
  packages/application-client/reminder (27 files)
  packages/infrastructure-client/reminder (5 files)
```

### Repository 模块

```
应该保留:
  (无 application 层)

应该提取:
  ❌ infrastructure/api/repositoryApiClient.ts
  ❌ infrastructure/api/ResourceApiClient.ts

状态:
  packages/application-client/repository (17 files)
  packages/infrastructure-client/repository (9 files)
```

### Schedule 模块

```
应该保留:
  (无，仅有 index.ts)

应该提取:
  ❌ infrastructure/api/scheduleApiClient.ts
  ❌ infrastructure/api/scheduleEventApiClient.ts
  ❌ infrastructure/api/scheduleTaskApi.ts

状态:
  packages/application-client/schedule (33 files)
  packages/infrastructure-client/schedule (8 files)
```

### Setting 模块

```
应该保留:
  ? application/events/SettingEventEmitter.ts (待评估)

应该提取:
  ❌ infrastructure/api/userPreferencesApi.ts
  ❌ infrastructure/api/SettingSyncApiClient.ts
  ❌ infrastructure/api/userSettingApi.ts
  ❌ infrastructure/api/userSettingApiClient.ts

状态:
  packages/application-client/setting (15 files)
  packages/infrastructure-client/setting (9 files)
```

### Task 模块

```
应该保留:
  (无，仅有 index.ts)

应该提取:
  ❌ infrastructure/api/taskApiClient.ts

状态:
  packages/application-client/task (56 files)
  packages/infrastructure-client/task (14 files)
```

---

## 🚀 快速命令

### 验证当前状态

```bash
# 统计 Web 应用中的应用层/基础设施层文件
find apps/web/src/modules -type f \( -path "*/application/*.ts" -o -path "*/infrastructure/*.ts" \) | wc -l

# 统计 packages 中的文件
find packages/application-client -type f -name "*.ts" | wc -l
find packages/infrastructure-client -type f -name "*.ts" | wc -l

# 检查 Web 应用中的导入
grep -r "from '@dailyuse/" apps/web/src/modules --include="*.ts" | wc -l

# 检查本地导入（应该最小化）
grep -r "from '.*\.\..*api" apps/web/src/modules --include="*.ts" | wc -l
```

### 检查特定模块

```bash
# Account 模块
ls -la apps/web/src/modules/account/infrastructure/api/
ls -la packages/infrastructure-client/account/

# 比较
diff -r apps/web/src/modules/account/infrastructure/api \
        packages/infrastructure-client/account 2>/dev/null || echo "不同或一个为空"
```

---

## 📊 预期改进

| 指标                             | 现在 | 完成后 |
| -------------------------------- | ---- | ------ |
| Web app 中的 Application 文件    | 21   | ~5     |
| Web app 中的 Infrastructure 文件 | 34   | ~10    |
| 代码重复                         | 中等 | 最小   |
| 跨平台代码在 packages 中         | 部分 | 100%   |
| Web 特定代码在 Web app 中        | 100% | 100%   |

---

## 📚 相关文档

- [AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md](AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md) - 详细审计报告
- [AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS_DETAILED.md](AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS_DETAILED.md) - 深度分析
- [packages/application-client](packages/application-client)
- [packages/infrastructure-client](packages/infrastructure-client)

---

**生成时间**: 2026-01-18  
**用途**: 快速参考和迁移指导
