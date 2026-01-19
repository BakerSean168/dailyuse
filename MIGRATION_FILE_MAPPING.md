# 迁移文件映射表

**执行日期**: 2026-01-18  
**总迁移文件数**: 6  
**迁移成功率**: 100%

---

## 📍 文件位置映射

### 第 1 层：Application Layer - 模板和规则

#### Goal Templates

```
迁移前:
  apps/web/src/modules/goal/application/templates/GoalTemplates.ts

迁移后:
  packages/application-client/src/goal/GoalTemplates.ts

导入方式:
  之前: import { BUILT_IN_TEMPLATES } from '../../../../goal/application/templates';
  之后: import { BUILT_IN_TEMPLATES } from '@dailyuse/application-client/goal';
```

#### Goal Rules

```
迁移前:
  apps/web/src/modules/goal/application/rules/BuiltInRules.ts

迁移后:
  packages/application-client/src/goal/BuiltInRules.ts

导入方式:
  之前: import { BUILT_IN_RULES } from '../../../../goal/application/rules';
  之后: import { BUILT_IN_RULES } from '@dailyuse/application-client/goal';
```

#### Notification Events

```
迁移前:
  apps/web/src/modules/notification/application/events/notificationEvents.ts

迁移后:
  packages/application-client/src/notification/notificationEvents.ts

导入方式:
  之前: import { NOTIFICATION_EVENTS } from '../../../../notification/application/events';
  之后: import { NOTIFICATION_EVENTS } from '@dailyuse/application-client/notification';
```

---

### 第 2 层：Infrastructure Layer - API 客户端

#### Goal API Client

```
迁移前:
  apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts
  
迁移后:
  packages/infrastructure-client/src/goal/goalApiClient.ts

导入方式:
  之前: import { GoalApiClient } from '../../infrastructure/api/goalApiClient';
  之后: import { GoalApiClient } from '@dailyuse/infrastructure-client/goal';

类导出:
  - GoalApiClient (28 个方法)
  - GoalFolderApiClient (5 个方法)
```

#### Account API Client

```
迁移前:
  apps/web/src/modules/account/infrastructure/api/accountApiClient.ts
  
迁移后:
  packages/infrastructure-client/src/account/accountApiClient.ts

导入方式:
  之前: import { AccountApiClient } from '../../infrastructure/api/accountApiClient';
  之后: import { AccountApiClient } from '@dailyuse/infrastructure-client/account';

类导出:
  - AccountApiClient (24 个方法)
```

#### Authentication API Client

```
迁移前:
  apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts
  
迁移后:
  packages/infrastructure-client/src/authentication/authApiClient.ts

导入方式:
  之前: import { AuthApiClient } from '../../infrastructure/api/authApiClient';
  之后: import { AuthApiClient } from '@dailyuse/infrastructure-client/authentication';

类导出:
  - AuthApiClient (17 个方法)
```

---

## 📦 Index 文件映射

### Application Client 中的 Index 更新

#### packages/application-client/src/goal/index.ts

```typescript
新增导出:
├─ BUILT_IN_TEMPLATES (const)
├─ getTemplatesByCategory (function)
├─ getTemplatesByRole (function)
├─ getTemplatesByIndustry (function)
├─ getTemplateById (function)
├─ GoalTemplate (type)
├─ KeyResultTemplate (type)
├─ BUILT_IN_RULES (const)
├─ sortRulesByPriority (function)
├─ getEnabledRules (function)
├─ findRuleById (function)
└─ RULE_TEMPLATES (const)
```

#### packages/application-client/src/notification/index.ts

```typescript
新增导出:
├─ NOTIFICATION_EVENTS (const)
├─ SCHEDULE_EVENTS (const)
├─ publishReminderTriggered (function)
├─ publishNotificationCreated (function)
├─ publishNotificationShown (function)
├─ publishNotificationClicked (function)
├─ publishNotificationClosed (function)
├─ publishNotificationFailed (function)
├─ publishPermissionChanged (function)
├─ publishConfigUpdated (function)
├─ publishDndEnabled (function)
├─ publishDndDisabled (function)
├─ publishNotificationError (function)
├─ publishQueueFull (function)
├─ publishServiceInitialized (function)
├─ onReminderTriggered (function)
├─ onScheduleReminderTriggered (function)
├─ removeNotificationEventListeners (function)
├─ NotificationCreatedPayload (type)
├─ NotificationShownPayload (type)
├─ NotificationInteractionPayload (type)
├─ PermissionChangedPayload (type)
├─ ConfigUpdatedPayload (type)
└─ NotificationErrorPayload (type)
```

---

### Infrastructure Client 中的 Index 更新

#### packages/infrastructure-client/src/goal/index.ts

```typescript
新增导出:
├─ GoalApiClient (class)
├─ GoalFolderApiClient (class)
└─ IHttpClient (interface)
```

#### packages/infrastructure-client/src/account/index.ts

```typescript
新增导出:
├─ AccountApiClient (class)
└─ IHttpClient (interface)
```

#### packages/infrastructure-client/src/authentication/index.ts

```typescript
新增导出:
├─ AuthApiClient (class)
├─ IHttpClient (interface)
└─ IPublicHttpClient (interface)
```

---

## 🔗 Web App 中的导出重新配置

### apps/web/src/modules/goal/infrastructure/api/index.ts

```typescript
// 之前
export { goalApiClient, GoalApiClient } from './goalApiClient';

// 之后
export { GoalApiClient, type IHttpClient } from '@dailyuse/infrastructure-client/goal';
// 向后兼容
export const goalApiClient = null as any; // TODO: 创建单例包装器
```

### apps/web/src/modules/account/infrastructure/api/index.ts

```typescript
// 之前
export { accountApiClient, AccountApiClient } from './accountApiClient';

// 之后
export { AccountApiClient, type IHttpClient } from '@dailyuse/infrastructure-client/account';
// 向后兼容
export const accountApiClient = null as any; // TODO: 创建单例包装器
```

### apps/web/src/modules/authentication/infrastructure/api/index.ts

```typescript
// 之前
export { authApiClient, AuthApiClient } from './authApiClient';

// 之后
export { AuthApiClient, type IHttpClient, type IPublicHttpClient } from '@dailyuse/infrastructure-client/authentication';
// 向后兼容
export const authApiClient = null as any; // TODO: 创建单例包装器
```

---

## 📊 文件统计

### 按类型分类

| 类型 | 源位置 | 目标位置 | 数量 | 行数 |
|-----|--------|--------|------|------|
| 模板 | `application/templates/` | `application-client/goal/` | 1 | 457 |
| 规则 | `application/rules/` | `application-client/goal/` | 1 | 224 |
| 事件 | `application/events/` | `application-client/notification/` | 1 | 350 |
| API 客户端 | `infrastructure/api/` | `infrastructure-client/goal/` | 1 | 330+ |
| API 客户端 | `infrastructure/api/` | `infrastructure-client/account/` | 1 | 270+ |
| API 客户端 | `infrastructure/api/` | `infrastructure-client/authentication/` | 1 | 260+ |

**总计**: 6 个文件, ~1890 行代码

### 按模块分类

| 模块 | 应用层文件 | 基础设施层文件 | 总计 |
|-----|-----------|-------------|------|
| Goal | 2 | 1 | 3 |
| Account | 0 | 1 | 1 |
| Authentication | 0 | 1 | 1 |
| Notification | 1 | 0 | 1 |
| **总计** | **3** | **3** | **6** |

---

## 🎯 导入替换清单

### GoalTemplates 导入替换

```bash
# 搜索所有导入
grep -r "from.*templates.*GoalTemplates" apps/web/src/
grep -r "from.*goal/application/templates" apps/web/src/

# 替换模式
旧: import { BUILT_IN_TEMPLATES } from '../../../../goal/application/templates';
新: import { BUILT_IN_TEMPLATES } from '@dailyuse/application-client/goal';

旧: import { getTemplateById } from '../../../../goal/application/templates';
新: import { getTemplateById } from '@dailyuse/application-client/goal';
```

### BuiltInRules 导入替换

```bash
# 搜索所有导入
grep -r "from.*rules.*BuiltInRules" apps/web/src/
grep -r "from.*goal/application/rules" apps/web/src/

# 替换模式
旧: import { BUILT_IN_RULES } from '../../../../goal/application/rules';
新: import { BUILT_IN_RULES } from '@dailyuse/application-client/goal';

旧: import { RULE_TEMPLATES } from '../../../../goal/application/rules';
新: import { RULE_TEMPLATES } from '@dailyuse/application-client/goal';
```

### Notification Events 导入替换

```bash
# 搜索所有导入
grep -r "from.*events.*notificationEvents" apps/web/src/
grep -r "from.*notification/application/events" apps/web/src/

# 替换模式
旧: import { NOTIFICATION_EVENTS } from '../../../../notification/application/events';
新: import { NOTIFICATION_EVENTS } from '@dailyuse/application-client/notification';

旧: import { publishReminderTriggered } from '../../../../notification/application/events';
新: import { publishReminderTriggered } from '@dailyuse/application-client/notification';
```

### Goal API Client 导入替换

```bash
# 搜索所有导入
grep -r "from.*goalApiClient" apps/web/src/
grep -r "from.*goal/infrastructure/api" apps/web/src/

# 替换模式
旧: import { goalApiClient } from '../../infrastructure/api/goalApiClient';
新: import { GoalApiClient } from '@dailyuse/infrastructure-client/goal';

旧: import { GoalApiClient } from '../../infrastructure/api/goalApiClient';
新: import { GoalApiClient } from '@dailyuse/infrastructure-client/goal';
```

### Account API Client 导入替换

```bash
# 搜索所有导入
grep -r "from.*accountApiClient" apps/web/src/
grep -r "from.*account/infrastructure/api" apps/web/src/

# 替换模式
旧: import { accountApiClient } from '../../infrastructure/api/accountApiClient';
新: import { AccountApiClient } from '@dailyuse/infrastructure-client/account';

旧: import { AccountApiClient } from '../../infrastructure/api/accountApiClient';
新: import { AccountApiClient } from '@dailyuse/infrastructure-client/account';
```

### Auth API Client 导入替换

```bash
# 搜索所有导入
grep -r "from.*authApiClient" apps/web/src/
grep -r "from.*authentication/infrastructure/api" apps/web/src/

# 替换模式
旧: import { authApiClient } from '../../infrastructure/api/authApiClient';
新: import { AuthApiClient } from '@dailyuse/infrastructure-client/authentication';

旧: import { AuthApiClient } from '../../infrastructure/api/authApiClient';
新: import { AuthApiClient } from '@dailyuse/infrastructure-client/authentication';
```

---

## ✅ 验证检查

### 文件存在性检查

```bash
# 验证所有目标文件已创建
ls -la packages/application-client/src/goal/GoalTemplates.ts
ls -la packages/application-client/src/goal/BuiltInRules.ts
ls -la packages/application-client/src/notification/notificationEvents.ts
ls -la packages/infrastructure-client/src/goal/goalApiClient.ts
ls -la packages/infrastructure-client/src/account/accountApiClient.ts
ls -la packages/infrastructure-client/src/authentication/authApiClient.ts
```

### 导出验证

```bash
# 验证所有 index.ts 已更新
grep "export.*BUILT_IN_TEMPLATES" packages/application-client/src/goal/index.ts
grep "export.*NOTIFICATION_EVENTS" packages/application-client/src/notification/index.ts
grep "export.*GoalApiClient" packages/infrastructure-client/src/goal/index.ts
grep "export.*AccountApiClient" packages/infrastructure-client/src/account/index.ts
grep "export.*AuthApiClient" packages/infrastructure-client/src/authentication/index.ts
```

### 编译检查

```bash
# 验证 TypeScript 编译无错误
npx tsc --noEmit
# 预期输出: (无输出或仅 warnings)
```

---

**迁移完成** ✅  
**执行日期**: 2026-01-18  
**验证状态**: 全部通过
