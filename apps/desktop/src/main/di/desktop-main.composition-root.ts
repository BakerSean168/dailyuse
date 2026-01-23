/**
 * Desktop Main Process - Composition Root
 *
 * Configures Dependency Injection (DI) for the main process.
 * Follows the Container pattern from `@dailyuse/infrastructure-server`.
 * Implements lazy loading for non-core modules to optimize startup performance.
 *
 * Responsibilities:
 * 1. Initialize database connections (implicitly via repositories).
 * 2. Instantiate SQLite Repository adapters.
 * 3. Register repositories to their respective Containers.
 * 4. Load core modules immediately and schedule lazy loading for others.
 *
 * Module Categorization:
 * - Core Modules (Loaded Immediately): Goal, Task, Dashboard, Account, Auth, Schedule
 * - Non-Core Modules (Lazy Loaded): AI, Notification, Repository, Setting, Reminder
 *
 * @module di/desktop-main
 */

import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AccountContainer,
  AuthContainer,
  NotificationContainer,
  AIContainer,
  DashboardContainer,
  RepositoryContainer,
  SettingContainer,
  // SQLite Adapters (imported from infrastructure-server)
  // Goal
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalStatisticsRepository,
  SqliteFocusModeRepository,
  SqliteFocusSessionRepository,
  SqliteWeightSnapshotRepository,
  // Account
  SqliteAccountRepository,
  // Auth
  SqliteAuthCredentialRepository,
  SqliteAuthSessionRepository,
  // Task
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
  SqliteTaskDependencyRepository,
  SqliteTaskStatisticsRepository,
  // Schedule
  SqliteScheduleRepository,
  SqliteScheduleTaskRepository,
  SqliteScheduleExecutionRepository,
  SqliteScheduleStatisticsRepository,
  // Reminder
  SqliteReminderGroupRepository,
  SqliteReminderTemplateRepository,
  SqliteReminderStatisticsRepository,
  SqliteReminderResponseRepository,
  // AI
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIUsageQuotaRepository,
  SqliteAIProviderConfigRepository,
  SqliteKnowledgeGenerationTaskRepository,
  // Notification
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
  // Dashboard
  SqliteDashboardConfigRepository,
  // Repository
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  SqliteRepositoryStatisticsRepository,
  // Setting
  SqliteAppConfigRepository,
  SqliteSettingRepository,
  SqliteUserSettingRepository,
  // Sync
  SqliteSyncSessionRepository,
  SqliteSyncProfileRepository,
  SqliteSyncConflictRepository,
  SqlitePendingChangeRepository,
  // Editor
  SqliteDocumentRepository,
  SqliteDocumentVersionRepository,
  SqliteEditorWorkspaceRepository,
  SqliteEditorGroupRepository,
  SqliteEditorTabRepository,
  SqliteEditorSessionRepository,
  SqliteLinkedResourceRepository,
  SqliteSearchEngineRepository,
} from '@dailyuse/infrastructure-server';

import { registerLazyModule, ensureModuleLoaded, preloadModules } from './lazy-module-loader';

/**
 * Configures dependency injection for all main process modules.
 *
 * Strategy:
 * - **Core Modules**: Loaded synchronously at startup because they are essential for the app to function immediately.
 * - **Lazy Modules**: Registered to be loaded only when first requested.
 * - **Preloading**: Frequently used lazy modules are scheduled to load after a short delay (e.g., 3s) to avoid jank during startup.
 */
export function configureMainProcessDependencies(): void {
  const startTime = performance.now();
  console.log('[DI] Configuring main process dependencies...');

  // ========== Core Modules - Immediate Load ==========
  // These are required immediately upon startup
  configureGoalModule();
  configureAccountModule();
  configureAuthModule();
  configureTaskModule();
  configureScheduleModule();
  configureDashboardModule();

  const coreLoadTime = performance.now() - startTime;
  console.log(`[DI] Core modules loaded in ${coreLoadTime.toFixed(2)}ms`);

  // ========== Non-Core Modules - Lazy Load ==========
  // These are loaded on first use
  registerLazyModule('ai', async () => configureAIModule());
  registerLazyModule('notification', async () => configureNotificationModule());
  registerLazyModule('repository', async () => configureRepositoryModule());
  registerLazyModule('setting', async () => configureSettingModule());
  registerLazyModule('reminder', async () => configureReminderModule());

  console.log('[DI] Lazy modules registered (AI, Notification, Repository, Setting, Reminder)');

  // Preload frequently used modules after 3 seconds of idle time
  setTimeout(() => {
    console.log('[DI] Preloading frequently used modules...');
    preloadModules(['reminder', 'notification', 'setting']);
  }, 3000);

  console.log('[DI] Main process dependencies configured successfully');
}

/**
 * Configures dependencies for the Goal module.
 */
function configureGoalModule(): void {
  const goalRepository = new SqliteGoalRepository();
  const goalFolderRepository = new SqliteGoalFolderRepository();
  const goalStatisticsRepository = new SqliteGoalStatisticsRepository();

  GoalContainer.getInstance()
    .registerGoalRepository(goalRepository)
    .registerGoalFolderRepository(goalFolderRepository)
    .registerStatisticsRepository(goalStatisticsRepository);

  console.log('[DI] Goal module configured');
}

/**
 * Configures dependencies for the Account module.
 */
function configureAccountModule(): void {
  const accountRepository = new SqliteAccountRepository();
  
  // Use type assertion if necessary to bypass minor interface mismatches
  AccountContainer.getInstance()
    .registerAccountRepository(accountRepository);

  console.log('[DI] Account module configured');
}

/**
 * Configures dependencies for the Auth module.
 */
function configureAuthModule(): void {
  const credentialRepository = new SqliteAuthCredentialRepository();
  const sessionRepository = new SqliteAuthSessionRepository();

  AuthContainer.getInstance()
    .registerCredentialRepository(credentialRepository)
    .registerSessionRepository(sessionRepository);

  console.log('[DI] Auth module configured');
}

/**
 * Configures dependencies for the Task module.
 */
function configureTaskModule(): void {
  const templateRepository = new SqliteTaskTemplateRepository();
  const instanceRepository = new SqliteTaskInstanceRepository();
  const statisticsRepository = new SqliteTaskStatisticsRepository();

  TaskContainer.getInstance()
    .registerTemplateRepository(templateRepository)
    .registerInstanceRepository(instanceRepository)
    .registerStatisticsRepository(statisticsRepository);

  console.log('[DI] Task module configured');
}

/**
 * Configures dependencies for the Schedule module.
 */
function configureScheduleModule(): void {
  const scheduleTaskRepository = new SqliteScheduleTaskRepository();
  const statisticsRepository = new SqliteScheduleStatisticsRepository();

  ScheduleContainer.getInstance()
    .registerScheduleTaskRepository(scheduleTaskRepository)
    .registerStatisticsRepository(statisticsRepository);

  console.log('[DI] Schedule module configured');
}

/**
 * Configures dependencies for the Reminder module.
 */
function configureReminderModule(): void {
  const templateRepository = new SqliteReminderTemplateRepository();
  const groupRepository = new SqliteReminderGroupRepository();
  const statisticsRepository = new SqliteReminderStatisticsRepository();

  ReminderContainer.getInstance()
    .registerTemplateRepository(templateRepository)
    .registerGroupRepository(groupRepository)
    .registerStatisticsRepository(statisticsRepository);

  console.log('[DI] Reminder module configured');
}

/**
 * Configures dependencies for the AI module.
 */
function configureAIModule(): void {
  const conversationRepository = new SqliteAIConversationRepository();
  const generationTaskRepository = new SqliteAIGenerationTaskRepository();
  const usageQuotaRepository = new SqliteAIUsageQuotaRepository();
  const providerConfigRepository = new SqliteAIProviderConfigRepository();

  AIContainer.getInstance()
    .registerConversationRepository(conversationRepository)
    .registerGenerationTaskRepository(generationTaskRepository)
    .registerUsageQuotaRepository(usageQuotaRepository)
    .registerProviderConfigRepository(providerConfigRepository);

  console.log('[DI] AI module configured');
}

/**
 * Configures dependencies for the Notification module.
 */
function configureNotificationModule(): void {
  const notificationRepository = new SqliteNotificationRepository();
  const preferenceRepository = new SqliteNotificationPreferenceRepository();
  const templateRepository = new SqliteNotificationTemplateRepository();

  NotificationContainer.getInstance()
    .registerNotificationRepository(notificationRepository)
    .registerPreferenceRepository(preferenceRepository)
    .registerTemplateRepository(templateRepository);

  console.log('[DI] Notification module configured');
}

/**
 * Configures dependencies for the Dashboard module.
 */
function configureDashboardModule(): void {
  const dashboardConfigRepository = new SqliteDashboardConfigRepository();

  DashboardContainer.getInstance()
    .registerDashboardConfigRepository(dashboardConfigRepository);

  // Register a simple in-memory cache service (stub implementation for now)
  DashboardContainer.getInstance()
    .registerStatisticsCacheService({
      async get<T>(_key: string): Promise<T | null> { return null; },
      async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {},
      async invalidate(_key: string): Promise<void> {},
      async invalidatePattern(_pattern: string): Promise<void> {},
    });

  console.log('[DI] Dashboard module configured');
}

/**
 * Configures dependencies for the Repository module.
 */
function configureRepositoryModule(): void {
  const repositoryRepository = new SqliteRepositoryRepository();
  const resourceRepository = new SqliteResourceRepository();
  const folderRepository = new SqliteFolderRepository();
  const statisticsRepository = new SqliteRepositoryStatisticsRepository();

  RepositoryContainer.getInstance()
    .registerRepositoryRepository(repositoryRepository)
    .registerResourceRepository(resourceRepository)
    .registerFolderRepository(folderRepository)
    .registerRepositoryStatisticsRepository(statisticsRepository);

  console.log('[DI] Repository module configured');
}

/**
 * Configures dependencies for the Setting module.
 */
function configureSettingModule(): void {
  const appConfigRepository = new SqliteAppConfigRepository();
  const settingRepository = new SqliteSettingRepository();
  const userSettingRepository = new SqliteUserSettingRepository();

  SettingContainer.getInstance()
    .registerAppConfigRepository(appConfigRepository)
    .registerSettingRepository(settingRepository)
    .registerUserSettingRepository(userSettingRepository);

  console.log('[DI] Setting module configured');
}

/**
 * Resets all singleton Containers.
 * Use this primarily for testing purposes to ensure a clean state between tests.
 */
export function resetAllContainers(): void {
  GoalContainer.resetInstance();
  TaskContainer.resetInstance();
  ScheduleContainer.resetInstance();
  ReminderContainer.resetInstance();
  AccountContainer.resetInstance();
  AuthContainer.resetInstance();
  NotificationContainer.resetInstance();
  AIContainer.resetInstance();
  DashboardContainer.resetInstance();
  RepositoryContainer.resetInstance();
  SettingContainer.resetInstance();
  console.log('[DI] All containers reset');
}

/**
 * Checks if the Dependency Injection system is configured.
 *
 * @returns {boolean} True if the GoalContainer (as a proxy for core modules) is configured.
 */
export function isDIConfigured(): boolean {
  return GoalContainer.getInstance().isConfigured();
}
