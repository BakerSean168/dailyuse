/**
 * Desktop Provider - SQLite Database Provider for Desktop Applications
 * 桌面应用的 SQLite 数据库提供者
 *
 * 负责统一注册所有 44 个 SQLite 仓储到 RepositoryContainer
 */

import type Database from 'better-sqlite3';
import { RepositoryContainer } from '../../../infrastructure-server/src/repository';
import type { IProviderInitializer } from '../../../infrastructure-server/src/repository';

// Repository Module
import { SqliteRepositoryRepository } from '../repositories/sqlite-repository.repository';
import { SqliteResourceRepository } from '../repositories/sqlite-resource.repository';
import { SqliteFolderRepository } from '../repositories/sqlite-folder.repository';
import { SqliteRepositoryStatisticsRepository } from '../repositories/sqlite-repository-statistics.repository';

// Task Module
import { SqliteTaskInstanceRepository } from '../../task/repositories/sqlite-task-instance.repository';
import { SqliteTaskTemplateRepository } from '../../task/repositories/sqlite-task-template.repository';
import { SqliteTaskDependencyRepository } from '../../task/repositories/sqlite-task-dependency.repository';
import { SqliteTaskStatisticsRepository } from '../../task/repositories/sqlite-task-statistics.repository';

// Goal Module
import { SqliteGoalRepository } from '../../goal/repositories/sqlite-goal.repository';
import { SqliteGoalStatisticsRepository } from '../../goal/repositories/sqlite-goal-statistics.repository';
import { SqliteGoalFolderRepository } from '../../goal/repositories/sqlite-goal-folder.repository';
import { SqliteFocusSessionRepository } from '../../goal/repositories/sqlite-focus-session.repository';
import { SqliteFocusModeRepository } from '../../goal/repositories/sqlite-focus-mode.repository';
import { SqliteWeightSnapshotRepository } from '../../goal/repositories/sqlite-weight-snapshot.repository';

// Schedule Module
import { SqliteScheduleRepository } from '../../schedule/repositories/sqlite-schedule.repository';
import { SqliteScheduleTaskRepository } from '../../schedule/repositories/sqlite-schedule-task.repository';
import { SqliteScheduleExecutionRepository } from '../../schedule/repositories/sqlite-schedule-execution.repository';
import { SqliteScheduleStatisticsRepository } from '../../schedule/repositories/sqlite-schedule-statistics.repository';

// Reminder Module
import { SqliteReminderRepository } from '../../reminder/repositories/sqlite-reminder.repository';
import { SqliteReminderResponseRepository } from '../../reminder/repositories/sqlite-reminder-response.repository';
import { SqliteReminderStatisticsRepository } from '../../reminder/repositories/sqlite-reminder-statistics.repository';
import { SqliteReminderGroupRepository } from '../../reminder/repositories/sqlite-reminder-group.repository';
import { SqliteReminderTemplateRepository } from '../../reminder/repositories/sqlite-reminder-template.repository';

// Notification Module
import { SqliteNotificationRepository } from '../../notification/repositories/sqlite-notification.repository';
import { SqliteNotificationTemplateRepository } from '../../notification/repositories/sqlite-notification-template.repository';
import { SqliteNotificationPreferenceRepository } from '../../notification/repositories/sqlite-notification-preference.repository';

// Editor Module
import { SqliteEditorSessionRepository } from '../../editor/repositories/sqlite-editor-session.repository';
import { SqliteLinkedResourceRepository } from '../../editor/repositories/sqlite-linked-resource.repository';
import { SqliteSearchEngineRepository } from '../../editor/repositories/sqlite-search-engine.repository';
import { SqliteEditorWorkspaceRepository } from '../../editor/repositories/sqlite-editor-workspace.repository';
import { SqliteEditorTabRepository } from '../../editor/repositories/sqlite-editor-tab.repository';
import { SqliteEditorGroupRepository } from '../../editor/repositories/sqlite-editor-group.repository';
import { SqliteDocumentVersionRepository } from '../../editor/repositories/sqlite-document-version.repository';
import { SqliteDocumentRepository } from '../../editor/repositories/sqlite-document.repository';

// Authentication Module
import { SqliteAuthSessionRepository } from '../../authentication/repositories/sqlite-auth-session.repository';
import { SqliteAuthCredentialRepository } from '../../authentication/repositories/sqlite-auth-credential.repository';

// Dashboard Module
import { SqliteDashboardConfigRepository } from '../../dashboard/repositories/sqlite-dashboard-config.repository';

// AI Module
import { SqliteAIGenerationTaskRepository } from '../../ai/repositories/sqlite-ai-generation-task.repository';
import { SqliteKnowledgeGenerationTaskRepository } from '../../ai/repositories/sqlite-knowledge-generation-task.repository';
import { SqliteAIConversationRepository } from '../../ai/repositories/sqlite-ai-conversation.repository';
import { SqliteAIUsageQuotaRepository } from '../../ai/repositories/sqlite-ai-usage-quota.repository';
import { SqliteAIProviderConfigRepository } from '../../ai/repositories/sqlite-ai-provider-config.repository';

// Account Module
import { SqliteAccountRepository } from '../../account/repositories/sqlite-account.repository';

// Sync Module
import { SqliteSyncConflictRepository } from '../../sync/repositories/sqlite-sync-conflict.repository';
import { SqliteSyncSessionRepository } from '../../sync/repositories/sqlite-sync-session.repository';
import { SqliteSyncProfileRepository } from '../../sync/repositories/sqlite-sync-profile.repository';
import { SqlitePendingChangeRepository } from '../../sync/repositories/sqlite-pending-change.repository';

// Setting Module
import { SqliteAppConfigRepository } from '../../setting/repositories/sqlite-app-config.repository';
import { SqliteSettingRepository } from '../../setting/repositories/sqlite-setting.repository';
import { SqliteUserSettingRepository } from '../../setting/repositories/sqlite-user-setting.repository';

/**
 * Desktop Provider Initializer
 * 注册所有 44 个 SQLite 仓储到容器
 */
export class DesktopProviderInitializer implements IProviderInitializer {
  constructor(private db: Database.Database) {}

  /**
   * 初始化 - 注册所有仓储
   */
  async initialize(): Promise<void> {
    const container = (RepositoryContainer as any);

    // Repository Module (4)
    container.registerRepositoryRepository(
      new SqliteRepositoryRepository(this.db)
    );
    container.registerResourceRepository(
      new SqliteResourceRepository(this.db)
    );
    container.registerFolderRepository(
      new SqliteFolderRepository(this.db)
    );
    container.registerRepositoryStatisticsRepository(
      new SqliteRepositoryStatisticsRepository(this.db)
    );

    // Task Module (4)
    container.registerTaskInstanceRepository(
      new SqliteTaskInstanceRepository(this.db)
    );
    container.registerTaskTemplateRepository(
      new SqliteTaskTemplateRepository(this.db)
    );
    container.registerTaskDependencyRepository(
      new SqliteTaskDependencyRepository(this.db)
    );
    container.registerTaskStatisticsRepository(
      new SqliteTaskStatisticsRepository(this.db)
    );

    // Goal Module (6)
    container.registerGoalRepository(
      new SqliteGoalRepository(this.db)
    );
    container.registerGoalStatisticsRepository(
      new SqliteGoalStatisticsRepository(this.db)
    );
    container.registerGoalFolderRepository(
      new SqliteGoalFolderRepository(this.db)
    );
    container.registerFocusSessionRepository(
      new SqliteFocusSessionRepository(this.db)
    );
    container.registerFocusModeRepository(
      new SqliteFocusModeRepository(this.db)
    );
    container.registerWeightSnapshotRepository(
      new SqliteWeightSnapshotRepository(this.db)
    );

    // Schedule Module (4)
    container.registerScheduleRepository(
      new SqliteScheduleRepository(this.db)
    );
    container.registerScheduleTaskRepository(
      new SqliteScheduleTaskRepository(this.db)
    );
    container.registerScheduleExecutionRepository(
      new SqliteScheduleExecutionRepository(this.db)
    );
    container.registerScheduleStatisticsRepository(
      new SqliteScheduleStatisticsRepository(this.db)
    );

    // Reminder Module (5)
    container.registerReminderRepository(
      new SqliteReminderRepository(this.db)
    );
    container.registerReminderResponseRepository(
      new SqliteReminderResponseRepository(this.db)
    );
    container.registerReminderStatisticsRepository(
      new SqliteReminderStatisticsRepository(this.db)
    );
    container.registerReminderGroupRepository(
      new SqliteReminderGroupRepository(this.db)
    );
    container.registerReminderTemplateRepository(
      new SqliteReminderTemplateRepository(this.db)
    );

    // Notification Module (3)
    container.registerNotificationRepository(
      new SqliteNotificationRepository(this.db)
    );
    container.registerNotificationTemplateRepository(
      new SqliteNotificationTemplateRepository(this.db)
    );
    container.registerNotificationPreferenceRepository(
      new SqliteNotificationPreferenceRepository(this.db)
    );

    // Editor Module (8)
    container.registerEditorSessionRepository(
      new SqliteEditorSessionRepository(this.db)
    );
    container.registerLinkedResourceRepository(
      new SqliteLinkedResourceRepository(this.db)
    );
    container.registerSearchEngineRepository(
      new SqliteSearchEngineRepository(this.db)
    );
    container.registerEditorWorkspaceRepository(
      new SqliteEditorWorkspaceRepository(this.db)
    );
    container.registerEditorTabRepository(
      new SqliteEditorTabRepository(this.db)
    );
    container.registerEditorGroupRepository(
      new SqliteEditorGroupRepository(this.db)
    );
    container.registerDocumentVersionRepository(
      new SqliteDocumentVersionRepository(this.db)
    );
    container.registerDocumentRepository(
      new SqliteDocumentRepository(this.db)
    );

    // Authentication Module (2)
    container.registerAuthSessionRepository(
      new SqliteAuthSessionRepository(this.db)
    );
    container.registerAuthCredentialRepository(
      new SqliteAuthCredentialRepository(this.db)
    );

    // Dashboard Module (1)
    container.registerDashboardConfigRepository(
      new SqliteDashboardConfigRepository(this.db)
    );

    // AI Module (5)
    container.registerAIGenerationTaskRepository(
      new SqliteAIGenerationTaskRepository(this.db)
    );
    container.registerKnowledgeGenerationTaskRepository(
      new SqliteKnowledgeGenerationTaskRepository(this.db)
    );
    container.registerAIConversationRepository(
      new SqliteAIConversationRepository(this.db)
    );
    container.registerAIUsageQuotaRepository(
      new SqliteAIUsageQuotaRepository(this.db)
    );
    container.registerAIProviderConfigRepository(
      new SqliteAIProviderConfigRepository(this.db)
    );

    // Account Module (1)
    container.registerAccountRepository(
      new SqliteAccountRepository(this.db)
    );

    // Sync Module (4)
    container.registerSyncConflictRepository(
      new SqliteSyncConflictRepository(this.db)
    );
    container.registerSyncSessionRepository(
      new SqliteSyncSessionRepository(this.db)
    );
    container.registerSyncProfileRepository(
      new SqliteSyncProfileRepository(this.db)
    );
    container.registerPendingChangeRepository(
      new SqlitePendingChangeRepository(this.db)
    );

    // Setting Module (3)
    container.registerAppConfigRepository(
      new SqliteAppConfigRepository(this.db)
    );
    container.registerSettingRepository(
      new SqliteSettingRepository(this.db)
    );
    container.registerUserSettingRepository(
      new SqliteUserSettingRepository(this.db)
    );
  }

  /**
   * Cleanup - 关闭数据库连接
   */
  async cleanup(): Promise<void> {
    this.db.close();
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = this.db.prepare('SELECT 1').get();
      return !!result;
    } catch {
      return false;
    }
  }
}

/**
 * Convenience function to initialize all Desktop repositories
 * 方便函数：一行代码初始化所有 Desktop 仓储
 */
export async function initializeDesktopProviderRepositories(
  db: Database.Database
): Promise<void> {
  const provider = new DesktopProviderInitializer(db);
  await provider.initialize();
}
