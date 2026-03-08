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
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
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
    _goalRepository = goalModule.goalRepository;

    // 4. IPC Handlers
    ipcMain.handle(Ch.LIST, (_, params) => goalModule.listGoals.execute(params));
    ipcMain.handle(Ch.GET, (_, id) => goalModule.getGoal.execute(id));
    ipcMain.handle(Ch.CREATE, (_, dto) =>
      goalModule.createGoal.execute(dto, {
        identityId: dto.identityId,
        deviceId: 'electron-app',
      } as Context),
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

    ipcMain.handle(Ch.FOLDER_LIST, (_, params) => goalModule.listGoalFolders.execute(params));
    ipcMain.handle(Ch.FOLDER_CREATE, (_, dto) =>
      goalModule.createGoalFolder.execute(dto.identityId, dto),
    );
    ipcMain.handle(Ch.FOLDER_UPDATE, (_, dto) =>
      goalModule.updateGoalFolder.execute(dto.id, dto.identityId, dto),
    );
    ipcMain.handle(Ch.FOLDER_DELETE, (_, dto) =>
      goalModule.deleteGoalFolder.execute(dto.id, dto.identityId),
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
