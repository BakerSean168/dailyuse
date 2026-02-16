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
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalRecordRepository,
  SqliteFocusModeRepository,
  SqliteFocusSessionRepository,
  SqliteWeightSnapshotRepository,
} from '../infrastructure-server';
import {
  GoalPolicy,
  GoalProgressCalculator,
  FocusSessionPolicy,
  FocusSessionStatisticsCalculator,
} from '../domain-server';
import {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  SearchGoals,
  ListGoalFolders,
  CreateGoalFolder,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
} from '../application-server';
import { createLogger } from '@dailyuse/utils';
import type { IGoalRepository } from '../domain-server';

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
  STATISTICS_GET: 'goal:statistics:get',
} as const;

const channels = Object.values(Ch);

export const GoalElectronModule: IElectronModule = {
  name: 'Goal',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Repositories
    const goalRepository = new SqliteGoalRepository(db);
    _goalRepository = goalRepository;
    const goalFolderRepository = new SqliteGoalFolderRepository(db);
    const goalRecordRepository = new SqliteGoalRecordRepository(db);
    const focusModeRepository = new SqliteFocusModeRepository(db);
    const focusSessionRepository = new SqliteFocusSessionRepository(db);
    const weightSnapshotRepository = new SqliteWeightSnapshotRepository(db);

    // 2. Domain Services
    const goalPolicy = new GoalPolicy();
    const goalProgressCalculator = new GoalProgressCalculator(goalRecordRepository);
    const focusSessionPolicy = new FocusSessionPolicy();
    const focusSessionStatisticsCalculator = new FocusSessionStatisticsCalculator();

    // 3. Application Services (Use Cases)
    const createGoal = new CreateGoal(goalRepository, goalPolicy);
    const getGoal = new GetGoal(goalRepository);
    const listGoals = new ListGoals(goalRepository);
    const updateGoal = new UpdateGoal(goalRepository, goalPolicy);
    const deleteGoal = new DeleteGoal(goalRepository, goalPolicy);
    const archiveGoal = new ArchiveGoal(goalRepository, goalPolicy);
    const activateGoal = new ActivateGoal(goalRepository, goalPolicy);
    const searchGoals = new SearchGoals(goalRepository);

    const listGoalFolders = new ListGoalFolders(goalFolderRepository);
    const createGoalFolder = new CreateGoalFolder(goalFolderRepository);
    const getGoalFolder = new GetGoalFolder(goalFolderRepository);
    const updateGoalFolder = new UpdateGoalFolder(goalFolderRepository);
    const deleteGoalFolder = new DeleteGoalFolder(goalFolderRepository);

    const addKeyResult = new AddGoalKeyResult(goalRepository, goalPolicy);
    const updateKeyResult = new UpdateGoalKeyResult(goalRepository, goalPolicy);
    const updateKeyResultProgress = new UpdateGoalKeyResultProgress(goalRepository, goalPolicy);
    const deleteKeyResult = new DeleteGoalKeyResult(goalRepository, goalPolicy);

    const addReview = new AddGoalReview(goalRepository, goalPolicy);

    // 4. IPC Handlers
    ipcMain.handle(Ch.LIST, (_, params) => listGoals.execute(params));
    ipcMain.handle(Ch.GET, (_, id) => getGoal.execute(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => createGoal.execute(dto, { identityId: dto.identityId }));
    ipcMain.handle(Ch.UPDATE, (_, dto) => updateGoal.execute(dto.id, dto));
    ipcMain.handle(Ch.DELETE, (_, id) => deleteGoal.execute(id));
    ipcMain.handle(Ch.ARCHIVE, (_, id) => archiveGoal.execute(id));
    ipcMain.handle(Ch.RESTORE, (_, id) => activateGoal.execute(id));
    ipcMain.handle(Ch.UPDATE_PROGRESS, (_, dto) =>
      updateKeyResultProgress.execute(dto.goalId, dto.keyResultId, dto.currentValue, dto.note),
    );

    ipcMain.handle(Ch.FOLDER_LIST, (_, params) => listGoalFolders.execute(params));
    ipcMain.handle(Ch.FOLDER_CREATE, (_, dto) => createGoalFolder.execute(dto.identityId, dto));
    ipcMain.handle(Ch.FOLDER_UPDATE, (_, dto) => updateGoalFolder.execute(dto.id, dto.identityId, dto));
    ipcMain.handle(Ch.FOLDER_DELETE, (_, dto) => deleteGoalFolder.execute(dto.id, dto.identityId));

    // Statistics: recalculate progress for a given goal
    ipcMain.handle(Ch.STATISTICS_GET, async (_, params) => {
      const goal = await goalRepository.findById(params.goalId);
      if (!goal) return null;
      return goalProgressCalculator.recalculateGoalProgress(goal, params.options);
    });

    logger.info('Goal module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    _goalRepository = null;
    logger.info('Goal module destroyed');
  },
};
