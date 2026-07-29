import type { PrismaClient } from '@memoflow/database';
import { PrismaDataPortabilityImportStore } from '../application/import-store/prisma-data-portability-import-store';
import type { DataPortabilityDependencies } from '../application/data-portability.dependencies';
import {
  PrismaFocusSessionAdapter,
  PrismaFocusModeAdapter,
  PrismaRepositoryAdapter,
  PrismaFolderAdapter,
  PrismaResourceAdapter,
  PrismaScheduleAdapter,
  PrismaScheduleTaskAdapter,
  PrismaEditorWorkspaceAdapter,
  PrismaEditorSessionAdapter,
  PrismaEditorGroupAdapter,
  PrismaEditorTabAdapter,
  PrismaAIConversationAdapter,
} from '../application/prisma-adapters';
import {
  createDataPortabilityModule,
  type DataPortabilityModuleInstance,
  type DataPortabilityModuleRuntimeContribution,
} from './data-portability.module';
import { createGoalPrismaRepositories } from '@memoflow/goal';
import { createTaskPrismaRepositories } from '@memoflow/task';
import { createReminderPrismaRepositories } from '@memoflow/reminder';
import { createNotificationPrismaRepositories } from '@memoflow/notification';
import { createSettingPrismaRepository } from '@memoflow/setting';

export interface CreateDataPortabilityPrismaModuleOptions {
  readonly runtimeContributions?:
    | DataPortabilityModuleRuntimeContribution
    | readonly DataPortabilityModuleRuntimeContribution[];
}

export function createPrismaDataPortabilityDependencies(
  db: PrismaClient,
): DataPortabilityDependencies {
  const goalRepos = createGoalPrismaRepositories(db);
  const taskRepos = createTaskPrismaRepositories(db);
  const reminderRepos = createReminderPrismaRepositories(db);
  const notificationRepos = createNotificationPrismaRepositories(db);
  const settingRepo = createSettingPrismaRepository(db);

  return {
    goalRepository: goalRepos.goalRepository,
    goalFolderRepository: goalRepos.goalFolderRepository,
    goalRecordRepository: goalRepos.goalRecordRepository,
    focusSessionRepository: new PrismaFocusSessionAdapter(db),
    focusModeRepository: new PrismaFocusModeAdapter(db),
    taskTemplateRepository: taskRepos.taskTemplateRepository,
    taskInstanceRepository: taskRepos.taskInstanceRepository,
    taskFolderRepository: taskRepos.taskFolderRepository,
    taskDependencyRepository: taskRepos.taskDependencyRepository,
    reminderTemplateRepository: reminderRepos.reminderTemplateRepository,
    reminderGroupRepository: reminderRepos.reminderGroupRepository,
    reminderResponseRepository: reminderRepos.reminderResponseRepository,
    userReminderPreferenceRepository: reminderRepos.userReminderPreferenceRepository,
    repositoryRepository: new PrismaRepositoryAdapter(db),
    folderRepository: new PrismaFolderAdapter(db),
    resourceRepository: new PrismaResourceAdapter(db),
    scheduleRepository: new PrismaScheduleAdapter(db),
    scheduleTaskRepository: new PrismaScheduleTaskAdapter(db),
    editorWorkspaceRepository: new PrismaEditorWorkspaceAdapter(db),
    editorSessionRepository: new PrismaEditorSessionAdapter(db),
    editorGroupRepository: new PrismaEditorGroupAdapter(db),
    editorTabRepository: new PrismaEditorTabAdapter(db),
    aiConversationRepository: new PrismaAIConversationAdapter(db),
    notificationPreferenceRepository: notificationRepos.notificationPreferenceRepository,
    settingRepository: settingRepo,
  };
}

export function createDataPortabilityPrismaModule(
  db: PrismaClient,
  options: CreateDataPortabilityPrismaModuleOptions = {},
): DataPortabilityModuleInstance {
  return createDataPortabilityModule({
    exportDependencies: createPrismaDataPortabilityDependencies(db),
    importStore: new PrismaDataPortabilityImportStore(db),
    runtimeContributions: options.runtimeContributions,
  });
}
