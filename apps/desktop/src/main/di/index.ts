/**
 * Dependency Injection (DI) Module
 *
 * Exports the main composition root for configuring dependencies and lazy module loading utilities.
 * SQLite adapter implementations are now imported from infrastructure-server package.
 *
 * @module di
 */

export {
  configureMainProcessDependencies,
  resetAllContainers,
  isDIConfigured,
} from './desktop-main.composition-root';

export {
  ensureModuleLoaded,
  isModuleLoaded,
  getLoadedModules,
  getLazyModuleStats,
  getModuleLoadTimes,
} from './lazy-module-loader';

// SQLite adapters are now imported from infrastructure-server
// Re-export for backward compatibility
export {
  // Goal Module
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalStatisticsRepository,
  SqliteFocusModeRepository,
  SqliteFocusSessionRepository,
  SqliteWeightSnapshotRepository,
  // Account Module
  SqliteAccountRepository,
  // Auth Module
  SqliteAuthCredentialRepository,
  SqliteAuthSessionRepository,
  // Task Module
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
  SqliteTaskDependencyRepository,
  SqliteTaskStatisticsRepository,
  // Schedule Module
  SqliteScheduleRepository,
  SqliteScheduleTaskRepository,
  SqliteScheduleExecutionRepository,
  SqliteScheduleStatisticsRepository,
  // Reminder Module
  SqliteReminderGroupRepository,
  SqliteReminderTemplateRepository,
  SqliteReminderStatisticsRepository,
  SqliteReminderResponseRepository,
  // AI Module
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIUsageQuotaRepository,
  SqliteAIProviderConfigRepository,
  SqliteKnowledgeGenerationTaskRepository,
  // Notification Module
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
  // Dashboard Module
  SqliteDashboardConfigRepository,
  // Repository Module
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  SqliteRepositoryStatisticsRepository,
  // Setting Module
  SqliteAppConfigRepository,
  SqliteSettingRepository,
  SqliteUserSettingRepository,
  // Sync Module
  SqliteSyncSessionRepository,
  SqliteSyncProfileRepository,
  SqliteSyncConflictRepository,
  SqlitePendingChangeRepository,
  // Editor Module
  SqliteDocumentRepository,
  SqliteDocumentVersionRepository,
  SqliteEditorWorkspaceRepository,
  SqliteEditorGroupRepository,
  SqliteEditorTabRepository,
  SqliteEditorSessionRepository,
  SqliteLinkedResourceRepository,
  SqliteSearchEngineRepository,
} from '@dailyuse/infrastructure-server';
