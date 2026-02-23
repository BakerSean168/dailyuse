/**
 * Renderer Modules - 统一导出
 *
 * 渲染进程业务模块入口
 * 遵循 DDD 分层架构
 */

// ============================================================
// Account Module
// ============================================================
export {
  // Hooks
  useAccount,
  useAccountProfile,
  // Types
  type UseAccountReturn,
  type AccountState,
} from './account';

// ============================================================
// Authentication Module
// ============================================================
export {
  // Hooks
  useAuth,
  // Types
  type AuthUser,
  type AuthState,
} from './authentication';

// ============================================================
// Goal Module
// ============================================================
export {
  // Hooks
  useGoal,
  useGoalFolder,
  // Types
  type UseGoalReturn,
  type UseGoalFolderReturn,
} from './goal';

// ============================================================
// Task Module
// ============================================================
export {
  // Hooks
  useTask,
  useTaskTemplate,
  useTaskInstance,
  // Types
  type UseTaskReturn,
  type TaskState,
} from './task';

// ============================================================
// Schedule Module
// ============================================================
export {
  // Hooks
  useSchedule,
  // Types
  type UseScheduleReturn,
  type ScheduleState,
} from './schedule';

// ============================================================
// Reminder Module
// ============================================================
export {
  // Hooks
  useReminder,
  // Types
  type UseReminderReturn,
  type ReminderState,
} from './reminder';

// ============================================================
// Dashboard Module
// ============================================================
export {
  // Hooks
  useDashboard,
  // Types
  type UseDashboardResult,
  type DashboardStats,
} from './dashboard';

// ============================================================
// AI Module
// ============================================================
export {
  // Application Service
  AIApplicationService,
  aiApplicationService,
  // Hooks
  useAIConversation,
  useAIGeneration,
  useAIProvider,
  // Types
  type UseAIConversationReturn,
  type AIConversationState,
  type UseAIGenerationReturn,
  type AIGenerationState,
  type UseAIProviderReturn,
  type AIProviderState,
} from './ai';

// ============================================================
// Notification Module
// ============================================================
export {
  // Application Service
  NotificationApplicationService,
  notificationApplicationService,
  // Hooks
  useNotification,
  // Types
  type UseNotificationReturn,
} from './notification';

// ============================================================
// Repository Module
// ============================================================
export {
  // Application Service
  RepositoryApplicationService,
  repositoryApplicationService,
  // Hooks
  useRepository,
  // Types
  type UseRepositoryReturn,
  type RepositoryState,
} from './repository';

// ============================================================
// Setting Module
// ============================================================
export {
  // Hooks
  useAppSettings,
  // Types
  type UseAppSettingsReturn,
  type AppSettingsState,
} from './setting';

// ============================================================
// Focus Module
// ============================================================
export {
  // Components
  PomodoroTimer,
  FocusStatistics,
  FocusModePanel,
  // Hooks
  useFocus,
  // Types
  type FocusSession,
  type FocusSettings,
  type FocusState,
  type UseFocusReturn,
} from './focus';

// ============================================================
// Module Initialization
// ============================================================
export { initializeModules, type ModuleInitializationResult } from './initialization';

// ============================================================
// Sync Module
// ============================================================
export {
  // Application Service
  SyncRendererService,
  getSyncService,
  // Hooks
  useSyncStatus,
  useSync,
  useSyncProfiles,
  useSyncConflicts,
  // Components
  SyncStatusIndicator,
  SyncProfileCard,
  SyncConflictItem,
  // Types
  type UseSyncStatusResult,
  type UseSyncOperationsResult,
  type UseSyncProfilesResult,
  type UseSyncConflictsResult,
} from './sync';
