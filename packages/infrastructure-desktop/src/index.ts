/**
 * @dailyuse/infrastructure-desktop
 *
 * Desktop Infrastructure Layer - SQLite Repositories for Electron/Desktop Applications
 *
 * This package provides SQLite-based implementations of all repository interfaces
 * defined in @dailyuse/domain-server, specifically designed for desktop applications.
 *
 * Features:
 * - SQLite3 database support via better-sqlite3
 * - Synchronous I/O (suitable for desktop apps)
 * - Full data persistence for offline-first desktop apps
 * - Compatible with all domain interfaces
 * - Automatic database initialization and migrations
 * - Support for all 12 modules with 44 total repositories
 */

// ===== Repository Module Repositories =====
export {
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  SqliteRepositoryStatisticsRepository,
} from './repository';

// ===== Task Module Repositories =====
export {
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
  SqliteTaskDependencyRepository,
  SqliteTaskStatisticsRepository,
} from './task';

// ===== Goal Module Repositories =====
export {
  SqliteGoalRepository,
  SqliteGoalStatisticsRepository,
  SqliteGoalFolderRepository,
  SqliteFocusSessionRepository,
  SqliteFocusModeRepository,
  SqliteWeightSnapshotRepository,
} from './goal';

// ===== Schedule Module Repositories =====
export {
  SqliteScheduleRepository,
  SqliteScheduleTaskRepository,
  SqliteScheduleExecutionRepository,
  SqliteScheduleStatisticsRepository,
} from './schedule';

// ===== Reminder Module Repositories =====
export {
  SqliteReminderRepository,
  SqliteReminderResponseRepository,
  SqliteReminderStatisticsRepository,
  SqliteReminderGroupRepository,
  SqliteReminderTemplateRepository,
} from './reminder';

// ===== Notification Module Repositories =====
export {
  SqliteNotificationRepository,
  SqliteNotificationTemplateRepository,
  SqliteNotificationPreferenceRepository,
} from './notification';

// ===== Editor Module Repositories =====
export {
  SqliteEditorSessionRepository,
  SqliteLinkedResourceRepository,
  SqliteSearchEngineRepository,
  SqliteEditorWorkspaceRepository,
  SqliteEditorTabRepository,
  SqliteEditorGroupRepository,
  SqliteDocumentVersionRepository,
  SqliteDocumentRepository,
} from './editor';

// ===== Authentication Module Repositories =====
export {
  SqliteAuthSessionRepository,
  SqliteAuthCredentialRepository,
} from './authentication';

// ===== Dashboard Module Repositories =====
export { SqliteDashboardConfigRepository } from './dashboard';

// ===== AI Module Repositories =====
export {
  SqliteAIGenerationTaskRepository,
  SqliteKnowledgeGenerationTaskRepository,
  SqliteAIConversationRepository,
  SqliteAIUsageQuotaRepository,
  SqliteAIProviderConfigRepository,
} from './ai';

// ===== Account Module Repositories =====
export { SqliteAccountRepository } from './account';

// ===== Sync Module Repositories =====
export {
  SqliteSyncConflictRepository,
  SqliteSyncSessionRepository,
  SqliteSyncProfileRepository,
  SqlitePendingChangeRepository,
} from './sync';

// ===== Setting Module Repositories =====
export {
  SqliteAppConfigRepository,
  SqliteSettingRepository,
  SqliteUserSettingRepository,
} from './setting';

// ===== Database & Initialization =====
export { SqliteDatabase } from './repository/database';
export { DesktopRepositoryContainer } from './repository/di/desktop-repository-container';
export { DesktopProviderInitializer, initializeDesktopProviderRepositories } from './repository/providers/desktop-provider';
export {
  initializeDesktopRepositories,
  cleanupDesktopRepositories,
  healthCheckDesktopRepositories,
} from './repository/initialization/initialize-desktop';

// ===== Re-export from infrastructure-server for convenience (Types Only) =====
// 只导出类型，避免循环依赖。实现通过 RepositoryContainer.getInstance() 在运行时获取
export type { IProviderInitializer } from '@dailyuse/infrastructure-server/repository';
