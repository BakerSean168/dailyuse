/**
 * Repository Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞嗘墍鏈夋ā鍧楃殑 repository 瀹炰緥
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@/domain-server';
import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  ITaskDependencyRepository,
  ITaskStatisticsRepository,
} from '@dailyuse/task/domain-server';
import type {
  IGoalRepository,
  IGoalStatisticsRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IFocusModeRepository,
  IWeightSnapshotRepository,
} from '@dailyuse/goal/domain-server';
import type {
  IScheduleRepository,
  IScheduleTaskRepository,
  IScheduleExecutionRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/schedule/domain-server';
import type {
  IReminderResponseRepository,
  IReminderStatisticsRepository,
  IReminderGroupRepository,
  IReminderTemplateRepository,
} from '@dailyuse/reminder/domain-server';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/notification/domain-server';
import type {
  IEditorSessionRepository,
  ILinkedResourceRepository,
  ISearchEngineRepository,
  IEditorWorkspaceRepository,
  IEditorTabRepository,
  IEditorGroupRepository,
  IDocumentVersionRepository,
  IDocumentRepository,
} from '@dailyuse/editor/domain-server';
import type {
  IAuthSessionRepository,
  IAuthCredentialRepository,
} from '@dailyuse/authentication/domain-server';
import type {
  IDashboardConfigRepository,
} from '@dailyuse/dashboard/domain-server';
import type {
  IAIGenerationTaskRepository,
  IKnowledgeGenerationTaskRepository,
  IAIConversationRepository,
  IAIUsageQuotaRepository,
  IAIProviderConfigRepository,
} from '@dailyuse/ai/domain-server';
import type {
  IAccountRepository,
} from '@dailyuse/account/domain-server';
import type {
  ISyncConflictRepository,
  ISyncSessionRepository,
  ISyncProfileRepository,
  IPendingChangeRepository,
} from '@dailyuse/sync/domain-server';
import type {
  IAppConfigRepository,
  ISettingRepository,
  IUserSettingRepository,
} from '@dailyuse/setting/domain-server';

/**
 * All鏈夋ā鍧楃殑渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;

  // ===== Repository 妯″潡 =====
  private repositoryRepository: IRepositoryRepository | null = null;
  private resourceRepository: IResourceRepository | null = null;
  private folderRepository: IFolderRepository | null = null;
  private repositoryStatisticsRepository: IRepositoryStatisticsRepository | null = null;

  // ===== Task 妯″潡 =====
  private taskInstanceRepository: ITaskInstanceRepository | null = null;
  private taskTemplateRepository: ITaskTemplateRepository | null = null;
  private taskDependencyRepository: ITaskDependencyRepository | null = null;
  private taskStatisticsRepository: ITaskStatisticsRepository | null = null;

  // ===== Goal 妯″潡 =====
  private goalRepository: IGoalRepository | null = null;
  private goalStatisticsRepository: IGoalStatisticsRepository | null = null;
  private goalFolderRepository: IGoalFolderRepository | null = null;
  private focusSessionRepository: IFocusSessionRepository | null = null;
  private focusModeRepository: IFocusModeRepository | null = null;
  private weightSnapshotRepository: IWeightSnapshotRepository | null = null;

  // ===== Schedule 妯″潡 =====
  private scheduleRepository: IScheduleRepository | null = null;
  private scheduleTaskRepository: IScheduleTaskRepository | null = null;
  private scheduleExecutionRepository: IScheduleExecutionRepository | null = null;
  private scheduleStatisticsRepository: IScheduleStatisticsRepository | null = null;

  // ===== Reminder 妯″潡 =====
  private reminderRepository: IReminderGroupRepository | null = null;
  private reminderResponseRepository: IReminderResponseRepository | null = null;
  private reminderStatisticsRepository: IReminderStatisticsRepository | null = null;
  private reminderGroupRepository: IReminderGroupRepository | null = null;
  private reminderTemplateRepository: IReminderTemplateRepository | null = null;

  // ===== Notification 妯″潡 =====
  private notificationRepository: INotificationRepository | null = null;
  private notificationTemplateRepository: INotificationTemplateRepository | null = null;
  private notificationPreferenceRepository: INotificationPreferenceRepository | null = null;

  // ===== Editor 妯″潡 =====
  private editorSessionRepository: IEditorSessionRepository | null = null;
  private linkedResourceRepository: ILinkedResourceRepository | null = null;
  private searchEngineRepository: ISearchEngineRepository | null = null;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;
  private editorTabRepository: IEditorTabRepository | null = null;
  private editorGroupRepository: IEditorGroupRepository | null = null;
  private documentVersionRepository: IDocumentVersionRepository | null = null;
  private documentRepository: IDocumentRepository | null = null;

  // ===== Authentication 妯″潡 =====
  private authSessionRepository: IAuthSessionRepository | null = null;
  private authCredentialRepository: IAuthCredentialRepository | null = null;

  // ===== Dashboard 妯″潡 =====
  private dashboardConfigRepository: IDashboardConfigRepository | null = null;

  // ===== AI 妯″潡 =====
  private aiGenerationTaskRepository: IAIGenerationTaskRepository | null = null;
  private knowledgeGenerationTaskRepository: IKnowledgeGenerationTaskRepository | null = null;
  private aiConversationRepository: IAIConversationRepository | null = null;
  private aiUsageQuotaRepository: IAIUsageQuotaRepository | null = null;
  private aiProviderConfigRepository: IAIProviderConfigRepository | null = null;

  // ===== Account 妯″潡 =====
  private accountRepository: IAccountRepository | null = null;

  // ===== Sync 妯″潡 =====
  private syncConflictRepository: ISyncConflictRepository | null = null;
  private syncSessionRepository: ISyncSessionRepository | null = null;
  private syncProfileRepository: ISyncProfileRepository | null = null;
  private pendingChangeRepository: IPendingChangeRepository | null = null;

  // ===== Setting 妯″潡 =====
  private appConfigRepository: IAppConfigRepository | null = null;
  private settingRepository: ISettingRepository | null = null;
  private userSettingRepository: IUserSettingRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    RepositoryContainer.instance = new RepositoryContainer();
  }

  // ===== Repository 妯″潡 =====

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

  // ===== Task 妯″潡 =====

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

  // ===== Goal 妯″潡 =====

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

  // ===== Schedule 妯″潡 =====

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

  // ===== Reminder 妯″潡 =====

  registerReminderRepository(repository: IReminderGroupRepository): this {
    this.reminderRepository = repository;
    return this;
  }

  getReminderRepository(): IReminderGroupRepository {
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

  // ===== Notification 妯″潡 =====

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

  // ===== Editor 妯″潡 =====

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

  // ===== Authentication 妯″潡 =====

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

  // ===== Dashboard 妯″潡 =====

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

  // ===== AI 妯″潡 =====

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

  // ===== Account 妯″潡 =====

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

  // ===== Sync 妯″潡 =====

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

  // ===== Setting 妯″潡 =====

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

  // ===== 鍒悕鏂规硶锛堝吋瀹规€э級 =====

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
    // ===== Repository 妯″潡 =====
    this.repositoryRepository = null;
    this.resourceRepository = null;
    this.folderRepository = null;
    this.repositoryStatisticsRepository = null;

    // ===== Task 妯″潡 =====
    this.taskInstanceRepository = null;
    this.taskTemplateRepository = null;
    this.taskDependencyRepository = null;
    this.taskStatisticsRepository = null;

    // ===== Goal 妯″潡 =====
    this.goalRepository = null;
    this.goalStatisticsRepository = null;
    this.goalFolderRepository = null;
    this.focusSessionRepository = null;
    this.focusModeRepository = null;
    this.weightSnapshotRepository = null;

    // ===== Schedule 妯″潡 =====
    this.scheduleRepository = null;
    this.scheduleTaskRepository = null;
    this.scheduleExecutionRepository = null;
    this.scheduleStatisticsRepository = null;

    // ===== Reminder 妯″潡 =====
    this.reminderRepository = null;
    this.reminderResponseRepository = null;
    this.reminderStatisticsRepository = null;
    this.reminderGroupRepository = null;
    this.reminderTemplateRepository = null;

    // ===== Notification 妯″潡 =====
    this.notificationRepository = null;
    this.notificationTemplateRepository = null;
    this.notificationPreferenceRepository = null;

    // ===== Editor 妯″潡 =====
    this.editorSessionRepository = null;
    this.linkedResourceRepository = null;
    this.searchEngineRepository = null;
    this.editorWorkspaceRepository = null;
    this.editorTabRepository = null;
    this.editorGroupRepository = null;
    this.documentVersionRepository = null;
    this.documentRepository = null;

    // ===== Authentication 妯″潡 =====
    this.authSessionRepository = null;
    this.authCredentialRepository = null;

    // ===== Dashboard 妯″潡 =====
    this.dashboardConfigRepository = null;

    // ===== AI 妯″潡 =====
    this.aiGenerationTaskRepository = null;
    this.knowledgeGenerationTaskRepository = null;
    this.aiConversationRepository = null;
    this.aiUsageQuotaRepository = null;
    this.aiProviderConfigRepository = null;

    // ===== Account 妯″潡 =====
    this.accountRepository = null;

    // ===== Sync 妯″潡 =====
    this.syncConflictRepository = null;
    this.syncSessionRepository = null;
    this.syncProfileRepository = null;
    this.pendingChangeRepository = null;

    // ===== Setting 妯″潡 =====
    this.appConfigRepository = null;
    this.settingRepository = null;
    this.userSettingRepository = null;
  }
}


