# API 模块提取映射表

**用途**: 快速查看每个 API 模块中的文件应该提取到 packages 中的哪个位置

---

## 快速查找表

| 源文件                                                           | 目标位置                                                    | 说明         |
| ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------ |
| `apps/api/src/modules/[module]/application/services/*.ts`        | `packages/application-server/src/[module]/services/`        | 应用服务     |
| `apps/api/src/modules/[module]/application/event-handlers/*.ts`  | `packages/application-server/src/[module]/handlers/`        | 事件处理器   |
| `apps/api/src/modules/[module]/infrastructure/repositories/*.ts` | `packages/infrastructure-server/src/[module]/repositories/` | 数据仓库     |
| `apps/api/src/modules/[module]/infrastructure/di/*.ts`           | `packages/infrastructure-server/src/[module]/di/`           | DI 容器      |
| `apps/api/src/modules/[module]/infrastructure/adapters/*.ts`     | `packages/infrastructure-server/src/[module]/adapters/`     | 外部适配器   |
| `apps/api/src/modules/[module]/infrastructure/services/*.ts`     | `packages/infrastructure-server/src/[module]/services/`     | 基础设施服务 |
| `apps/api/src/modules/[module]/domain/repositories/*.ts`         | `packages/domain-server/src/[module]/repositories/`         | 仓库接口     |
| `apps/api/src/modules/[module]/domain/events/*.ts`               | `packages/domain-server/src/[module]/events/`               | 域事件       |

---

## 模块详细映射

### 1. Account 模块

**源目录**: `apps/api/src/modules/account/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                    | 目标文件                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `application/services/AccountApplicationService.ts`       | `packages/application-server/src/account/services/account-application.service.ts`        |
| `application/services/AccountStatusApplicationService.ts` | `packages/application-server/src/account/services/account-status-application.service.ts` |
| `application/services/RegistrationApplicationService.ts`  | `packages/application-server/src/account/services/registration-application.service.ts`   |

#### 基础设施层

| 源文件                                                   | 目标文件                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaAccountRepository.ts` | `packages/infrastructure-server/src/account/repositories/prisma-account.repository.ts` |
| `infrastructure/di/AccountContainer.ts`                  | `packages/infrastructure-server/src/account/di/account-container.ts`                   |

#### API 保留

| 文件                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| `interface/http/AccountController.ts`        | 更新为 routes.ts，仅保留 HTTP 路由逻辑 |
| `interface/http/AccountProfileController.ts` | 更新为 routes.ts                       |
| ... (其他 Controller)                        | 并入 routes.ts                         |

---

### 2. Authentication 模块

**源目录**: `apps/api/src/modules/authentication/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                         | 目标文件                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `application/services/AuthenticationApplicationService.ts`     | `packages/application-server/src/authentication/services/authentication-application.service.ts`      |
| `application/services/ApiKeyApplicationService.ts`             | `packages/application-server/src/authentication/services/api-key-application.service.ts`             |
| `application/services/PasswordManagementApplicationService.ts` | `packages/application-server/src/authentication/services/password-management-application.service.ts` |
| `application/services/SessionManagementApplicationService.ts`  | `packages/application-server/src/authentication/services/session-management-application.service.ts`  |
| `application/services/TwoFactorApplicationService.ts`          | `packages/application-server/src/authentication/services/two-factor-application.service.ts`          |
| `application/services/RememberMeApplicationService.ts`         | `packages/application-server/src/authentication/services/remember-me-application.service.ts`         |
| `application/event-handlers/AccountCreatedHandler.ts`          | `packages/application-server/src/authentication/handlers/account-created.handler.ts`                 |

#### 基础设施层

| 源文件                                                          | 目标文件                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaAuthCredentialRepository.ts` | `packages/infrastructure-server/src/authentication/repositories/prisma-auth-credential.repository.ts` |
| `infrastructure/repositories/PrismaAuthSessionRepository.ts`    | `packages/infrastructure-server/src/authentication/repositories/prisma-auth-session.repository.ts`    |
| `infrastructure/di/AuthenticationContainer.ts`                  | `packages/infrastructure-server/src/authentication/di/authentication-container.ts`                    |

#### API 保留

| 文件                                             | 说明                            |
| ------------------------------------------------ | ------------------------------- |
| `interface/http/AuthenticationController.ts`     | 更新为 routes.ts                |
| `interface/http/ApiKeyController.ts`             | 并入 routes.ts                  |
| `initialization/authenticationInitialization.ts` | **保留** - 初始化策略（如需要） |

---

### 3. AI 模块（最复杂）

**源目录**: `apps/api/src/modules/ai/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                     | 目标文件                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `application/services/AIConversationService.ts`            | `packages/application-server/src/ai/services/ai-conversation-application.service.ts`       |
| `application/services/AIGenerationApplicationService.ts`   | `packages/application-server/src/ai/services/ai-generation-application.service.ts`         |
| `application/services/AIProviderConfigService.ts`          | `packages/application-server/src/ai/services/ai-provider-config-application.service.ts`    |
| `application/services/AIProviderSwitchingService.ts`       | `packages/application-server/src/ai/services/ai-provider-switching-application.service.ts` |
| `application/services/GoalGenerationApplicationService.ts` | `packages/application-server/src/ai/services/goal-generation-application.service.ts`       |

#### 基础设施层 - Adapters

| 源文件                                                     | 目标文件                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `infrastructure/adapters/BaseAIAdapter.ts`                 | `packages/infrastructure-server/src/ai/adapters/base-ai.adapter.ts`                  |
| `infrastructure/adapters/OpenAIAdapter.ts`                 | `packages/infrastructure-server/src/ai/adapters/openai.adapter.ts`                   |
| `infrastructure/adapters/DeepSeekAdapter.ts`               | `packages/infrastructure-server/src/ai/adapters/deepseek.adapter.ts`                 |
| `infrastructure/adapters/GroqAdapter.ts`                   | `packages/infrastructure-server/src/ai/adapters/groq.adapter.ts`                     |
| `infrastructure/adapters/SiliconFlowAdapter.ts`            | `packages/infrastructure-server/src/ai/adapters/silicon-flow.adapter.ts`             |
| `infrastructure/adapters/OpenRouterAdapter.ts`             | `packages/infrastructure-server/src/ai/adapters/open-router.adapter.ts`              |
| `infrastructure/adapters/CustomOpenAICompatibleAdapter.ts` | `packages/infrastructure-server/src/ai/adapters/custom-openai-compatible.adapter.ts` |
| `infrastructure/adapters/AIAdapterFactory.ts`              | `packages/infrastructure-server/src/ai/adapters/ai-adapter.factory.ts`               |

#### 基础设施层 - Repositories

| 源文件                                                             | 目标文件                                                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaAIConversationRepository.ts`    | `packages/infrastructure-server/src/ai/repositories/prisma-ai-conversation.repository.ts`    |
| `infrastructure/repositories/PrismaAIGenerationTaskRepository.ts`  | `packages/infrastructure-server/src/ai/repositories/prisma-ai-generation-task.repository.ts` |
| `infrastructure/repositories/PrismaAIProviderConfigRepository.ts`  | `packages/infrastructure-server/src/ai/repositories/prisma-ai-provider-config.repository.ts` |
| `infrastructure/repositories/PrismaAIUsageQuotaRepository.ts`      | `packages/infrastructure-server/src/ai/repositories/prisma-ai-usage-quota.repository.ts`     |
| `infrastructure/repositories/KnowledgeGenerationTaskRepository.ts` | `packages/infrastructure-server/src/ai/repositories/knowledge-generation-task.repository.ts` |

#### 基础设施层 - 其他

| 源文件                                               | 目标文件                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `infrastructure/di/AIContainer.ts`                   | `packages/infrastructure-server/src/ai/di/ai-container.ts`                    |
| `infrastructure/errors/AIErrors.ts`                  | `packages/domain-server/src/ai/errors/ai.errors.ts`                           |
| `infrastructure/prompts/templates.ts`                | `packages/infrastructure-server/src/ai/prompts/templates.ts`                  |
| `infrastructure/services/QuotaEnforcementService.ts` | `packages/infrastructure-server/src/ai/services/quota-enforcement.service.ts` |

---

### 4. Goal 模块

**源目录**: `apps/api/src/modules/goal/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层 - Services

| 源文件                                                     | 目标文件                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `application/services/GoalApplicationService.ts`           | `packages/application-server/src/goal/services/goal-application.service.ts`            |
| `application/services/GoalFolderApplicationService.ts`     | `packages/application-server/src/goal/services/goal-folder-application.service.ts`     |
| `application/services/GoalStatisticsApplicationService.ts` | `packages/application-server/src/goal/services/goal-statistics-application.service.ts` |
| `application/services/GoalReviewApplicationService.ts`     | `packages/application-server/src/goal/services/goal-review-application.service.ts`     |
| `application/services/GoalKeyResultApplicationService.ts`  | `packages/application-server/src/goal/services/goal-key-result-application.service.ts` |
| `application/services/GoalRecordApplicationService.ts`     | `packages/application-server/src/goal/services/goal-record-application.service.ts`     |
| `application/services/FocusSessionApplicationService.ts`   | `packages/application-server/src/goal/services/focus-session-application.service.ts`   |
| `application/services/FocusModeApplicationService.ts`      | `packages/application-server/src/goal/services/focus-mode-application.service.ts`      |
| `application/services/GoalCrossModuleQueryService.ts`      | `packages/application-server/src/goal/services/goal-cross-module-query.service.ts`     |
| `application/services/GoalEventPublisher.ts`               | `packages/application-server/src/goal/services/goal-event-publisher.ts`                |

#### 应用层 - Event Handlers

| 源文件                                                | 目标文件                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `application/event-handlers/GoalTaskEventHandlers.ts` | `packages/application-server/src/goal/handlers/goal-task-event.handler.ts` |

#### 基础设施层

| 源文件                                                          | 目标文件                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaGoalRepository.ts`           | `packages/infrastructure-server/src/goal/repositories/prisma-goal.repository.ts`            |
| `infrastructure/repositories/PrismaGoalFolderRepository.ts`     | `packages/infrastructure-server/src/goal/repositories/prisma-goal-folder.repository.ts`     |
| `infrastructure/repositories/PrismaGoalStatisticsRepository.ts` | `packages/infrastructure-server/src/goal/repositories/prisma-goal-statistics.repository.ts` |
| `infrastructure/repositories/PrismaFocusSessionRepository.ts`   | `packages/infrastructure-server/src/goal/repositories/prisma-focus-session.repository.ts`   |
| `infrastructure/repositories/PrismaFocusModeRepository.ts`      | `packages/infrastructure-server/src/goal/repositories/prisma-focus-mode.repository.ts`      |
| `infrastructure/di/GoalContainer.ts`                            | `packages/infrastructure-server/src/goal/di/goal-container.ts`                              |
| `infrastructure/mappers/*.ts`                                   | `packages/infrastructure-server/src/goal/mappers/`                                          |
| `infrastructure/cron/*.ts`                                      | `packages/infrastructure-server/src/goal/cron/`                                             |

#### API 保留

| 文件                                       | 说明                  |
| ------------------------------------------ | --------------------- |
| `interface/http/GoalController.ts`         | 更新为 routes.ts      |
| `interface/http/FocusSessionController.ts` | 并入 routes.ts        |
| `initialization/goalInitialization.ts`     | **保留** - 初始化逻辑 |

---

### 5. Task 模块

**源目录**: `apps/api/src/modules/task/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                     | 目标文件                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `application/services/TaskApplicationService.ts`           | `packages/application-server/src/task/services/task-application.service.ts`            |
| `application/services/TaskStatisticsApplicationService.ts` | `packages/application-server/src/task/services/task-statistics-application.service.ts` |
| `application/services/TaskQueryApplicationService.ts`      | `packages/application-server/src/task/services/task-query-application.service.ts`      |
| `application/services/TaskDependencyApplicationService.ts` | `packages/application-server/src/task/services/task-dependency-application.service.ts` |

#### 基础设施层

| 源文件                                                          | 目标文件                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaTaskRepository.ts`           | `packages/infrastructure-server/src/task/repositories/prisma-task.repository.ts`            |
| `infrastructure/repositories/PrismaTaskStatisticsRepository.ts` | `packages/infrastructure-server/src/task/repositories/prisma-task-statistics.repository.ts` |
| `infrastructure/di/TaskContainer.ts`                            | `packages/infrastructure-server/src/task/di/task-container.ts`                              |

---

### 6. Reminder 模块

**源目录**: `apps/api/src/modules/reminder/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                         | 目标文件                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `application/services/ReminderApplicationService.ts`           | `packages/application-server/src/reminder/services/reminder-application.service.ts`            |
| `application/services/ReminderQueryApplicationService.ts`      | `packages/application-server/src/reminder/services/reminder-query-application.service.ts`      |
| `application/services/ReminderStatisticsApplicationService.ts` | `packages/application-server/src/reminder/services/reminder-statistics-application.service.ts` |
| `application/services/FrequencyAdjustmentService.ts`           | `packages/application-server/src/reminder/services/frequency-adjustment.service.ts`            |
| `application/services/SmartFrequencyAnalysisService.ts`        | `packages/application-server/src/reminder/services/smart-frequency-analysis.service.ts`        |
| `application/services/ReminderResponseService.ts`              | `packages/application-server/src/reminder/services/reminder-response.service.ts`               |
| `application/event-handlers/ReminderEventHandler.ts`           | `packages/application-server/src/reminder/handlers/reminder-event.handler.ts`                  |

#### 基础设施层

| 源文件                                                              | 目标文件                                                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaReminderRepository.ts`           | `packages/infrastructure-server/src/reminder/repositories/prisma-reminder.repository.ts`            |
| `infrastructure/repositories/PrismaReminderTemplateRepository.ts`   | `packages/infrastructure-server/src/reminder/repositories/prisma-reminder-template.repository.ts`   |
| `infrastructure/repositories/PrismaReminderStatisticsRepository.ts` | `packages/infrastructure-server/src/reminder/repositories/prisma-reminder-statistics.repository.ts` |
| `infrastructure/repositories/PrismaReminderGroupRepository.ts`      | `packages/infrastructure-server/src/reminder/repositories/prisma-reminder-group.repository.ts`      |
| `infrastructure/cron/reminderTriggerCronJob.ts`                     | `packages/infrastructure-server/src/reminder/cron/reminder-trigger-cron.job.ts`                     |
| `infrastructure/cron/dailyAnalysisCronJob.ts`                       | `packages/infrastructure-server/src/reminder/cron/daily-analysis-cron.job.ts`                       |
| `infrastructure/di/ReminderContainer.ts`                            | `packages/infrastructure-server/src/reminder/di/reminder-container.ts`                              |

#### Domain 层

| 源文件                     | 目标文件                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `errors/ReminderErrors.ts` | `packages/domain-server/src/reminder/errors/reminder.errors.ts` |

---

### 7. Schedule 模块

**源目录**: `apps/api/src/modules/schedule/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                         | 目标文件                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `application/services/ScheduleApplicationService.ts`           | `packages/application-server/src/schedule/services/schedule-application.service.ts`            |
| `application/services/ScheduleEventApplicationService.ts`      | `packages/application-server/src/schedule/services/schedule-event-application.service.ts`      |
| `application/services/ScheduleStatisticsApplicationService.ts` | `packages/application-server/src/schedule/services/schedule-statistics-application.service.ts` |
| `application/services/ScheduleBootstrap.ts`                    | `packages/application-server/src/schedule/services/schedule-bootstrap.ts`                      |
| ... (其他 services)                                            | `packages/application-server/src/schedule/services/`                                           |

#### 基础设施层

| 源文件                                   | 目标文件                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `infrastructure/di/ScheduleContainer.ts` | `packages/infrastructure-server/src/schedule/di/schedule-container.ts` |
| `infrastructure/repositories/*.ts`       | `packages/infrastructure-server/src/schedule/repositories/`            |

---

### 8. Dashboard 模块

**源目录**: `apps/api/src/modules/dashboard/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                          | 目标文件                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `application/services/DashboardConfigApplicationService.ts`     | `packages/application-server/src/dashboard/services/dashboard-config-application.service.ts`     |
| `application/services/DashboardStatisticsApplicationService.ts` | `packages/application-server/src/dashboard/services/dashboard-statistics-application.service.ts` |
| `application/services/DashboardEventListener.ts`                | `packages/application-server/src/dashboard/handlers/dashboard-event.listener.ts`                 |

#### 基础设施层

| 源文件                                                           | 目标文件                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/DashboardConfigPrismaRepository.ts` | `packages/infrastructure-server/src/dashboard/repositories/prisma-dashboard-config.repository.ts` |
| `infrastructure/services/StatisticsCacheService.ts`              | `packages/infrastructure-server/src/dashboard/services/statistics-cache.service.ts`               |
| `infrastructure/di/DashboardContainer.ts`                        | `packages/infrastructure-server/src/dashboard/di/dashboard-container.ts`                          |

---

### 9. Notification 模块

**源目录**: `apps/api/src/modules/notification/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                       | 目标文件                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `application/services/NotificationApplicationService.ts`     | `packages/application-server/src/notification/services/notification-application.service.ts` |
| `application/event-handlers/ScheduleTaskTriggeredHandler.ts` | `packages/application-server/src/notification/handlers/schedule-task-triggered.handler.ts`  |

#### 基础设施层

| 源文件                                                                  | 目标文件                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaNotificationRepository.ts`           | `packages/infrastructure-server/src/notification/repositories/prisma-notification.repository.ts`            |
| `infrastructure/repositories/PrismaNotificationTemplateRepository.ts`   | `packages/infrastructure-server/src/notification/repositories/prisma-notification-template.repository.ts`   |
| `infrastructure/repositories/PrismaNotificationPreferenceRepository.ts` | `packages/infrastructure-server/src/notification/repositories/prisma-notification-preference.repository.ts` |
| `infrastructure/di/NotificationContainer.ts`                            | `packages/infrastructure-server/src/notification/di/notification-container.ts`                              |

---

### 10. Repository 模块

**源目录**: `apps/api/src/modules/repository/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                           | 目标文件                                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `application/services/RepositoryApplicationService.ts`           | `packages/application-server/src/repository/services/repository-application.service.ts`            |
| `application/services/FolderApplicationService.ts`               | `packages/application-server/src/repository/services/folder-application.service.ts`                |
| `application/services/ResourceApplicationService.ts`             | `packages/application-server/src/repository/services/resource-application.service.ts`              |
| `application/services/SearchApplicationService.ts`               | `packages/application-server/src/repository/services/search-application.service.ts`                |
| `application/services/TagsApplicationService.ts`                 | `packages/application-server/src/repository/services/tags-application.service.ts`                  |
| `application/services/RepositoryStatisticsApplicationService.ts` | `packages/application-server/src/repository/services/repository-statistics-application.service.ts` |

#### 基础设施层

| 源文件                                                      | 目标文件                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaRepositoryRepository.ts` | `packages/infrastructure-server/src/repository/repositories/prisma-repository.repository.ts` |
| `infrastructure/repositories/PrismaFolderRepository.ts`     | `packages/infrastructure-server/src/repository/repositories/prisma-folder.repository.ts`     |
| `infrastructure/repositories/PrismaResourceRepository.ts`   | `packages/infrastructure-server/src/repository/repositories/prisma-resource.repository.ts`   |
| `infrastructure/di/RepositoryContainer.ts`                  | `packages/infrastructure-server/src/repository/di/repository-container.ts`                   |

---

### 11. Setting 模块

**源目录**: `apps/api/src/modules/setting/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                              | 目标文件                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `application/services/SettingApplicationService.ts` | `packages/application-server/src/setting/services/setting-application.service.ts` |
| `application/services/SettingCloudSyncService.ts`   | `packages/application-server/src/setting/services/setting-cloud-sync.service.ts`  |

#### 基础设施层

| 源文件                                                       | 目标文件                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaUserSettingRepository.ts` | `packages/infrastructure-server/src/setting/repositories/prisma-user-setting.repository.ts` |
| `infrastructure/di/SettingContainer.ts`                      | `packages/infrastructure-server/src/setting/di/setting-container.ts`                        |

---

### 12. Editor 模块（如果存在）

**源目录**: `apps/api/src/modules/editor/`
**目标 Package**: `@dailyuse/application-server`, `@dailyuse/infrastructure-server`

#### 应用层

| 源文件                                                      | 目标文件                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `application/services/EditorSessionApplicationService.ts`   | `packages/application-server/src/editor/services/editor-session-application.service.ts`   |
| `application/services/EditorWorkspaceApplicationService.ts` | `packages/application-server/src/editor/services/editor-workspace-application.service.ts` |

#### 基础设施层

| 源文件                                                           | 目标文件                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/PrismaEditorWorkspaceRepository.ts` | `packages/infrastructure-server/src/editor/repositories/prisma-editor-workspace.repository.ts` |
| `infrastructure/di/EditorContainer.ts`                           | `packages/infrastructure-server/src/editor/di/editor-container.ts`                             |

---

## 验证脚本

在执行提取前/后运行以下脚本：

```bash
#!/bin/bash

echo "=== API 模块提取验证 ==="

# 检查源文件是否存在
echo "✓ 检查源文件..."
for module in account authentication ai goal task reminder schedule dashboard notification repository setting editor; do
  if [ -d "apps/api/src/modules/$module/application" ]; then
    echo "  📂 $module/application 存在"
  fi
  if [ -d "apps/api/src/modules/$module/infrastructure" ]; then
    echo "  📂 $module/infrastructure 存在"
  fi
done

# 列出所有应用层文件
echo ""
echo "✓ 应用层文件列表..."
find apps/api/src/modules -path "*/application/services/*.ts" -type f | sort

# 列出所有基础设施层文件
echo ""
echo "✓ 基础设施层文件列表..."
find apps/api/src/modules -path "*/infrastructure/repositories/*.ts" -type f | sort
```

---

**创建日期**: 2026-01-19  
**版本**: 1.0  
**更新频率**: 执行提取时实时更新
