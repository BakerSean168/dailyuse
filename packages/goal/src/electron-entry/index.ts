/**
 * Goal Module — Electron Entry Point.
 * 目标模块 — Electron 入口点。
 *
 * Self-contained goal runtime assembly for Electron main process.
 * 目标模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using controllers.
 * 通过模块工厂实例化 PowerSync 仓储，并使用控制器注册 IPC 处理器。
 *
 * @module goal/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createGoalPowerSyncModule } from '../infrastructure-server/powersync';
import { GoalController } from '../controllers/goal.controller';
import { GoalFolderController } from '../controllers/goal-folder.controller';
import {
  createGoalTransportHandlers,
  createGoalFolderTransportHandlers,
} from '../api/transport-handlers';
import { createGoalRuntimeContribution } from '../api/runtime';
import { createLogger } from '@dailyuse/utils';
import type { IGoalRecordRepository, IGoalRepository } from '../domain-server';
import type { Context } from '@dailyuse/contracts/shared';
import type { GoalModuleInstance } from '../infrastructure-server';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('GoalElectron');

/**
 * Module-scoped goal repository — set during register(), used by cross-module
 * event handlers (e.g. task-completion → goal-progress).
 * 模块作用域的目标仓储 — 在 register() 时设置，供跨模块事件处理器使用。
 */
let _goalRepository: IGoalRepository | null = null;
let _goalRecordRepository: IGoalRecordRepository | null = null;

/** Returns the registered goal repository (throws if module not yet registered). */
export function getGoalRepository(): IGoalRepository {
  if (!_goalRepository) throw new Error('Goal module not registered yet');
  return _goalRepository;
}

export function getGoalRecordRepository(): IGoalRecordRepository {
  if (!_goalRecordRepository) throw new Error('Goal module not registered yet');
  return _goalRecordRepository;
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
  ACTIVATE: 'goal:activate',
  COMPLETE: 'goal:complete',
  SEARCH: 'goal:search',
  AGGREGATE: 'goal:aggregate',
  CLONE: 'goal:clone',
  FOLDER_GET: 'goal:folder:get',
  UPDATE_PROGRESS: 'goal:update-progress',
  KEY_RESULT_BATCH_UPDATE_WEIGHTS: 'goal:keyResult:batchUpdateWeights',
  FOLDER_LIST: 'goal:folder:list',
  FOLDER_CREATE: 'goal:folder:create',
  FOLDER_UPDATE: 'goal:folder:update',
  FOLDER_DELETE: 'goal:folder:delete',
} as const;

const channels = Object.values(Ch);
let activeGoalModule: GoalModuleInstance | null = null;

export const GoalElectronModule: IElectronModule = {
  name: 'Goal',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — PowerSync 适配器 + 运行时贡献
    const goalModule = createGoalPowerSyncModule(db);
    activeGoalModule = goalModule;
    goalModule.start();

    // Expose repositories for cross-module use
    // 暴露仓储供跨模块使用
    _goalRepository = goalModule.goalRepository;
    _goalRecordRepository = goalModule.goalRecordRepository;

    // 2. Controllers (Zod validation + use case orchestration)
    // 控制器（Zod 校验 + 用例编排）
    const goalController = new GoalController(createGoalTransportHandlers(goalModule.api));
    const goalFolderController = new GoalFolderController(
      createGoalFolderTransportHandlers(goalModule.api),
    );

    // 3. IPC Handlers — all mutating channels go through auth + controller validation.
    // IPC 处理器 — 所有变更通道都经过认证 + 控制器校验。
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
    // Issue #4 fix: route update through auth + controller validation
    // 问题 #4 修复：将更新操作路由到认证 + 控制器校验
    ipcMain.handle(Ch.UPDATE, async (_, dto) =>
      withAuthenticatedValue(ctx, async () => goalController.update(dto.id, dto)),
    );
    // Issue #4 fix: route delete through auth + controller validation
    // 问题 #4 修复：将删除操作路由到认证 + 控制器校验
    ipcMain.handle(Ch.DELETE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.delete(id)),
    );
    // Issue #4 fix: route archive through auth + controller validation
    // 问题 #4 修复：将归档操作路由到认证 + 控制器校验
    ipcMain.handle(Ch.ARCHIVE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.archive(id)),
    );
    // Issue #4 fix: route restore/activate through auth + controller validation
    // 问题 #4 修复：将恢复/激活操作路由到认证 + 控制器校验
    ipcMain.handle(Ch.RESTORE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.activate(id)),
    );
    ipcMain.handle(Ch.ACTIVATE, (_, id) => goalController.activate(id));
    ipcMain.handle(Ch.COMPLETE, (_, id) => goalController.complete(id));
    ipcMain.handle(Ch.SEARCH, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalController.search(String(params?.query ?? ''), requestContext),
      ),
    );
    ipcMain.handle(Ch.AGGREGATE, (_, id) => goalController.getAggregate(id));
    ipcMain.handle(Ch.CLONE, async (_event, goalId, params) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalController.cloneGoal(goalId, params ?? {}, requestContext),
      ),
    );
    // Issue #4 fix: route update-progress through auth + controller validation
    // 问题 #4 修复：将更新进度操作路由到认证 + 控制器校验
    ipcMain.handle(Ch.UPDATE_PROGRESS, async (_, dto) =>
      withAuthenticatedValue(ctx, async () =>
        goalController.updateKeyResultProgress(dto.goalId, dto.keyResultId, {
          newValue: dto.currentValue,
          note: dto.note,
        }),
      ),
    );
    ipcMain.handle(Ch.KEY_RESULT_BATCH_UPDATE_WEIGHTS, (_, goalId, request) =>
      goalController.batchUpdateKeyResultWeights(goalId, request?.updates ?? []),
    );
    ipcMain.handle(Ch.FOLDER_LIST, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: Context) =>
        goalFolderController.list({ ...(params ?? {}), identityId: requestContext.identityId }),
      ),
    );
    ipcMain.handle(Ch.FOLDER_GET, (_event, id) => goalFolderController.get(id));
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
    activeGoalModule?.dispose();
    activeGoalModule = null;
    _goalRepository = null;
    _goalRecordRepository = null;
    logger.info('Goal module destroyed');
  },
};
