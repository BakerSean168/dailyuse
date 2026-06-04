/**
 * Data Portability API Module Definition
 *
 * Composition root: creates repositories, use cases, handlers, and routes.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils/logger';
import { ExportUserDataUseCase } from '../application-server/use-cases/export-user-data.use-case';
import { ImportUserDataUseCase } from '../application-server/use-cases/import-user-data.use-case';
import { PrismaDataPortabilityImportStore } from '../application-server/import-store/prisma-data-portability-import-store';
import type { DataPortabilityDependencies } from '../application-server/data-portability.dependencies';
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
} from '../application-server/prisma-adapters';
import { registerDataPortabilityRoutes } from './routes';
import { createDataPortabilityTransportHandlers } from './transport-handlers';

import { createGoalPrismaRepositories } from '@dailyuse/goal/api';
import { createTaskPrismaRepositories } from '@dailyuse/task/api';
import { createReminderPrismaRepositories } from '@dailyuse/reminder/api';
import { createNotificationPrismaRepositories } from '@dailyuse/notification/api';
import { createSettingPrismaRepository } from '@dailyuse/setting/api';

const logger = createLogger('DataPortabilityApi');

export type DataPortabilityApiModuleContext = ServerModuleContext<PrismaClient>;

export interface DataPortabilityApiModuleDef {
  readonly name: string;
  register(context: DataPortabilityApiModuleContext): void;
  destroy?(): void;
}

export const DataPortabilityApiModule: DataPortabilityApiModuleDef = {
  name: 'DataPortability',

  register(context) {
    const { router, middleware, db } = context;

    const goalRepos = createGoalPrismaRepositories(db);
    const taskRepos = createTaskPrismaRepositories(db);
    const reminderRepos = createReminderPrismaRepositories(db);
    const notificationRepos = createNotificationPrismaRepositories(db);
    const settingRepo = createSettingPrismaRepository(db);

    const deps: DataPortabilityDependencies = {
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

    const exportUseCase = new ExportUserDataUseCase(deps);
    const importUseCase = new ImportUserDataUseCase(new PrismaDataPortabilityImportStore(db));

    const handlers = createDataPortabilityTransportHandlers(exportUseCase, importUseCase);

    const routes = registerDataPortabilityRoutes(handlers, middleware, context.openApiRegistry);
    router.use('/data-portability', routes);

    logger.info('DataPortability module registered');
  },

  destroy() {
    logger.info('DataPortability module destroyed');
  },
};
