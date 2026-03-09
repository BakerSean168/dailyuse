/**
 * Goal Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Goal module in Electron main process.
 * Instantiates SQLite repositories, domain services, application services,
 * and registers IPC handlers.
 *
 * @module goal/electron-entry
 */

import { ipcMain } from 'electron';
import { type IElectronModule, type IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  GoalModule,
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalRecordRepository,
  GoalContainer,
} from '../infrastructure-server/sqlite';
import { createLogger } from '@dailyuse/utils';
import type { IGoalRepository } from '../domain-server';
import type { Context } from '@dailyuse/contracts/shared';
import { GoalController } from '../controllers/goal.controller';
import { GoalFolderController } from '../controllers/goal-folder.controller';
import { withAuthenticatedValue } from './authenticated-ipc';
const logger = createLogger('GoalElectron');

/**
 * Module-scoped goal repository — set during register(), used by cross-module
 * event handlers (e.g. task-completion → goal-progress).
 */
let _goalRepository: IGoalRepository | null = null;

/** Returns the registered goal repository (throws if module not yet registered). */
export function getGoalRepository(): IGoalRepository {
  if (!_goalRepository) throw new Error('Goal module not registered yet');
  return _goalRepository;
}

/** IPC channel constants — aligned with apps/desktop/src/shared/types/ipc-channels.ts */
const Ch = {
  LIST: 'goal:list',
  GET: 'goal:get',
  CREATE: 'goal:create',
  UPDATE: 'goal:update',
  DELETE: 'goal:delete',
  ARCHIVE: 'goal:archive',
  RESTORE: 'goal:restore',
  UPDATE_PROGRESS: 'goal:update-progress',
  FOLDER_LIST: 'goal:folder:list',
  FOLDER_CREATE: 'goal:folder:create',
  FOLDER_UPDATE: 'goal:folder:update',
  FOLDER_DELETE: 'goal:folder:delete',
} as const;

const channels = Object.values(Ch);

export const GoalElectronModule: IElectronModule = {
  name: 'Goal',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Repositories
    const goalRepository = new SqliteGoalRepository(db);
    const goalFolderRepository = new SqliteGoalFolderRepository(db);
    const goalRecordRepository = new SqliteGoalRecordRepository(db);
    const goalModule = new GoalModule({
      goalRepository,
      goalFolderRepository,
      goalRecordRepository,
    });
    const goalController = new GoalController({
      createGoal: goalModule.createGoal,
      getGoal: goalModule.getGoal,
      listGoals: goalModule.listGoals,
      updateGoal: goalModule.updateGoal,
      deleteGoal: goalModule.deleteGoal,
      archiveGoal: goalModule.archiveGoal,
      activateGoal: goalModule.activateGoal,
      completeGoal: goalModule.completeGoal,
      searchGoals: goalModule.searchGoals,
      addKeyResult: goalModule.addKeyResult,
      updateKeyResult: goalModule.updateKeyResult,
      updateKeyResultProgress: goalModule.updateKeyResultProgress,
      deleteKeyResult: goalModule.deleteKeyResult,
      addReview: goalModule.addReview,
      listReviews: goalModule.listReviews,
      updateReview: goalModule.updateReview,
      deleteReview: goalModule.deleteReview,
      createRecord: goalModule.createRecord,
      listRecords: goalModule.listRecords,
      deleteRecord: goalModule.deleteRecord,
    });
    const goalFolderController = new GoalFolderController({
      createGoalFolder: goalModule.createGoalFolder,
      getGoalFolder: goalModule.getGoalFolder,
      listGoalFolders: goalModule.listGoalFolders,
      updateGoalFolder: goalModule.updateGoalFolder,
      deleteGoalFolder: goalModule.deleteGoalFolder,
    });
    _goalRepository = goalModule.goalRepository;

    // 4. IPC Handlers
    ipcMain.handle(Ch.LIST, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalController.list({ ...(params ?? {}), identityId: requestContext.identityId }),
      ),
    );
    ipcMain.handle(Ch.GET, (_event, id, includeChildren = true) =>
      goalController.get(id, includeChildren),
    );
    ipcMain.handle(Ch.CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalController.create(
          { ...dto, identityId: requestContext.identityId },
          requestContext as Context,
        ),
      ),
    );
    ipcMain.handle(Ch.UPDATE, (_, dto) => goalModule.updateGoal.execute(dto.id, dto));
    ipcMain.handle(Ch.DELETE, (_, id) => goalModule.deleteGoal.execute(id));
    ipcMain.handle(Ch.ARCHIVE, (_, id) => goalModule.archiveGoal.execute(id));
    ipcMain.handle(Ch.RESTORE, (_, id) => goalModule.activateGoal.execute(id));
    ipcMain.handle(Ch.UPDATE_PROGRESS, (_, dto) =>
      goalModule.updateKeyResultProgress.execute(
        dto.goalId,
        dto.keyResultId,
        dto.currentValue,
        dto.note,
      ),
    );
    ipcMain.handle(Ch.FOLDER_LIST, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalFolderController.list({ ...(params ?? {}), identityId: requestContext.identityId }),
      ),
    );
    ipcMain.handle(Ch.FOLDER_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalFolderController.create(dto, requestContext as Context),
      ),
    );
    ipcMain.handle(Ch.FOLDER_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalFolderController.update(id, dto, requestContext as Context),
      ),
    );
    ipcMain.handle(Ch.FOLDER_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalFolderController.delete(id, requestContext as Context),
      ),
    );

    logger.info('Goal module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    GoalContainer.getInstance().reset();
    _goalRepository = null;
    logger.info('Goal module destroyed');
  },
};
