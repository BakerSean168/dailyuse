# Web 应用导入修复 - 快速参考指南

## 🔄 导入迁移模式

### 基础设施层 API 客户端

**旧模式** (相对导入):

```typescript
import { accountApiClient } from '../../infrastructure/api/accountApiClient';
import { reminderApiClient } from '../../infrastructure/api/reminderApiClient';
```

**新模式** (packages 导入):

```typescript
import { getAccountApiClient, getReminderApiClient } from '@dailyuse/infrastructure-client';

const accountApiClient = getAccountApiClient();
const reminderApiClient = getReminderApiClient();
```

### 应用层服务

**旧模式** (相对导入):

```typescript
import { reminderGroupApplicationService } from '../../application/services';
import { repositoryManagementService } from '../../application/services/RepositoryManagementApplicationService';
```

**新模式** (packages 导入):

```typescript
import { reminderGroupApplicationService } from '@dailyuse/application-client/reminder';
import { repositoryApplicationService } from '@dailyuse/application-client/repository';

const repositoryManagementService = repositoryApplicationService;
```

---

## 📦 可用的 Getter 函数

所有可从 `@dailyuse/infrastructure-client` 导入：

```typescript
// Account 模块
getAccountApiClient(): IAccountApiClient

// Reminder 模块
getReminderApiClient(): IReminderApiClient

// AI 模块
getAIProviderConfigApiClient(): IAIProviderConfigApiClient
getAIConversationApiClient(): IAIConversationApiClient
getAIMessageApiClient(): IAIMessageApiClient

// Task 模块
getTaskTemplateApiClient(): ITaskTemplateApiClient
getTaskInstanceApiClient(): ITaskInstanceApiClient
getTaskDependencyApiClient(): ITaskDependencyApiClient

// Goal 模块
getGoalApiClient(): IGoalApiClient

// Repository 模块
getRepositoryApiClient(): IRepositoryApiClient
```

---

## 🎯 应用层服务

从以下位置导入应用服务：

### Reminder 应用服务

```typescript
import { reminderGroupApplicationService } from '@dailyuse/application-client/reminder';
```

### Repository 应用服务

```typescript
import { repositoryApplicationService } from '@dailyuse/application-client/repository';
```

### 其他模块应用服务

```typescript
import { goalApplicationService } from '@dailyuse/application-client/goal';
import { taskApplicationService } from '@dailyuse/application-client/task';
// 等等...
```

---

## ✅ 修复清单

### 已修复的文件 (16 个)

#### Account

- [ ] `apps/web/src/modules/account/application/events/accountEventHandlers.ts`

#### Reminder

- [ ] `apps/web/src/modules/reminder/presentation/views/ReminderDesktopView.vue`
- [ ] `apps/web/src/modules/reminder/presentation/components/ScheduleStatusCard.vue`
- [ ] `apps/web/src/modules/reminder/presentation/components/cards/GroupDesktopCard.vue`

#### AI

- [ ] `apps/web/src/modules/ai/presentation/components/ProviderConfigDialog.vue`
- [ ] `apps/web/src/modules/ai/presentation/components/chat/AIGoalGenerateDialog.vue`

#### Task

- [ ] `apps/web/src/modules/task/presentation/components/TaskAIGenerationDialog.vue`
- [ ] `apps/web/src/modules/task/presentation/components/dependency/DependencyManager.vue`
- [ ] `apps/web/src/modules/task/presentation/views/TaskListView.vue`
- [ ] `apps/web/src/modules/task/presentation/components/TaskTemplateManagement.vue`

#### Repository

- [ ] `apps/web/src/modules/repository/presentation/views/RepositoryPage.vue`
- [ ] `apps/web/src/modules/repository/presentation/views/RepositoryView.vue`
- [ ] `apps/web/src/modules/repository/presentation/components/FileExplorer.vue`
- [ ] `apps/web/src/modules/repository/presentation/components/dialogs/RepositoryManagementDialog.vue`
- [ ] `apps/web/src/modules/repository/presentation/components/dialogs/CreateFolderDialog.vue`
- [ ] `apps/web/src/modules/repository/presentation/components/dialogs/CreateRepositoryDialog.vue`
- [ ] `apps/web/src/modules/repository/presentation/components/dialogs/CreateResourceDialog.vue`

#### 其他

- [ ] `apps/web/src/components/AssetsDemo.vue`

---

## 🚀 何时使用新模式

**应使用包导入**:

- ✅ API 客户端 (`accountApiClient`, `reminderApiClient` 等)
- ✅ 应用服务 (`applicationService` 实例)
- ✅ Use cases (从 `@dailyuse/application-client` 导入)
- ✅ Containers (从 `@dailyuse/infrastructure-client` 导入)
- ✅ Ports/Interfaces (从 `@dailyuse/infrastructure-client` 导入)

**应保留本地导入**:

- ❌ Web 特定的应用服务 (`TaskCriticalPathService`, `ResourceUploadService` 等)
- ❌ Web 特定的 composables
- ❌ Web 特定的本地 utilities
- ❌ 组件和视图

---

## 🔧 设置要求

Web 应用启动时必须配置 DI 容器：

```typescript
// 在 main.ts 或初始化文件中
import { configureWebDependencies } from '@dailyuse/infrastructure-client';
import { httpClient } from '@/shared/api/instances';

// 初始化所有容器
configureWebDependencies(httpClient);
```

---

## 💡 最佳实践

1. **始终使用 getter 函数**

   ```typescript
   // ✅ 好
   const client = getAccountApiClient();

   // ❌ 避免
   const client = new AccountHttpAdapter(httpClient);
   ```

2. **在 script 块顶部获取实例**

   ```typescript
   <script setup>
   import { getReminderApiClient } from '@dailyuse/infrastructure-client';
   const reminderApiClient = getReminderApiClient();
   </script>
   ```

3. **对应用服务使用别名**

   ```typescript
   import { repositoryApplicationService } from '@dailyuse/application-client/repository';

   // 如果需要多个别名，使用 const
   const repositoryManagementService = repositoryApplicationService;
   const resourceManagementService = repositoryApplicationService;
   ```

---

## 🐛 常见问题排查

### 问题: 找不到模块

**解决方案**: 确保已运行 `npm run build` 来构建 packages

### 问题: 容器返回 undefined

**解决方案**: 检查是否调用了 `configureWebDependencies(httpClient)`

### 问题: 类型不匹配

**解决方案**: 使用从 `@dailyuse/infrastructure-client` 导入的接口类型

---

## 📚 相关文档

- [Web 导入修复完成清单](./WEB_IMPORTS_FIX_COMPLETION.md)
- [Web 导入修复最终报告](./WEB_IMPORTS_FIX_FINAL_REPORT.md)
- [Infrastructure Client 包文档](./packages/infrastructure-client/README.md)
- [Application Client 包文档](./packages/application-client/README.md)
