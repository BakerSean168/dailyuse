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
 * @module goal/electron
 */

import { ipcMain } from 'electron';
import {
  GoalChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import { createGoalPowerSyncModule } from '../server/infrastructure/powersync';
import { GoalController } from '../server/transport/goal.controller';
import { GoalFolderController } from '../server/transport/goal-folder.controller';
import {
  createGoalTransportHandlers,
  createGoalFolderTransportHandlers,
} from '../server/transport';
import { createGoalRuntimeContribution } from '../server/infrastructure/runtime';
import { registerGoalEventListeners } from '../server/application/event-handlers';
import { createLogger } from '@dailyuse/utils/logger';
import type { IGoalRecordRepository, IGoalRepository } from '../server/domain';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { GoalModuleInstance } from '../server/infrastructure';
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

const allChannels = Object.values(GoalChannels);
let activeGoalModule: GoalModuleInstance | null = null;
let goalEventListeners: { start(): void; stop(): void } | null = null;

export const GoalElectronModule: IElectronModule = {
  name: 'Goal',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — PowerSync 适配器 + 运行时贡献
    const goalModule = createGoalPowerSyncModule(db, {
      runtimeContributions: [createGoalRuntimeContribution()],
    });
    activeGoalModule = goalModule;
    goalModule.start();

    // Expose repositories for cross-module use
    // 暴露仓储供跨模块使用
    _goalRepository = goalModule.goalRepository;
    _goalRecordRepository = goalModule.goalRecordRepository;

    // Cross-module reaction: task 完成 → 更新关联 KR 进度（ADR-033 范式 A）。
    // 与 apps/api 挂载同一份 registerGoalEventListeners，随模块生命周期启停。
    goalEventListeners = registerGoalEventListeners(
      goalModule.goalRepository,
      goalModule.goalRecordRepository,
    );
    goalEventListeners.start();

    // 2. Controllers (Zod validation + use case orchestration)
    // 控制器（Zod 校验 + 用例编排）
    const goalController = new GoalController(createGoalTransportHandlers(goalModule.api));
    const goalFolderController = new GoalFolderController(
      createGoalFolderTransportHandlers(goalModule.api),
    );

    // 3. IPC Handlers — all mutating channels go through auth + controller validation.
    // IPC 处理器 — 所有变更通道都经过认证 + 控制器校验。
    ipcMain.handle(GoalChannels.LIST, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        // Pass filters only - identityId is injected from requestContext inside controller
        goalController.list(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(GoalChannels.GET, (_event, id, includeChildren = true) =>
      goalController.get(id, includeChildren),
    );
    ipcMain.handle(GoalChannels.CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalController.create(dto, requestContext as ExecutionContext),
      ),
    );
    // Issue #4 fix: route update through auth + controller validation
    // 问题 #4 修复：将更新操作路由到认证 + 控制器校验
    ipcMain.handle(GoalChannels.UPDATE, async (_, id, dto) =>
      withAuthenticatedValue(ctx, async () => goalController.update(id, dto)),
    );
    // Issue #4 fix: route delete through auth + controller validation
    // 问题 #4 修复：将删除操作路由到认证 + 控制器校验
    ipcMain.handle(GoalChannels.DELETE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.delete(id)),
    );
    ipcMain.handle(GoalChannels.ARCHIVE_EXPIRED, async () =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalController.archiveExpired(requestContext),
      ),
    );
    // Issue #4 fix: route archive through auth + controller validation
    // 问题 #4 修复：将归档操作路由到认证 + 控制器校验
    ipcMain.handle(GoalChannels.ARCHIVE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.archive(id)),
    );
    ipcMain.handle(GoalChannels.ACTIVATE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.activate(id)),
    );
    ipcMain.handle(GoalChannels.COMPLETE, async (_, id) =>
      withAuthenticatedValue(ctx, async () => goalController.complete(id)),
    );
    ipcMain.handle(GoalChannels.SEARCH, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalController.search(
          String(params?.query ?? ''),
          requestContext,
          typeof params?.systemView === 'string' ? params.systemView : undefined,
        ),
      ),
    );
    ipcMain.handle(GoalChannels.AGGREGATE, (_, id) => goalController.getAggregate(id));
    ipcMain.handle(GoalChannels.PROGRESS_BREAKDOWN, (_, id) => goalController.getProgressBreakdown(id));
    ipcMain.handle(GoalChannels.FOCUS_MODE_GET, async (_event) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
        logger.info('IPC 获取专注模式处理器', {
          identityId: requestContext.identityId,
        });
        return goalController.getCurrentFocusMode(requestContext);
      }),
    );
    ipcMain.handle(GoalChannels.FOCUS_MODE_ACTIVATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
        logger.info('IPC 启用专注模式处理器', {
          identityId: requestContext.identityId,
          dto,
        });
        return goalController.activateFocusMode(dto, requestContext);
      }),
    );
    ipcMain.handle(GoalChannels.FOCUS_MODE_DEACTIVATE, async (_event) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
        logger.info('IPC 停用专注模式处理器', {
          identityId: requestContext.identityId,
        });
        return goalController.deactivateFocusMode(requestContext);
      }),
    );
    ipcMain.handle(GoalChannels.FOCUS_MODE_EXTEND, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
        logger.info('IPC 延长专注模式处理器', {
          identityId: requestContext.identityId,
          dto,
        });
        return goalController.extendFocusMode(dto, requestContext);
      }),
    );
    ipcMain.handle(GoalChannels.CLONE, async (_event, goalId, params) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalController.cloneGoal(goalId, params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(GoalChannels.KEY_RESULT_ADD, async (_, goalId, dto) =>
      withAuthenticatedValue(ctx, async () => goalController.addKeyResult(goalId, dto)),
    );
    ipcMain.handle(GoalChannels.KEY_RESULT_LIST, async (_, goalId) =>
      withAuthenticatedValue(ctx, async () => goalController.getKeyResults(goalId)),
    );
    ipcMain.handle(GoalChannels.KEY_RESULT_UPDATE, async (_, goalId, keyResultId, dto) =>
      withAuthenticatedValue(ctx, async () =>
        goalController.updateKeyResult(goalId, keyResultId, dto),
      ),
    );
    ipcMain.handle(GoalChannels.KEY_RESULT_DELETE, async (_, goalId, keyResultId) =>
      withAuthenticatedValue(ctx, async () => goalController.deleteKeyResult(goalId, keyResultId)),
    );
    ipcMain.handle(GoalChannels.KEY_RESULT_BATCH_UPDATE_WEIGHTS, (_, goalId, request) =>
      goalController.batchUpdateKeyResultWeights(goalId, request?.updates ?? []),
    );
    ipcMain.handle(GoalChannels.REVIEW_CREATE, async (_, goalId, dto) =>
      withAuthenticatedValue(ctx, async () => goalController.addReview(goalId, dto)),
    );
    ipcMain.handle(GoalChannels.REVIEW_LIST, (_, goalId) => goalController.listReviews(goalId));
    ipcMain.handle(GoalChannels.REVIEW_UPDATE, async (_, goalId, reviewId, dto) =>
      withAuthenticatedValue(ctx, async () => goalController.updateReview(goalId, reviewId, dto)),
    );
    ipcMain.handle(GoalChannels.REVIEW_DELETE, async (_, goalId, reviewId) =>
      withAuthenticatedValue(ctx, async () => goalController.deleteReview(goalId, reviewId)),
    );
    ipcMain.handle(GoalChannels.RECORD_CREATE, async (_, goalId, keyResultId, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalController.createRecord(goalId, keyResultId, dto, requestContext),
      ),
    );
    ipcMain.handle(GoalChannels.RECORD_LIST_BY_KEY_RESULT, (_, goalId, keyResultId, params) =>
      goalController.listRecordsByKeyResult(goalId, keyResultId, params ?? undefined),
    );
    ipcMain.handle(GoalChannels.RECORD_LIST_BY_GOAL, (_, goalId, params) =>
      goalController.listRecordsByGoal(goalId, params ?? undefined),
    );
    ipcMain.handle(GoalChannels.RECORD_DELETE, async (_, _goalId, _keyResultId, recordId) =>
      withAuthenticatedValue(ctx, async () => goalController.deleteRecord(recordId)),
    );
    ipcMain.handle(GoalChannels.FOLDER_LIST, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        // Pass filters only - identityId is injected from requestContext inside controller
        goalFolderController.list(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(GoalChannels.FOLDER_GET, (_event, id) => goalFolderController.get(id));
    ipcMain.handle(GoalChannels.FOLDER_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalFolderController.create(dto, requestContext as ExecutionContext),
      ),
    );
    ipcMain.handle(GoalChannels.FOLDER_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalFolderController.update(id, dto, requestContext as ExecutionContext),
      ),
    );
    ipcMain.handle(GoalChannels.FOLDER_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
        goalFolderController.delete(id, requestContext as ExecutionContext),
      ),
    );

    logger.info('Goal module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    goalEventListeners?.stop();
    goalEventListeners = null;
    activeGoalModule?.dispose();
    activeGoalModule = null;
    _goalRepository = null;
    _goalRecordRepository = null;
    logger.info('Goal module destroyed');
  },
};

export {
  createGoalPowerSyncScheduleExecutionSource,
  createGoalPowerSyncScheduleProjectionSource,
} from '../server/infrastructure';
