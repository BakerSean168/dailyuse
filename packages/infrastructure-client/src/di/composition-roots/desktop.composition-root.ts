/**
 * Desktop Composition Root
 *
 * 配置 Desktop 环境（Electron）的依赖注入
 * 使用 IPC 适配器与主进程通信
 */

import type { ElectronAPI } from '../../shared';
import { createIpcClient } from '../../shared';
import {
  GoalContainer,
  GoalIpcAdapter,
  GoalFolderIpcAdapter,
  GoalFocusIpcAdapter,
} from '../../goal';
import {
  TaskContainer,
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
} from '../../task';
import {
  ScheduleContainer,
  ScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
} from '../../schedule';
import { ReminderContainer, ReminderIpcAdapter } from '../../reminder';
import { AccountContainer, AccountIpcAdapter } from '../../account';
import { AuthContainer, AuthIpcAdapter } from '../../authentication';
import { NotificationContainer, NotificationIpcAdapter } from '../../notification';
import {
  AIContainer,
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIGenerationTaskIpcAdapter,
  AIUsageQuotaIpcAdapter,
  AIProviderConfigIpcAdapter,
} from '../../ai';
import { DashboardContainer, DashboardIpcAdapter } from '../../dashboard';
import { RepositoryContainer, RepositoryIpcAdapter } from '../../repository';
import { SettingContainer, SettingIpcAdapter } from '../../setting';

/**
 * 配置 Desktop 环境的依赖
 *
 * @param electronApi - Electron API（暴露给渲染进程的 API）
 */
export function configureDesktopDependencies(electronApi: ElectronAPI): void {
  // 创建 IPC 客户端包装器，自动处理 IpcResult 解包
  const ipcClient = createIpcClient();

  // Goal Module
  GoalContainer.getInstance()
    .registerApiClient(new GoalIpcAdapter(ipcClient))
    .registerFolderApiClient(new GoalFolderIpcAdapter(ipcClient))
    .registerFocusApiClient(new GoalFocusIpcAdapter(ipcClient));

  // Task Module
  TaskContainer.getInstance()
    .registerTemplateApiClient(new TaskTemplateIpcAdapter(ipcClient))
    .registerInstanceApiClient(new TaskInstanceIpcAdapter(ipcClient))
    .registerDependencyApiClient(new TaskDependencyIpcAdapter(ipcClient))
    .registerStatisticsApiClient(new TaskStatisticsIpcAdapter(ipcClient));

  // Schedule Module
  ScheduleContainer.getInstance()
    .registerTaskApiClient(new ScheduleTaskIpcAdapter(ipcClient))
    .registerEventApiClient(new ScheduleEventIpcAdapter(ipcClient));

  // Reminder Module
  ReminderContainer.getInstance()
    .registerApiClient(new ReminderIpcAdapter(ipcClient));

  // Account Module
  AccountContainer.getInstance()
    .registerApiClient(new AccountIpcAdapter(ipcClient));

  // Authentication Module
  AuthContainer.getInstance()
    .registerApiClient(new AuthIpcAdapter(ipcClient));

  // Notification Module
  NotificationContainer.getInstance()
    .registerApiClient(new NotificationIpcAdapter(ipcClient));

  // AI Module
  AIContainer.getInstance()
    .registerConversationApiClient(new AIConversationIpcAdapter(ipcClient))
    .registerMessageApiClient(new AIMessageIpcAdapter(ipcClient))
    .registerGenerationTaskApiClient(new AIGenerationTaskIpcAdapter(ipcClient))
    .registerUsageQuotaApiClient(new AIUsageQuotaIpcAdapter(ipcClient))
    .registerProviderConfigApiClient(new AIProviderConfigIpcAdapter(ipcClient));

  // Dashboard Module
  DashboardContainer.getInstance()
    .registerApiClient(new DashboardIpcAdapter(ipcClient));

  // Repository Module
  RepositoryContainer.getInstance()
    .registerApiClient(new RepositoryIpcAdapter(ipcClient));

  // Setting Module
  SettingContainer.getInstance()
    .registerApiClient(new SettingIpcAdapter(ipcClient));
}
