/**
 * Goal Electron Transport Module Factory
 * 目标 Electron 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `GoalModuleInstance` onto Electron's
 * `ipcMain` and owns that instance's start/dispose lifecycle.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `GoalModuleInstance` 挂到 Electron 的 `ipcMain` 上，
 * 并托管该实例的 start/dispose 生命周期。
 *
 * The host (apps/desktop) is responsible for composition: it selects the
 * PowerSync adapters, builds repositories, runtime contributions and the
 * Task-binding read port, calls `createGoalModule(...)`, and passes the
 * resulting instance in through `GoalElectronModuleOptions`. This factory never
 * reads `context.db`, never constructs repositories/use cases, and never starts
 * a runtime adapter.
 *
 * 宿主（apps/desktop）负责组合：选择 PowerSync 适配器、构建 repository、
 * runtime contribution 与 Task-binding read port、调用 `createGoalModule(...)`，
 * 再把组装结果通过 `GoalElectronModuleOptions` 传入。本工厂不读取
 * `context.db`，不创建 repository/use case，也不启动任何 runtime adapter。
 *
 * `instance.api` is the HTTP/IPC-shared application seam
 * (`GoalApplicationPort`). Both the Express API transport and this Electron IPC
 * transport consume the same port, so behaviour parity across hosts is
 * guaranteed by construction.
 *
 * `instance.api` 是 HTTP/IPC 共用的应用 seam（`GoalApplicationPort`）。
 * Express API 传输层与本 Electron IPC 传输层消费同一个 port，
 * 从而从构造上保证跨宿主行为一致。
 *
 * Per-handle state machine (`created -> registered | failed`, then any state
 * -> `disposed`):
 * - register(): only allowed from `created`. Builds the controllers from
 *   `instance.api`, registers all IPC handlers, then calls `instance.start()`
 *   — channel registration happens BEFORE start, so a handler-build failure
 *   leaves no runtime side effects. On success the handle moves to
 *   `registered`; a second register() throws. On any failure it reverses
 *   exactly the channels installed by THIS call, best-effort disposes the
 *   instance (logged if dispose itself throws), moves to `failed`, and
 *   rethrows the ORIGINAL error. A failed handle must not be re-registered.
 * - destroy(): always allowed and always idempotent. A handle in `failed` is
 *   a terminal no-op too: the instance was already disposed and the installed
 *   channels already removed by the register() failure path. For a live handle
 *   it first removes all goal channels, then sets the state to `disposed`
 *   BEFORE `instance.dispose()` runs, so a reentrant/retry destroy stays a
 *   no-op even if dispose throws (destroy may propagate that error).
 *
 * 每个 handle 的状态机（`created -> registered | failed`，之后任意状态 ->
 * `disposed`）：
 * - register()：仅允许从 `created` 进入。用 `instance.api` 构建 controller、
 *   注册全部 IPC handler，然后调用 `instance.start()`——handler 先于 start
 *   注册，因此 handler 注册失败不会留下任何 runtime 副作用。成功则进入
 *   `registered`，重复 register() 抛错；任何失败会逆向移除本次调用已安装的
 *   通道、best-effort dispose 实例（若 dispose 自身抛错则记录日志）、进入
 *   `failed` 并重新抛出原始错误。failed 的 handle 不得再次注册。
 * - destroy()：任何状态都允许，且始终幂等。处于 `failed` 的 handle 也是
 *   终态 no-op——其实例已 dispose、已安装通道也已在 register() 的失败路径中
 *   移除。对存活 handle，先移除全部目标通道，再把状态置为 `disposed` 之后再
 *   调用 `instance.dispose()`，因此即使 dispose 抛错（该错误可向外传播），
 *   重入/重试 destroy 仍为 no-op。
 *
 * The instance is owned by the factory closure, not by a package-level
 * singleton. Re-registering the returned module handle does not create a second
 * instance; the explicit state machine above is per-handle state.
 *
 * 实例由工厂闭包持有，而不是包级 singleton。重复注册返回的 module handle
 * 不会创建第二个实例；上述显式状态机即每个 handle 自己的状态。
 */

import { ipcMain } from 'electron';
import { ok } from '@memoflow/contracts/result';
import { GoalChannels, type IElectronModuleContext } from '@memoflow/contracts/electron';
import { createLogger } from '@memoflow/utils/logger';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { GoalModuleInstance } from '../server/infrastructure';
import { GoalController } from '../server/transport/goal.controller';
import { GoalFolderController } from '../server/transport/goal-folder.controller';
import {
  createGoalFolderTransportHandlers,
  createGoalTransportHandlers,
} from '../server/transport';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('GoalElectron');
const allChannels = Object.values(GoalChannels);

/**
 * Per-handle lifecycle state. Only 'created' may enter 'registered' (or
 * 'failed' on a registration error); any state may end in 'disposed'.
 *
 * 每个 handle 的生命周期状态。只有 'created' 可以进入 'registered'
 * （或注册失败时进入 'failed'）；任意状态都可以结束于 'disposed'。
 */
type ModuleHandleState = 'created' | 'registered' | 'disposed' | 'failed';

/**
 * Goal Electron module handle.
 * 目标 Electron 模块 handle。
 *
 * Structurally compatible with `IElectronModule` from
 * `@memoflow/contracts/electron`, but defined locally so this seam stays
 * host-shaped: the factory returns it already bound to one instance.
 *
 * 与 `@memoflow/contracts/electron` 的 `IElectronModule` 结构兼容，
 * 但在本地定义，使该 seam 保持宿主形状：工厂返回时已绑定到单个实例。
 */
export interface GoalElectronModuleDef {
  readonly name: string;
  register(context: IElectronModuleContext): void;
  destroy?(): void;
}

/**
 * Options carrying the already-assembled goal instance.
 * 携带已装配目标实例的选项。
 */
export interface GoalElectronModuleOptions {
  readonly instance: GoalModuleInstance;
}

/**
 * Creates the goal Electron transport module handle.
 * 创建目标 Electron 传输模块 handle。
 *
 * Turns an already-assembled `GoalModuleInstance` into an
 * `IElectronModule`-compatible handle. The handle is a transport adapter, not a
 * composition root: it only registers IPC channels and owns start/dispose
 * lifecycle. IPC channel names, payload schemas, controller methods and
 * response envelopes are unchanged — see the handler registrations below.
 *
 * 把已装配的 `GoalModuleInstance` 变成兼容 `IElectronModule` 的 handle。
 * 该 handle 是传输适配器而非组合根：只注册 IPC 通道并托管 start/dispose
 * 生命周期。IPC 通道名、payload schema、controller 方法与响应信封均保持不变——
 * 见下方各 handler 注册。
 *
 * @param options - Options carrying the assembled goal instance.
 * @returns An IElectronModule-compatible handle bound to the instance.
 */
export function createGoalElectronModule(
  options: GoalElectronModuleOptions,
): GoalElectronModuleDef {
  if (!options?.instance) {
    throw new Error('[FAIL-CLOSED] createGoalElectronModule requires options.instance');
  }
  let state: ModuleHandleState = 'created';

  return {
    name: 'Goal',

    register(ctx) {
      if (state !== 'created') {
        throw new Error(
          `GoalElectronModule.register() called while in '${state}' state; a handle may only register once from 'created'`,
        );
      }

      const installed: string[] = [];

      try {
        const goalController = new GoalController(
          createGoalTransportHandlers(options.instance.api),
        );
        const goalFolderController = new GoalFolderController(
          createGoalFolderTransportHandlers(options.instance.api),
        );

        ipcMain.handle(GoalChannels.LIST, async (_event, params) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            // Pass filters only - identityId is injected from requestContext inside controller
            goalController.list(params ?? {}, requestContext),
          ),
        );
        installed.push(GoalChannels.LIST);
        ipcMain.handle(GoalChannels.GET, async (_event, id, includeChildren = true) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.get(id, requestContext, includeChildren),
          ),
        );
        installed.push(GoalChannels.GET);
        ipcMain.handle(GoalChannels.CREATE, async (_event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.create(dto, requestContext),
          ),
        );
        installed.push(GoalChannels.CREATE);
        // Issue #4 fix: route update through auth + controller validation
        // 问题 #4 修复：将更新操作路由到认证 + 控制器校验
        ipcMain.handle(GoalChannels.UPDATE, async (_, id, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.update(id, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.UPDATE);
        // Issue #4 fix: route delete through auth + controller validation
        // 问题 #4 修复：将删除操作路由到认证 + 控制器校验
        ipcMain.handle(GoalChannels.DELETE, async (_, id, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.delete(id, request.expectedVersion, requestContext),
          ),
        );
        installed.push(GoalChannels.DELETE);
        ipcMain.handle(GoalChannels.ARCHIVE_EXPIRED, async () =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.archiveExpired(requestContext),
          ),
        );
        installed.push(GoalChannels.ARCHIVE_EXPIRED);
        // Issue #4 fix: route archive through auth + controller validation
        // 问题 #4 修复：将归档操作路由到认证 + 控制器校验
        ipcMain.handle(GoalChannels.ARCHIVE, async (_, id, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.archive(id, request.expectedVersion, requestContext),
          ),
        );
        installed.push(GoalChannels.ARCHIVE);
        ipcMain.handle(GoalChannels.ACTIVATE, async (_, id, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.activate(id, request.expectedVersion, requestContext),
          ),
        );
        installed.push(GoalChannels.ACTIVATE);
        ipcMain.handle(GoalChannels.COMPLETE, async (_, id, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.complete(id, request.expectedVersion, requestContext),
          ),
        );
        installed.push(GoalChannels.COMPLETE);
        ipcMain.handle(GoalChannels.SEARCH, async (_event, params) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.search(
              String(params?.query ?? ''),
              requestContext,
              typeof params?.systemView === 'string' ? params.systemView : undefined,
            ),
          ),
        );
        installed.push(GoalChannels.SEARCH);
        ipcMain.handle(GoalChannels.AGGREGATE, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.getAggregate(id, requestContext),
          ),
        );
        installed.push(GoalChannels.AGGREGATE);
        ipcMain.handle(GoalChannels.PROGRESS_BREAKDOWN, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.getProgressBreakdown(id, requestContext),
          ),
        );
        installed.push(GoalChannels.PROGRESS_BREAKDOWN);
        ipcMain.handle(GoalChannels.FOCUS_MODE_GET, async (_event) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
            logger.info('IPC 获取专注模式处理器', {
              identityId: requestContext.identityId,
            });
            return goalController.getCurrentFocusMode(requestContext);
          }),
        );
        installed.push(GoalChannels.FOCUS_MODE_GET);
        ipcMain.handle(GoalChannels.FOCUS_MODE_ACTIVATE, async (_event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
            logger.info('IPC 启用专注模式处理器', {
              identityId: requestContext.identityId,
              dto,
            });
            return goalController.activateFocusMode(dto, requestContext);
          }),
        );
        installed.push(GoalChannels.FOCUS_MODE_ACTIVATE);
        ipcMain.handle(GoalChannels.FOCUS_MODE_DEACTIVATE, async (_event) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
            logger.info('IPC 停用专注模式处理器', {
              identityId: requestContext.identityId,
            });
            return goalController.deactivateFocusMode(requestContext);
          }),
        );
        installed.push(GoalChannels.FOCUS_MODE_DEACTIVATE);
        ipcMain.handle(GoalChannels.FOCUS_MODE_EXTEND, async (_event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
            logger.info('IPC 延长专注模式处理器', {
              identityId: requestContext.identityId,
              dto,
            });
            return goalController.extendFocusMode(dto, requestContext);
          }),
        );
        installed.push(GoalChannels.FOCUS_MODE_EXTEND);
        ipcMain.handle(GoalChannels.CLONE, async (_event, goalId, params) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.cloneGoal(goalId, params ?? {}, requestContext),
          ),
        );
        installed.push(GoalChannels.CLONE);
        ipcMain.handle(GoalChannels.KEY_RESULT_ADD, async (_, goalId, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.addKeyResult(goalId, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.KEY_RESULT_ADD);
        ipcMain.handle(GoalChannels.KEY_RESULT_LIST, async (_, goalId) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.getKeyResults(goalId, requestContext),
          ),
        );
        installed.push(GoalChannels.KEY_RESULT_LIST);
        ipcMain.handle(GoalChannels.KEY_RESULT_UPDATE, async (_, goalId, keyResultId, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.updateKeyResult(goalId, keyResultId, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.KEY_RESULT_UPDATE);
        ipcMain.handle(GoalChannels.KEY_RESULT_DELETE, async (_, goalId, keyResultId, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.deleteKeyResult(goalId, keyResultId, request, requestContext),
          ),
        );
        installed.push(GoalChannels.KEY_RESULT_DELETE);
        ipcMain.handle(GoalChannels.KEY_RESULT_BATCH_UPDATE_WEIGHTS, async (_, goalId, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.batchUpdateKeyResultWeights(goalId, request, requestContext),
          ),
        );
        installed.push(GoalChannels.KEY_RESULT_BATCH_UPDATE_WEIGHTS);
        ipcMain.handle(GoalChannels.REVIEW_CREATE, async (_, goalId, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.addReview(goalId, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.REVIEW_CREATE);
        ipcMain.handle(GoalChannels.REVIEW_LIST, async (_, goalId) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.listReviews(goalId, requestContext),
          ),
        );
        installed.push(GoalChannels.REVIEW_LIST);
        ipcMain.handle(GoalChannels.REVIEW_UPDATE, async (_, goalId, reviewId, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.updateReview(goalId, reviewId, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.REVIEW_UPDATE);
        ipcMain.handle(GoalChannels.REVIEW_DELETE, async (_, goalId, reviewId, request) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.deleteReview(goalId, reviewId, request, requestContext),
          ),
        );
        installed.push(GoalChannels.REVIEW_DELETE);
        ipcMain.handle(GoalChannels.RECORD_CREATE, async (_, goalId, keyResultId, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.createRecord(goalId, keyResultId, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.RECORD_CREATE);
        ipcMain.handle(
          GoalChannels.RECORD_LIST_BY_KEY_RESULT,
          async (_, goalId, keyResultId, params) =>
            withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
              goalController.listRecordsByKeyResult(
                goalId,
                keyResultId,
                params ?? undefined,
                requestContext,
              ),
            ),
        );
        installed.push(GoalChannels.RECORD_LIST_BY_KEY_RESULT);
        ipcMain.handle(GoalChannels.RECORD_LIST_BY_GOAL, async (_, goalId, params) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalController.listRecordsByGoal(goalId, params ?? undefined, requestContext),
          ),
        );
        installed.push(GoalChannels.RECORD_LIST_BY_GOAL);
        ipcMain.handle(
          GoalChannels.RECORD_DELETE,
          async (_, goalId, keyResultId, recordId, request) =>
            withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
              return goalController.deleteRecord(
                goalId,
                keyResultId,
                recordId,
                request,
                requestContext,
              );
            }),
        );
        installed.push(GoalChannels.RECORD_DELETE);
        ipcMain.handle(GoalChannels.FOLDER_LIST, async (_event, params) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            // Pass filters only - identityId is injected from requestContext inside controller
            goalFolderController.list(params ?? {}, requestContext),
          ),
        );
        installed.push(GoalChannels.FOLDER_LIST);
        ipcMain.handle(GoalChannels.FOLDER_GET, async (_event, id) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalFolderController.get(id, requestContext),
          ),
        );
        installed.push(GoalChannels.FOLDER_GET);
        ipcMain.handle(GoalChannels.FOLDER_CREATE, async (_event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalFolderController.create(dto, requestContext),
          ),
        );
        installed.push(GoalChannels.FOLDER_CREATE);
        ipcMain.handle(GoalChannels.FOLDER_UPDATE, async (_event, id, dto) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) =>
            goalFolderController.update(id, dto, requestContext),
          ),
        );
        installed.push(GoalChannels.FOLDER_UPDATE);
        ipcMain.handle(GoalChannels.FOLDER_DELETE, async (_event, id) =>
          withAuthenticatedValue(ctx, async (requestContext: ExecutionContext) => {
            const result = await goalFolderController.delete(id, requestContext);
            if (!result.ok) return result;
            return ok(null);
          }),
        );
        installed.push(GoalChannels.FOLDER_DELETE);

        options.instance.start();
        state = 'registered';

        logger.info('Goal module registered');
      } catch (error) {
        state = 'failed';
        for (let i = installed.length - 1; i >= 0; i--) {
          ipcMain.removeHandler(installed[i]);
        }
        try {
          options.instance.dispose();
        } catch (disposeError) {
          logger.error(
            'GoalElectron: instance dispose failed during failed registration',
            disposeError,
          );
        }
        throw error;
      }
    },

    destroy() {
      if (state === 'disposed' || state === 'failed') {
        return;
      }

      for (const channel of allChannels) {
        ipcMain.removeHandler(channel);
      }
      state = 'disposed';

      options.instance.dispose();
      logger.info('Goal module destroyed');
    },
  };
}

export {
  createGoalPowerSyncScheduleExecutionSource,
  createGoalPowerSyncScheduleProjectionSource,
} from '../server/infrastructure';
