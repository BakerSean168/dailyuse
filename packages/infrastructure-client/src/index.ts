/**
 * @dailyuse/infrastructure-client
 *
 * Client Infrastructure Layer - Ports & Adapters
 *
 * This package implements the Hexagonal Architecture (Ports & Adapters) pattern
 * for client-side applications. It provides:
 *
 * - Ports: Interface definitions for external dependencies
 * - Adapters: Concrete implementations for different environments
 *   - HTTP: REST API clients for web applications
 *   - IPC: Electron IPC clients for desktop renderer
 *   - Storage: Local storage adapters
 *
 * Module Structure:
 * - goal/          - Goal module ports & adapters
 * - task/          - Task module ports & adapters
 * - schedule/      - Schedule module ports & adapters
 * - reminder/      - Reminder module ports & adapters
 * - account/       - Account module ports & adapters
 * - authentication/ - Authentication module ports & adapters
 * - notification/  - Notification module ports & adapters
 * - encryption/    - Encryption service for cloud sync
 * - shared/        - Shared types (HTTP/IPC clients, Storage)
 */

// ============================================================
// Encryption Module (STORY-044)
// ============================================================
export {
  EncryptionService,
  type EncryptedData,
  type KeyDerivationParams,
} from './encryption';

// ============================================================
// Goal Module
// ============================================================
export {
  // Container
  GoalContainer,
  GoalDependencyKeys,
  type IGoalRepository,
  // Ports
  type IGoalApiClient,
  type IGoalFolderApiClient,
  type IGoalFocusApiClient,
  // HTTP Adapters
  GoalHttpAdapter,
  createGoalHttpAdapter,
  GoalFolderHttpAdapter,
  createGoalFolderHttpAdapter,
  // IPC Adapters
  GoalIpcAdapter,
  createGoalIpcAdapter,
  GoalFolderIpcAdapter,
  createGoalFolderIpcAdapter,
  GoalFocusIpcAdapter,
  createGoalFocusIpcAdapter,
} from './goal';

// ============================================================
// Task Module
// ============================================================
export {
  // Container
  TaskContainer,
  TaskDependencyKeys,
  type ITaskTemplateRepository,
  type ITaskInstanceRepository,
  // Ports
  type ITaskTemplateApiClient,
  type ITaskInstanceApiClient,
  type ITaskDependencyApiClient,
  type ITaskStatisticsApiClient,
  // HTTP Adapters
  TaskTemplateHttpAdapter,
  createTaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  createTaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  createTaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
  createTaskStatisticsHttpAdapter,
  // IPC Adapters
  TaskTemplateIpcAdapter,
  createTaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  createTaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  createTaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
  createTaskStatisticsIpcAdapter,
} from './task';

// ============================================================
// Schedule Module
// ============================================================
export {
  // Container
  ScheduleContainer,
  ScheduleDependencyKeys,
  type IScheduleTaskRepository,
  type IScheduleEventRepository,
  // Ports
  type IScheduleTaskApiClient,
  type IScheduleEventApiClient,
  // HTTP Adapters
  ScheduleTaskHttpAdapter,
  createScheduleTaskHttpAdapter,
  ScheduleEventHttpAdapter,
  createScheduleEventHttpAdapter,
  // IPC Adapters
  ScheduleTaskIpcAdapter,
  createScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
  createScheduleEventIpcAdapter,
} from './schedule';

// ============================================================
// Reminder Module
// ============================================================
export {
  // Container
  ReminderContainer,
  ReminderDependencyKeys,
  type IReminderRepository,
  // Ports
  type IReminderApiClient,
  type ReminderTemplatesResponse,
  type ReminderGroupsResponse,
  // HTTP Adapters
  ReminderHttpAdapter,
  createReminderHttpAdapter,
  // IPC Adapters
  ReminderIpcAdapter,
  createReminderIpcAdapter,
} from './reminder';

// ============================================================
// Account Module
// ============================================================
export {
  // Container
  AccountContainer,
  AccountDependencyKeys,
  type IAccountRepository,
  // Ports
  type IAccountApiClient,
  // HTTP Adapters
  AccountHttpAdapter,
  createAccountHttpAdapter,
  // IPC Adapters
  AccountIpcAdapter,
  createAccountIpcAdapter,
} from './account';

// ============================================================
// Authentication Module
// ============================================================
export {
  // Container
  AuthContainer,
  AuthDependencyKeys,
  type IAuthTokenStorage,
  // Ports
  type IAuthApiClient,
  type RegisterResponse,
  // HTTP Adapters
  AuthHttpAdapter,
  createAuthHttpAdapter,
  // IPC Adapters
  AuthIpcAdapter,
  createAuthIpcAdapter,
} from './authentication';

// ============================================================
// Notification Module
// ============================================================
export {
  // Container
  NotificationContainer,
  NotificationDependencyKeys,
  type INotificationRepository,
  // Ports
  type INotificationApiClient,
  type CreateNotificationRequest,
  type QueryNotificationsRequest,
  type NotificationListResponse,
  type UnreadCountResponse,
  // HTTP Adapters
  NotificationHttpAdapter,
  createNotificationHttpAdapter,
  // IPC Adapters
  NotificationIpcAdapter,
  createNotificationIpcAdapter,
} from './notification';

// ============================================================
// AI Module
// ============================================================
export {
  // Container
  AIContainer,
  // Ports
  type IAIConversationApiClient,
  type IAIMessageApiClient,
  type IAIGenerationTaskApiClient,
  type IAIUsageQuotaApiClient,
  type IAIProviderConfigApiClient,
  // HTTP Adapters
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIGenerationTaskHttpAdapter,
  AIUsageQuotaHttpAdapter,
  AIProviderConfigHttpAdapter,
  // IPC Adapters
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIGenerationTaskIpcAdapter,
  AIUsageQuotaIpcAdapter,
  AIProviderConfigIpcAdapter,
} from './ai';

// ============================================================
// Dashboard Module
// ============================================================
export {
  // Container
  DashboardContainer,
  // Ports
  type IDashboardApiClient,
  // HTTP Adapters
  DashboardHttpAdapter,
  // IPC Adapters
  DashboardIpcAdapter,
} from './dashboard';

// ============================================================
// Repository Module
// ============================================================
export {
  // Container
  RepositoryContainer,
  // Ports
  type IRepositoryApiClient,
  type CreateRepositoryRequest,
  type CreateFolderRequest,
  // HTTP Adapters
  RepositoryHttpAdapter,
  // IPC Adapters
  RepositoryIpcAdapter,
} from './repository';

// ============================================================
// Setting Module
// ============================================================
export {
  // Container
  SettingContainer,
  // Ports
  type ISettingApiClient,
  // HTTP Adapters
  SettingHttpAdapter,
  // IPC Adapters
  SettingIpcAdapter,
} from './setting';

// ============================================================
// Shared (Types and Utilities)
// ============================================================
export {
  type HttpClient,
  type IHttpClient,
  type HttpClientConfig,
  type IpcClient,
  type ElectronAPI,
  type IStorage,
  type ICacheStorage,
  LocalStorageAdapter,
  MemoryCacheAdapter,
  createIpcClient,
  getElectronAPI,
} from './shared';

// ============================================================
// Dependency Injection (DI)
// ============================================================
export {
  // Core DI utilities
  DIContainer,
  ModuleContainerBase,
  // Composition Roots
  configureWebDependencies,
  configureDesktopDependencies,
} from './di';
