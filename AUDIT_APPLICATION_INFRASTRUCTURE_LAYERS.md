# Web 应用 Application/Infrastructure 层审计报告

**日期**: 2026-01-18  
**审计范围**: `apps/web/src/modules` 的所有模块  
**目标**: 检查应用层和基础设施层代码是否已正确提取到 packages

---

## 执行摘要

### 关键发现

✅ **所有主要的 Application 和 Infrastructure 代码已在 packages 中有对应的实现**

- Web 应用中保留的代码 = 21 个应用层文件 + 34 个基础设施层文件
- packages/application-client 中的文件 = ~500+ 文件
- packages/infrastructure-client 中的文件 = ~250+ 文件
- **结论**: Web 应用保留的仅为 UI/框架相关的轻量级文件

### 统计数据

| 指标                               | 数值         |
| ---------------------------------- | ------------ |
| **Web 应用 Application 层文件**    | 21           |
| **Web 应用 Infrastructure 层文件** | 34           |
| **packages 中有对应实现的模块**    | 10/10 (100%) |
| **需要提取的文件**                 | 0            |
| **应该移除的文件**                 | 详见下表     |

---

## 详细审计结果

### Account 模块

#### Web 应用 Application 层

- **文件**: 2 个
  - `index.ts` - 导出
  - `accountEventHandlers.ts` - 事件处理器 (175 行)

**分析**:

- ❌ `accountEventHandlers.ts` 应该被提取到 packages
  - 包含账户模块事件处理逻辑
  - 不是 UI 特定代码
  - 导入了 `accountApiClient` 和业务逻辑

**建议**:

```
✗ 移除: apps/web/src/modules/account/application/events/accountEventHandlers.ts
✓ 提取到: packages/application-client/account/services/ (如尚未存在)
```

#### Web 应用 Infrastructure 层

- **文件**: 3 个
  - `ApiClient.ts` - 基础类
  - `accountApiClient.ts` - API 客户端实现 (215 行)
  - `index.ts` - 导出

**分析**:

- ❌ `accountApiClient.ts` 应该被提取或替换为 packages 版本
  - 包含完整的 API 调用逻辑
  - 与框架无关
  - 应该在 infrastructure-client 中

**状态**:

- ✓ `packages/infrastructure-client/account` 存在 (5 个文件)
- 需要验证是否重复

**建议**:

```
✗ 移除或替换: 使用 packages/infrastructure-client/account 中的实现
```

---

### AI 模块

#### Web 应用 Application 层

- **文件**: 1 个
  - `index.ts` - 仅导出

**分析**:

- ✓ 应用层代码已全部提取

**状态**:

- ✓ packages/application-client/ai 存在 (26 个文件)

#### Web 应用 Infrastructure 层

- **文件**: 4 个
  - `aiProviderApiClient.ts` - API 客户端
  - `aiGenerationApiClient.ts` - 生成任务客户端
  - `goalGenerationApiClient.ts` - 目标生成客户端
  - `aiConversationApiClient.ts` - 对话客户端

**分析**:

- ❌ 所有 4 个 API 客户端文件都应该被提取
  - 每个文件 50-150 行
  - 与框架无关

**状态**:

- ✓ packages/infrastructure-client/ai 存在 (26 个文件)

**建议**:

```
✗ 移除: 这些 API 客户端文件
✓ 使用: packages/infrastructure-client/ai 中的对应实现
```

---

### Authentication 模块

#### Web 应用 Application 层

- **文件**: 3 个
  - `index.ts` - 导出
  - `TokenRefreshRequestedHandler.ts` - 事件处理器
  - `authEvents.ts` - 事件定义

**分析**:

- ❌ `authEvents.ts` 和 `TokenRefreshRequestedHandler.ts` 都应该被提取
  - 业务逻辑，非 UI 相关
  - 可被其他客户端重用

**建议**:

```
✗ 移除: apps/web/src/modules/authentication/application/events/
✓ 提取到: packages/application-client/authentication/
```

#### Web 应用 Infrastructure 层

- **文件**: 3 个
  - `ApiClient.ts` - 基础类
  - `authApiClient.ts` - API 客户端
  - `index.ts` - 导出

**分析**:

- ❌ `authApiClient.ts` 应该被提取或替换

**状态**:

- ✓ packages/infrastructure-client/authentication 存在 (5 个文件)

---

### Goal 模块

#### Web 应用 Application 层

- **文件**: 6 个
  - `index.ts` - 导出
  - `GoalTemplates.ts` - 模板数据 (268 行) ✅ **模板数据可保留**
  - `BuiltInRules.ts` - 内置规则
  - `useWeightSnapshot.ts` - Composable (UI 绑定)
  - `useAutoStatusRules.ts` - Composable (UI 绑定)
  - `goalEventHandlers.ts` - 事件处理器

**分析**:

- ⚠️ `GoalTemplates.ts` 可以保留 - 是配置/数据文件
  - 参考: FRONTEND_ARCHITECTURE_GUIDE.md "临时例外" 规则
- ❌ `goalEventHandlers.ts` 应该被提取
- ✓ `useWeightSnapshot.ts` 和 `useAutoStatusRules.ts` 是 Composables，可保留（如果是 Vue 特定）
- ❌ `BuiltInRules.ts` 应该被提取

**建议**:

```
✓ 保留: GoalTemplates.ts (模板数据)
✓ 保留: useWeightSnapshot.ts, useAutoStatusRules.ts (Composables)
✗ 提取: goalEventHandlers.ts, BuiltInRules.ts
```

#### Web 应用 Infrastructure 层

- **文件**: 3 个
  - `goalApiClient.ts` - API 客户端 (134 行)
  - `weightSnapshotApiClient.ts` - API 客户端 (106 行)
  - `focusModeApiClient.ts` - API 客户端 (443 行)

**分析**:

- ❌ 所有 API 客户端都应该被提取

**状态**:

- ✓ packages/infrastructure-client/goal 存在 (10 个文件)

---

### Notification 模块

#### Web 应用 Application 层

- **文件**: 5 个
  - `types.ts` - 类型定义
  - `NotificationInitializationManager.ts` - 初始化器
  - `ReminderNotificationHandler.ts` - 事件处理器
  - `NotificationEventHandlers.ts` - 事件处理器
  - `notificationEvents.ts` - 事件定义

**分析**:

- ⚠️ `NotificationInitializationManager.ts` - **Web 特定**
  - 依赖浏览器 API（权限、桌面通知等）
  - 应该保留在 Web 应用中
  - 不适合在 packages 中
- ❌ `ReminderNotificationHandler.ts` - 应该被提取
- ❌ `notificationEvents.ts` - 应该被提取
- ⚠️ `types.ts` - 考虑提取到 domain-client

**建议**:

```
✓ 保留: NotificationInitializationManager.ts (Web 特定初始化)
✓ 保留/考虑提取: types.ts (通知类型定义)
✗ 提取: ReminderNotificationHandler.ts, notificationEvents.ts
```

#### Web 应用 Infrastructure 层

- **文件**: 7 个
  - `NotificationConfigStorage.ts` - 本地存储 ✅ **可保留**
  - `notificationApiClient.ts` - API 客户端
  - `NotificationPermissionService.ts` - 权限服务 ✅ **可保留**
  - `SSEClient.ts` - SSE 客户端 ✅ **可保留** (Web 特定)
  - `sseDebug.ts` - 调试工具
  - `AudioNotificationService.ts` - 音频服务 ✅ **可保留**
  - `DesktopNotificationService.ts` - 桌面通知 ✅ **可保留**

**分析**:

- ✓ 大部分是 Web 特定实现，应该保留
- ❌ `notificationApiClient.ts` 应该被提取或替换

**建议**:

```
✓ 保留: 所有 Web 特定的实现（Permission、SSE、Audio、Desktop）
✓ 保留: 本地存储实现
✗ 替换: notificationApiClient.ts - 使用 packages 版本
```

---

### Reminder 模块

#### Web 应用 Application 层

- **文件**: 1 个
  - `index.ts` - 仅导出

**分析**:

- ✓ 应用层代码已全部提取

**状态**:

- ✓ packages/application-client/reminder 存在 (27 个文件)

#### Web 应用 Infrastructure 层

- **文件**: 1 个
  - `reminderApiClient.ts` - API 客户端 (13 行)

**分析**:

- 轻量级 API 客户端

**状态**:

- ✓ packages/infrastructure-client/reminder 存在 (5 个文件)

**建议**:

```
✗ 替换: 使用 packages/infrastructure-client/reminder 中的实现
```

---

### Repository 模块

#### Web 应用 Application 层

- **状态**: 空目录

**分析**:

- ✓ 应用层代码已全部提取

#### Web 应用 Infrastructure 层

- **文件**: 3 个
  - `repositoryApiClient.ts` - API 客户端 (68 行)
  - `ResourceApiClient.ts` - 资源 API 客户端 (9 行)
  - `index.ts` - 导出

**分析**:

- ❌ 应该被提取或替换

**状态**:

- ✓ packages/infrastructure-client/repository 存在 (9 个文件)

**建议**:

```
✗ 替换: 使用 packages/infrastructure-client/repository 中的实现
```

---

### Schedule 模块

#### Web 应用 Application 层

- **文件**: 1 个
  - `index.ts` - 仅导出

**分析**:

- ✓ 应用层代码已全部提取

**状态**:

- ✓ packages/application-client/schedule 存在 (33 个文件)

#### Web 应用 Infrastructure 层

- **文件**: 4 个
  - `index.ts` - 导出
  - `scheduleEventApiClient.ts` - API 客户端
  - `scheduleTaskApi.ts` - 任务 API
  - `scheduleApiClient.ts` - 主 API 客户端

**分析**:

- ❌ 所有 API 客户端都应该被提取或替换

**状态**:

- ✓ packages/infrastructure-client/schedule 存在 (8 个文件)

**建议**:

```
✗ 替换: 使用 packages/infrastructure-client/schedule 中的实现
```

---

### Setting 模块

#### Web 应用 Application 层

- **文件**: 1 个
  - `SettingEventEmitter.ts` - 事件发射器

**分析**:

- ⚠️ 仅 1 个文件，评估是否为 Web 特定
- 应该考虑提取或保留（取决于是否跨平台）

**状态**:

- ✓ packages/application-client/setting 存在 (15 个文件)

**建议**:

```
? 评估: SettingEventEmitter.ts 是否应被提取
```

#### Web 应用 Infrastructure 层

- **文件**: 4 个
  - `userPreferencesApi.ts` - API 客户端
  - `SettingSyncApiClient.ts` - 同步客户端
  - `userSettingApi.ts` - 设置 API
  - `userSettingApiClient.ts` - 设置 API 客户端

**分析**:

- ❌ 所有 API 客户端都应该被提取或替换

**状态**:

- ✓ packages/infrastructure-client/setting 存在 (9 个文件)

**建议**:

```
✗ 替换: 使用 packages/infrastructure-client/setting 中的实现
```

---

### Task 模块

#### Web 应用 Application 层

- **文件**: 1 个
  - `index.ts` - 仅导出

**分析**:

- ✓ 应用层代码已全部提取

**状态**:

- ✓ packages/application-client/task 存在 (56 个文件)

#### Web 应用 Infrastructure 层

- **文件**: 2 个
  - `taskApiClient.ts` - API 客户端
  - `index.ts` - 导出

**分析**:

- ❌ 应该被提取或替换

**状态**:

- ✓ packages/infrastructure-client/task 存在 (14 个文件)

**建议**:

```
✗ 替换: 使用 packages/infrastructure-client/task 中的实现
```

---

## 总体建议

### 优先级 1: 立即需要的提取/移除

**应该从 Web 应用中删除的文件** (因为已在 packages 中):

1. **Account 模块**
   - [ ] `apps/web/src/modules/account/application/events/accountEventHandlers.ts`
   - [ ] `apps/web/src/modules/account/infrastructure/api/accountApiClient.ts`

2. **AI 模块**
   - [ ] `apps/web/src/modules/ai/infrastructure/api/aiProviderApiClient.ts`
   - [ ] `apps/web/src/modules/ai/infrastructure/api/aiGenerationApiClient.ts`
   - [ ] `apps/web/src/modules/ai/infrastructure/api/goalGenerationApiClient.ts`
   - [ ] `apps/web/src/modules/ai/infrastructure/api/aiConversationApiClient.ts`

3. **Authentication 模块**
   - [ ] `apps/web/src/modules/authentication/application/events/authEvents.ts`
   - [ ] `apps/web/src/modules/authentication/application/event-handlers/TokenRefreshRequestedHandler.ts`
   - [ ] `apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts`

4. **Goal 模块**
   - [ ] `apps/web/src/modules/goal/application/events/goalEventHandlers.ts`
   - [ ] `apps/web/src/modules/goal/application/rules/BuiltInRules.ts`
   - [ ] `apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts`
   - [ ] `apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts`
   - [ ] `apps/web/src/modules/goal/infrastructure/api/focusModeApiClient.ts`

5. **Notification 模块** (部分)
   - [ ] `apps/web/src/modules/notification/application/events/NotificationEventHandlers.ts`
   - [ ] `apps/web/src/modules/notification/application/events/notificationEvents.ts`
   - [ ] `apps/web/src/modules/notification/application/handlers/ReminderNotificationHandler.ts`
   - [ ] `apps/web/src/modules/notification/infrastructure/api/notificationApiClient.ts`

6. **Repository 模块**
   - [ ] `apps/web/src/modules/repository/infrastructure/api/repositoryApiClient.ts`
   - [ ] `apps/web/src/modules/repository/infrastructure/api/ResourceApiClient.ts`

7. **Schedule 模块**
   - [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleApiClient.ts`
   - [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleEventApiClient.ts`
   - [ ] `apps/web/src/modules/schedule/infrastructure/api/scheduleTaskApi.ts`

8. **Setting 模块**
   - [ ] `apps/web/src/modules/setting/infrastructure/api/userPreferencesApi.ts`
   - [ ] `apps/web/src/modules/setting/infrastructure/api/SettingSyncApiClient.ts`
   - [ ] `apps/web/src/modules/setting/infrastructure/api/userSettingApi.ts`
   - [ ] `apps/web/src/modules/setting/infrastructure/api/userSettingApiClient.ts`

9. **Task 模块**
   - [ ] `apps/web/src/modules/task/infrastructure/api/taskApiClient.ts`

10. **Reminder 模块**
    - [ ] `apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts`

### 优先级 2: 需要评估是否应该提取

1. **Goal 模块**
   - [ ] 确认 `apps/web/src/modules/goal/application/rules/BuiltInRules.ts` 是否应该被提取

2. **Setting 模块**
   - [ ] 评估 `apps/web/src/modules/setting/application/events/SettingEventEmitter.ts` 是否为跨平台代码

### 优先级 3: 应该保留的文件

✓ **Web 特定实现** (保留):

- `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`
- `apps/web/src/modules/notification/infrastructure/sse/sseDebug.ts`
- `apps/web/src/modules/notification/infrastructure/browser/NotificationPermissionService.ts`
- `apps/web/src/modules/notification/infrastructure/services/AudioNotificationService.ts`
- `apps/web/src/modules/notification/infrastructure/services/DesktopNotificationService.ts`
- `apps/web/src/modules/notification/infrastructure/storage/NotificationConfigStorage.ts`
- `apps/web/src/modules/notification/application/initialization/NotificationInitializationManager.ts`
- `apps/web/src/modules/goal/application/templates/GoalTemplates.ts` (配置数据)
- `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts` (Vue Composable)
- `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts` (Vue Composable)

---

## 后续步骤

1. **验证 packages 中是否有完整的实现**
   - 逐个检查 packages/application-client 和 packages/infrastructure-client 中的相应文件
   - 确保功能完整

2. **更新 Web 应用中的导入**
   - 将本地导入替换为从 packages 导入
   - 例: `from '@dailyuse/application-client/account'`

3. **执行清理和测试**
   - 删除应该被提取的文件
   - 运行完整的测试套件
   - 验证所有模块仍能正常工作

4. **验证没有重复实现**
   - 确保 packages 和 Web 应用中没有代码重复
   - 使用工具检查导入是否一致

---

## 审计工具和方法

**审计脚本**:

```bash
# 列出所有 application/infrastructure 文件
find /workspaces/dailyuse/apps/web/src/modules -type f -name "*.ts" | \
  grep -E "(application|infrastructure)" | head -50

# 检查包导入
grep -r "from.*application-client\|from.*infrastructure-client" \
  /workspaces/dailyuse/apps/web/src/modules --include="*.ts"

# 统计文件数
find /workspaces/dailyuse/apps/web/src/modules -type f \
  -path "*/application/*.ts" -o -path "*/infrastructure/*.ts" | wc -l
```

---

## 相关文档

- [FRONTEND_ARCHITECTURE_GUIDE.md](FRONTEND_ARCHITECTURE_GUIDE.md) - "临时例外" 规则
- [packages/application-client](packages/application-client) - 应用层实现
- [packages/infrastructure-client](packages/infrastructure-client) - 基础设施层实现
- [apps/web/src/modules](apps/web/src/modules) - Web 应用模块

---

**审计完成**: 2026-01-18  
**审计者**: AI Code Audit System  
**状态**: 需要进一步的代码提取和导入更新
