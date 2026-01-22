/**
 * Repository Container (Server)
 *
 * 依赖注入容器，管理所有模块的 repository 实例
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';
import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  ITaskDependencyRepository,
  ITaskStatisticsRepository,
} from '@dailyuse/domain-server/task';
import type {
  IGoalRepository,
  IGoalStatisticsRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IFocusModeRepository,
  IWeightSnapshotRepository,
} from '@dailyuse/domain-server/goal';
import type {
  IScheduleRepository,
  IScheduleTaskRepository,
  IScheduleExecutionRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import type {
  IReminderRepository,
  IReminderResponseRepository,
  IReminderStatisticsRepository,
  IReminderGroupRepository,
  IReminderTemplateRepository,
} from '@dailyuse/domain-server/reminder';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
import type {
  IEditorSessionRepository,
  ILinkedResourceRepository,
  ISearchEngineRepository,
  IEditorWorkspaceRepository,
  IEditorTabRepository,
  IEditorGroupRepository,
  IDocumentVersionRepository,
  IDocumentRepository,
} from '@dailyuse/domain-server/editor';
import type {
  IAuthSessionRepository,
  IAuthCredentialRepository,
} from '@dailyuse/domain-server/authentication';
import type {
  IDashboardConfigRepository,
} from '@dailyuse/domain-server/dashboard';
import type {
  IAIGenerationTaskRepository,
  IKnowledgeGenerationTaskRepository,
  IAIConversationRepository,
  IAIUsageQuotaRepository,
  IAIProviderConfigRepository,
} from '@dailyuse/domain-server/ai';
import type {
  IAccountRepository,
} from '@dailyuse/domain-server/account';
import type {
  ISyncConflictRepository,
  ISyncSessionRepository,
  ISyncProfileRepository,
  IPendingChangeRepository,
} from '@dailyuse/domain-server/sync';
import type {
  IAppConfigRepository,
  ISettingRepository,
  IUserSettingRepository,
} from '@dailyuse/domain-server/setting';

/**
 * 所有模块的依赖注入容器
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;

  // ===== Repository 模块 =====
  private repositoryRepository: IRepositoryRepository | null = null;
  private resourceRepository: IResourceRepository | null = null;
  private folderRepository: IFolderRepository | null = null;
  private repositoryStatisticsRepository: IRepositoryStatisticsRepository | null = null;

  // ===== Task 模块 =====
  private taskInstanceRepository: ITaskInstanceRepository | null = null;
  private taskTemplateRepository: ITaskTemplateRepository | null = null;
  private taskDependencyRepository: ITaskDependencyRepository | null = null;
  private taskStatisticsRepository: ITaskStatisticsRepository | null = null;

  // ===== Goal 模块 =====
  private goalRepository: IGoalRepository | null = null;
  private goalStatisticsRepository: IGoalStatisticsRepository | null = null;
  private goalFolderRepository: IGoalFolderRepository | null = null;
  private focusSessionRepository: IFocusSessionRepository | null = null;
  private focusModeRepository: IFocusModeRepository | null = null;
  private weightSnapshotRepository: IWeightSnapshotRepository | null = null;

  // ===== Schedule 模块 =====
  private scheduleRepository: IScheduleRepository | null = null;
  private scheduleTaskRepository: IScheduleTaskRepository | null = null;
  private scheduleExecutionRepository: IScheduleExecutionRepository | null = null;
  private scheduleStatisticsRepository: IScheduleStatisticsRepository | null = null;

  // ===== Reminder 模块 =====
  private reminderRepository: IReminderRepository | null = null;
  private reminderResponseRepository: IReminderResponseRepository | null = null;
  private reminderStatisticsRepository: IReminderStatisticsRepository | null = null;
  private reminderGroupRepository: IReminderGroupRepository | null = null;
  private reminderTemplateRepository: IReminderTemplateRepository | null = null;

  // ===== Notification 模块 =====
  private notificationRepository: INotificationRepository | null = null;
  private notificationTemplateRepository: INotificationTemplateRepository | null = null;
  private notificationPreferenceRepository: INotificationPreferenceRepository | null = null;

  // ===== Editor 模块 =====
  private editorSessionRepository: IEditorSessionRepository | null = null;
  private linkedResourceRepository: ILinkedResourceRepository | null = null;
  private searchEngineRepository: ISearchEngineRepository | null = null;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;
  private editorTabRepository: IEditorTabRepository | null = null;
  private editorGroupRepository: IEditorGroupRepository | null = null;
  private documentVersionRepository: IDocumentVersionRepository | null = null;
  private documentRepository: IDocumentRepository | null = null;

  // ===== Authentication 模块 =====
  private authSessionRepository: IAuthSessionRepository | null = null;
  private authCredentialRepository: IAuthCredentialRepository | null = null;

  // ===== Dashboard 模块 =====
  private dashboardConfigRepository: IDashboardConfigRepository | null = null;

  // ===== AI 模块 =====
  private aiGenerationTaskRepository: IAIGenerationTaskRepository | null = null;
  private knowledgeGenerationTaskRepository: IKnowledgeGenerationTaskRepository | null = null;
  private aiConversationRepository: IAIConversationRepository | null = null;
  private aiUsageQuotaRepository: IAIUsageQuotaRepository | null = null;
  private aiProviderConfigRepository: IAIProviderConfigRepository | null = null;

  // ===== Account 模块 =====
  private accountRepository: IAccountRepository | null = null;

  // ===== Sync 模块 =====
  private syncConflictRepository: ISyncConflictRepository | null = null;
  private syncSessionRepository: ISyncSessionRepository | null = null;
  private syncProfileRepository: ISyncProfileRepository | null = null;
  private pendingChangeRepository: IPendingChangeRepository | null = null;

  // ===== Setting 模块 =====
  private appConfigRepository: IAppConfigRepository | null = null;
  private settingRepository: ISettingRepository | null = null;
  private userSettingRepository: IUserSettingRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    RepositoryContainer.instance = new RepositoryContainer();
  }

  // ===== Repository 模块 =====

  registerRepositoryRepository(repository: IRepositoryRepository): this {
    this.repositoryRepository = repository;
    return this;
  }

  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      throw new Error('RepositoryRepository not registered.');
    }
    return this.repositoryRepository;
  }

  registerResourceRepository(repository: IResourceRepository): this {
    this.resourceRepository = repository;
    return this;
  }

  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      throw new Error('ResourceRepository not registered.');
    }
    return this.resourceRepository;
  }

  registerFolderRepository(repository: IFolderRepository): this {
    this.folderRepository = repository;
    return this;
  }

  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      throw new Error('FolderRepository not registered.');
    }
    return this.folderRepository;
  }

  registerRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): this {
    this.repositoryStatisticsRepository = repository;
    return this;
  }

  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error('RepositoryStatisticsRepository not registered.');
    }
    return this.repositoryStatisticsRepository;
  }

  // ===== Task 模块 =====

  registerTaskInstanceRepository(repository: ITaskInstanceRepository): this {
    this.taskInstanceRepository = repository;
    return this;
  }

  getTaskInstanceRepository(): ITaskInstanceRepository {
    if (!this.taskInstanceRepository) {
      throw new Error('TaskInstanceRepository not registered.');
    }
    return this.taskInstanceRepository;
  }

  registerTaskTemplateRepository(repository: ITaskTemplateRepository): this {
    this.taskTemplateRepository = repository;
    return this;
  }

  getTaskTemplateRepository(): ITaskTemplateRepository {
    if (!this.taskTemplateRepository) {
      throw new Error('TaskTemplateRepository not registered.');
    }
    return this.taskTemplateRepository;
  }

  registerTaskDependencyRepository(repository: ITaskDependencyRepository): this {
    this.taskDependencyRepository = repository;
    return this;
  }

  getTaskDependencyRepository(): ITaskDependencyRepository {
    if (!this.taskDependencyRepository) {
      throw new Error('TaskDependencyRepository not registered.');
    }
    return this.taskDependencyRepository;
  }

  registerTaskStatisticsRepository(repository: ITaskStatisticsRepository): this {
    this.taskStatisticsRepository = repository;
    return this;
  }

  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    if (!this.taskStatisticsRepository) {
      throw new Error('TaskStatisticsRepository not registered.');
    }
    return this.taskStatisticsRepository;
  }

  // ===== Goal 模块 =====

  registerGoalRepository(repository: IGoalRepository): this {
    this.goalRepository = repository;
    return this;
  }

  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      throw new Error('GoalRepository not registered.');
    }
    return this.goalRepository;
  }

  registerGoalStatisticsRepository(repository: IGoalStatisticsRepository): this {
    this.goalStatisticsRepository = repository;
    return this;
  }

  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.goalStatisticsRepository) {
      throw new Error('GoalStatisticsRepository not registered.');
    }
    return this.goalStatisticsRepository;
  }

  registerGoalFolderRepository(repository: IGoalFolderRepository): this {
    this.goalFolderRepository = repository;
    return this;
  }

  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      throw new Error('GoalFolderRepository not registered.');
    }
    return this.goalFolderRepository;
  }

  registerFocusSessionRepository(repository: IFocusSessionRepository): this {
    this.focusSessionRepository = repository;
    return this;
  }

  getFocusSessionRepository(): IFocusSessionRepository {
    if (!this.focusSessionRepository) {
      throw new Error('FocusSessionRepository not registered.');
    }
    return this.focusSessionRepository;
  }

  registerFocusModeRepository(repository: IFocusModeRepository): this {
    this.focusModeRepository = repository;
    return this;
  }

  getFocusModeRepository(): IFocusModeRepository {
    if (!this.focusModeRepository) {
      throw new Error('FocusModeRepository not registered.');
    }
    return this.focusModeRepository;
  }

  registerWeightSnapshotRepository(repository: IWeightSnapshotRepository): this {
    this.weightSnapshotRepository = repository;
    return this;
  }

  getWeightSnapshotRepository(): IWeightSnapshotRepository {
    if (!this.weightSnapshotRepository) {
      throw new Error('WeightSnapshotRepository not registered.');
    }
    return this.weightSnapshotRepository;
  }

  // ===== Schedule 模块 =====

  registerScheduleRepository(repository: IScheduleRepository): this {
    this.scheduleRepository = repository;
    return this;
  }

  getScheduleRepository(): IScheduleRepository {
    if (!this.scheduleRepository) {
      throw new Error('ScheduleRepository not registered.');
    }
    return this.scheduleRepository;
  }

  registerScheduleTaskRepository(repository: IScheduleTaskRepository): this {
    this.scheduleTaskRepository = repository;
    return this;
  }

  getScheduleTaskRepository(): IScheduleTaskRepository {
    if (!this.scheduleTaskRepository) {
      throw new Error('ScheduleTaskRepository not registered.');
    }
    return this.scheduleTaskRepository;
  }

  registerScheduleExecutionRepository(repository: IScheduleExecutionRepository): this {
    this.scheduleExecutionRepository = repository;
    return this;
  }

  getScheduleExecutionRepository(): IScheduleExecutionRepository {
    if (!this.scheduleExecutionRepository) {
      throw new Error('ScheduleExecutionRepository not registered.');
    }
    return this.scheduleExecutionRepository;
  }

  registerScheduleStatisticsRepository(repository: IScheduleStatisticsRepository): this {
    this.scheduleStatisticsRepository = repository;
    return this;
  }

  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    if (!this.scheduleStatisticsRepository) {
      throw new Error('ScheduleStatisticsRepository not registered.');
    }
    return this.scheduleStatisticsRepository;
  }

  // ===== Reminder 模块 =====

  registerReminderRepository(repository: IReminderRepository): this {
    this.reminderRepository = repository;
    return this;
  }

  getReminderRepository(): IReminderRepository {
    if (!this.reminderRepository) {
      throw new Error('ReminderRepository not registered.');
    }
    return this.reminderRepository;
  }

  registerReminderResponseRepository(repository: IReminderResponseRepository): this {
    this.reminderResponseRepository = repository;
    return this;
  }

  getReminderResponseRepository(): IReminderResponseRepository {
    if (!this.reminderResponseRepository) {
      throw new Error('ReminderResponseRepository not registered.');
    }
    return this.reminderResponseRepository;
  }

  registerReminderStatisticsRepository(repository: IReminderStatisticsRepository): this {
    this.reminderStatisticsRepository = repository;
    return this;
  }

  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    if (!this.reminderStatisticsRepository) {
      throw new Error('ReminderStatisticsRepository not registered.');
    }
    return this.reminderStatisticsRepository;
  }

  registerReminderGroupRepository(repository: IReminderGroupRepository): this {
    this.reminderGroupRepository = repository;
    return this;
  }

  getReminderGroupRepository(): IReminderGroupRepository {
    if (!this.reminderGroupRepository) {
      throw new Error('ReminderGroupRepository not registered.');
    }
    return this.reminderGroupRepository;
  }

  registerReminderTemplateRepository(repository: IReminderTemplateRepository): this {
    this.reminderTemplateRepository = repository;
    return this;
  }

  getReminderTemplateRepository(): IReminderTemplateRepository {
    if (!this.reminderTemplateRepository) {
      throw new Error('ReminderTemplateRepository not registered.');
    }
    return this.reminderTemplateRepository;
  }

  // ===== Notification 模块 =====

  registerNotificationRepository(repository: INotificationRepository): this {
    this.notificationRepository = repository;
    return this;
  }

  getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      throw new Error('NotificationRepository not registered.');
    }
    return this.notificationRepository;
  }

  registerNotificationTemplateRepository(repository: INotificationTemplateRepository): this {
    this.notificationTemplateRepository = repository;
    return this;
  }

  getNotificationTemplateRepository(): INotificationTemplateRepository {
    if (!this.notificationTemplateRepository) {
      throw new Error('NotificationTemplateRepository not registered.');
    }
    return this.notificationTemplateRepository;
  }

  registerNotificationPreferenceRepository(repository: INotificationPreferenceRepository): this {
    this.notificationPreferenceRepository = repository;
    return this;
  }

  getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.notificationPreferenceRepository) {
      throw new Error('NotificationPreferenceRepository not registered.');
    }
    return this.notificationPreferenceRepository;
  }

  // ===== Editor 模块 =====

  registerEditorSessionRepository(repository: IEditorSessionRepository): this {
    this.editorSessionRepository = repository;
    return this;
  }

  getEditorSessionRepository(): IEditorSessionRepository {
    if (!this.editorSessionRepository) {
      throw new Error('EditorSessionRepository not registered.');
    }
    return this.editorSessionRepository;
  }

  registerLinkedResourceRepository(repository: ILinkedResourceRepository): this {
    this.linkedResourceRepository = repository;
    return this;
  }

  getLinkedResourceRepository(): ILinkedResourceRepository {
    if (!this.linkedResourceRepository) {
      throw new Error('LinkedResourceRepository not registered.');
    }
    return this.linkedResourceRepository;
  }

  registerSearchEngineRepository(repository: ISearchEngineRepository): this {
    this.searchEngineRepository = repository;
    return this;
  }

  getSearchEngineRepository(): ISearchEngineRepository {
    if (!this.searchEngineRepository) {
      throw new Error('SearchEngineRepository not registered.');
    }
    return this.searchEngineRepository;
  }

  registerEditorWorkspaceRepository(repository: IEditorWorkspaceRepository): this {
    this.editorWorkspaceRepository = repository;
    return this;
  }

  getEditorWorkspaceRepository(): IEditorWorkspaceRepository {
    if (!this.editorWorkspaceRepository) {
      throw new Error('EditorWorkspaceRepository not registered.');
    }
    return this.editorWorkspaceRepository;
  }

  registerEditorTabRepository(repository: IEditorTabRepository): this {
    this.editorTabRepository = repository;
    return this;
  }

  getEditorTabRepository(): IEditorTabRepository {
    if (!this.editorTabRepository) {
      throw new Error('EditorTabRepository not registered.');
    }
    return this.editorTabRepository;
  }

  registerEditorGroupRepository(repository: IEditorGroupRepository): this {
    this.editorGroupRepository = repository;
    return this;
  }

  getEditorGroupRepository(): IEditorGroupRepository {
    if (!this.editorGroupRepository) {
      throw new Error('EditorGroupRepository not registered.');
    }
    return this.editorGroupRepository;
  }

  registerDocumentVersionRepository(repository: IDocumentVersionRepository): this {
    this.documentVersionRepository = repository;
    return this;
  }

  getDocumentVersionRepository(): IDocumentVersionRepository {
    if (!this.documentVersionRepository) {
      throw new Error('DocumentVersionRepository not registered.');
    }
    return this.documentVersionRepository;
  }

  registerDocumentRepository(repository: IDocumentRepository): this {
    this.documentRepository = repository;
    return this;
  }

  getDocumentRepository(): IDocumentRepository {
    if (!this.documentRepository) {
      throw new Error('DocumentRepository not registered.');
    }
    return this.documentRepository;
  }

  // ===== Authentication 模块 =====

  registerAuthSessionRepository(repository: IAuthSessionRepository): this {
    this.authSessionRepository = repository;
    return this;
  }

  getAuthSessionRepository(): IAuthSessionRepository {
    if (!this.authSessionRepository) {
      throw new Error('AuthSessionRepository not registered.');
    }
    return this.authSessionRepository;
  }

  registerAuthCredentialRepository(repository: IAuthCredentialRepository): this {
    this.authCredentialRepository = repository;
    return this;
  }

  getAuthCredentialRepository(): IAuthCredentialRepository {
    if (!this.authCredentialRepository) {
      throw new Error('AuthCredentialRepository not registered.');
    }
    return this.authCredentialRepository;
  }

  // ===== Dashboard 模块 =====

  registerDashboardConfigRepository(repository: IDashboardConfigRepository): this {
    this.dashboardConfigRepository = repository;
    return this;
  }

  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.dashboardConfigRepository) {
      throw new Error('DashboardConfigRepository not registered.');
    }
    return this.dashboardConfigRepository;
  }

  // ===== AI 模块 =====

  registerAIGenerationTaskRepository(repository: IAIGenerationTaskRepository): this {
    this.aiGenerationTaskRepository = repository;
    return this;
  }

  getAIGenerationTaskRepository(): IAIGenerationTaskRepository {
    if (!this.aiGenerationTaskRepository) {
      throw new Error('AIGenerationTaskRepository not registered.');
    }
    return this.aiGenerationTaskRepository;
  }

  registerKnowledgeGenerationTaskRepository(repository: IKnowledgeGenerationTaskRepository): this {
    this.knowledgeGenerationTaskRepository = repository;
    return this;
  }

  getKnowledgeGenerationTaskRepository(): IKnowledgeGenerationTaskRepository {
    if (!this.knowledgeGenerationTaskRepository) {
      throw new Error('KnowledgeGenerationTaskRepository not registered.');
    }
    return this.knowledgeGenerationTaskRepository;
  }

  registerAIConversationRepository(repository: IAIConversationRepository): this {
    this.aiConversationRepository = repository;
    return this;
  }

  getAIConversationRepository(): IAIConversationRepository {
    if (!this.aiConversationRepository) {
      throw new Error('AIConversationRepository not registered.');
    }
    return this.aiConversationRepository;
  }

  registerAIUsageQuotaRepository(repository: IAIUsageQuotaRepository): this {
    this.aiUsageQuotaRepository = repository;
    return this;
  }

  getAIUsageQuotaRepository(): IAIUsageQuotaRepository {
    if (!this.aiUsageQuotaRepository) {
      throw new Error('AIUsageQuotaRepository not registered.');
    }
    return this.aiUsageQuotaRepository;
  }

  registerAIProviderConfigRepository(repository: IAIProviderConfigRepository): this {
    this.aiProviderConfigRepository = repository;
    return this;
  }

  getAIProviderConfigRepository(): IAIProviderConfigRepository {
    if (!this.aiProviderConfigRepository) {
      throw new Error('AIProviderConfigRepository not registered.');
    }
    return this.aiProviderConfigRepository;
  }

  // ===== Account 模块 =====

  registerAccountRepository(repository: IAccountRepository): this {
    this.accountRepository = repository;
    return this;
  }

  getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      throw new Error('AccountRepository not registered.');
    }
    return this.accountRepository;
  }

  // ===== Sync 模块 =====

  registerSyncConflictRepository(repository: ISyncConflictRepository): this {
    this.syncConflictRepository = repository;
    return this;
  }

  getSyncConflictRepository(): ISyncConflictRepository {
    if (!this.syncConflictRepository) {
      throw new Error('SyncConflictRepository not registered.');
    }
    return this.syncConflictRepository;
  }

  registerSyncSessionRepository(repository: ISyncSessionRepository): this {
    this.syncSessionRepository = repository;
    return this;
  }

  getSyncSessionRepository(): ISyncSessionRepository {
    if (!this.syncSessionRepository) {
      throw new Error('SyncSessionRepository not registered.');
    }
    return this.syncSessionRepository;
  }

  registerSyncProfileRepository(repository: ISyncProfileRepository): this {
    this.syncProfileRepository = repository;
    return this;
  }

  getSyncProfileRepository(): ISyncProfileRepository {
    if (!this.syncProfileRepository) {
      throw new Error('SyncProfileRepository not registered.');
    }
    return this.syncProfileRepository;
  }

  registerPendingChangeRepository(repository: IPendingChangeRepository): this {
    this.pendingChangeRepository = repository;
    return this;
  }

  getPendingChangeRepository(): IPendingChangeRepository {
    if (!this.pendingChangeRepository) {
      throw new Error('PendingChangeRepository not registered.');
    }
    return this.pendingChangeRepository;
  }

  // ===== Setting 模块 =====

  registerAppConfigRepository(repository: IAppConfigRepository): this {
    this.appConfigRepository = repository;
    return this;
  }

  getAppConfigRepository(): IAppConfigRepository {
    if (!this.appConfigRepository) {
      throw new Error('AppConfigRepository not registered.');
    }
    return this.appConfigRepository;
  }

  registerSettingRepository(repository: ISettingRepository): this {
    this.settingRepository = repository;
    return this;
  }

  getSettingRepository(): ISettingRepository {
    if (!this.settingRepository) {
      throw new Error('SettingRepository not registered.');
    }
    return this.settingRepository;
  }

  registerUserSettingRepository(repository: IUserSettingRepository): this {
    this.userSettingRepository = repository;
    return this;
  }

  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      throw new Error('UserSettingRepository not registered.');
    }
    return this.userSettingRepository;
  }

  // ===== 别名方法（兼容性） =====

  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }

  // ===== Utilities =====

  isConfigured(): boolean {
    return (
      this.repositoryRepository !== null &&
      this.resourceRepository !== null &&
      this.folderRepository !== null
    );
  }

  clear(): void {
    // ===== Repository 模块 =====
    this.repositoryRepository = null;
    this.resourceRepository = null;
    this.folderRepository = null;
    this.repositoryStatisticsRepository = null;

    // ===== Task 模块 =====
    this.taskInstanceRepository = null;
    this.taskTemplateRepository = null;
    this.taskDependencyRepository = null;
    this.taskStatisticsRepository = null;

    // ===== Goal 模块 =====
    this.goalRepository = null;
    this.goalStatisticsRepository = null;
    this.goalFolderRepository = null;
    this.focusSessionRepository = null;
    this.focusModeRepository = null;
    this.weightSnapshotRepository = null;

    // ===== Schedule 模块 =====
    this.scheduleRepository = null;
    this.scheduleTaskRepository = null;
    this.scheduleExecutionRepository = null;
    this.scheduleStatisticsRepository = null;

    // ===== Reminder 模块 =====
    this.reminderRepository = null;
    this.reminderResponseRepository = null;
    this.reminderStatisticsRepository = null;
    this.reminderGroupRepository = null;
    this.reminderTemplateRepository = null;

    // ===== Notification 模块 =====
    this.notificationRepository = null;
    this.notificationTemplateRepository = null;
    this.notificationPreferenceRepository = null;

    // ===== Editor 模块 =====
    this.editorSessionRepository = null;
    this.linkedResourceRepository = null;
    this.searchEngineRepository = null;
    this.editorWorkspaceRepository = null;
    this.editorTabRepository = null;
    this.editorGroupRepository = null;
    this.documentVersionRepository = null;
    this.documentRepository = null;

    // ===== Authentication 模块 =====
    this.authSessionRepository = null;
    this.authCredentialRepository = null;

    // ===== Dashboard 模块 =====
    this.dashboardConfigRepository = null;

    // ===== AI 模块 =====
    this.aiGenerationTaskRepository = null;
    this.knowledgeGenerationTaskRepository = null;
    this.aiConversationRepository = null;
    this.aiUsageQuotaRepository = null;
    this.aiProviderConfigRepository = null;

    // ===== Account 模块 =====
    this.accountRepository = null;

    // ===== Sync 模块 =====
    this.syncConflictRepository = null;
    this.syncSessionRepository = null;
    this.syncProfileRepository = null;
    this.pendingChangeRepository = null;

    // ===== Setting 模块 =====
    this.appConfigRepository = null;
    this.settingRepository = null;
    this.userSettingRepository = null;
  }
}
