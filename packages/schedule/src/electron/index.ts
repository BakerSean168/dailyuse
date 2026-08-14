/**
 * Schedule Electron Transport Module Factory
 * 日程 Electron 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `ScheduleModuleInstance` onto Electron's
 * `ipcMain` and owns that instance's start/dispose lifecycle. The desktop lane
 * deliberately delays the schedule runtime start until the main window is ready
 * — IPC transport registration and runtime start are separate concerns, and this
 * module exposes a bound runtime controller for the lifecycle owners
 * (WindowManager / DesktopProfileRuntimeManager) to drive.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `ScheduleModuleInstance` 挂到 Electron 的 `ipcMain` 上，
 * 并托管该实例的 start/dispose 生命周期。桌面 lane 刻意把 schedule runtime
 * 启动延迟到主窗口就绪——IPC 传输注册与 runtime 启动是两个独立关注点，本模块
 * 为生命周期所有者（WindowManager / DesktopProfileRuntimeManager）暴露一个
 * 绑定的 runtime controller 来驱动。
 *
 * The host (apps/desktop) is responsible for composition: it creates the
 * two-phase schedule repository set, the lease coordinator and the source
 * executor, calls `createScheduleModule(...)`, and passes the resulting
 * instance in through `ScheduleElectronModuleOptions`. This factory never reads
 * `ctx.db`, never constructs repositories/use cases, and never starts a runtime
 * adapter.
 *
 * 宿主（apps/desktop）负责组合：创建两阶段 schedule repository set、lease
 * coordinator 与 source executor、调用 `createScheduleModule(...)`，再把组装
 * 结果通过 `ScheduleElectronModuleOptions` 传入。本工厂不读取 `ctx.db`，
 * 不创建 repository/use case，也不启动任何 runtime adapter。
 *
 * `instance.api` / `instance.eventApi` are the HTTP/IPC-shared application
 * seams (`ScheduleApplicationPort` / `ScheduleEventApplicationPort`). Both the
 * Express API transport and this Electron IPC transport consume the same ports,
 * so behaviour parity across hosts is guaranteed by construction.
 *
 * `instance.api` / `instance.eventApi` 是 HTTP/IPC 共用的应用 seam
 * （`ScheduleApplicationPort` / `ScheduleEventApplicationPort`）。Express API
 * 传输层与本 Electron IPC 传输层消费同一组 port，从而从构造上保证跨宿主行为
 * 一致。
 *
 * Runtime controller: `runtime.start()` / `runtime.stop()` are idempotent
 * wrappers over `instance.start()` / `instance.dispose()`. They are the ONLY
 * way the schedule runtime is started/stopped in the desktop lane; profile
 * deactivation stops the same instance that a profile's module handle owns.
 *
 * Runtime controller：`runtime.start()` / `runtime.stop()` 是
 * `instance.start()` / `instance.dispose()` 的幂等封装。它们是桌面 lane 启动/
 * 停止 schedule runtime 的唯一途径；profile 停用会停止同一 profile 的 module
 * handle 所持有的同一实例。
 *
 * Per-handle state machine (`created -> registered | failed`, then any state
 * -> `disposed`):
 * - register(): only allowed from `created`. Builds the controllers from
 *   `instance.api` / `instance.eventApi`, registers all IPC handlers, then
 *   moves to `registered` WITHOUT starting the runtime (delayed start). A
 *   second register() throws. On any failure it reverses exactly the channels
 *   installed by THIS call, best-effort awaits instance dispose (no-op when the
 *   runtime was never started), moves to `failed`, and rethrows the ORIGINAL
 *   error. A failed handle must not be re-registered.
 * - destroy(): always allowed and always idempotent. A handle in `failed` is a
 *   terminal no-op too. For a live handle it first removes all schedule
 *   channels, then stops the runtime (idempotent) and marks the state
 *   `disposed` BEFORE `instance.dispose()` runs, so a reentrant/retry destroy
 *   stays a no-op even if dispose throws (destroy may propagate that error).
 *
 * 每个 handle 的状态机（`created -> registered | failed`，之后任意状态 ->
 * `disposed`）：
 * - register()：仅允许从 `created` 进入。用 `instance.api` / `instance.eventApi`
 *   构建 controller、注册全部 IPC handler，然后进入 `registered`，不启动
 *   runtime（延迟启动）。重复 register() 抛错；任何失败会逆向移除本次调用已
 *   安装的通道、best-effort await 实例 dispose（runtime 未启动时为 no-op）、
 *   进入 `failed` 并重新抛出原始错误。failed 的 handle 不得再次注册。
 * - destroy()：任何状态都允许，且始终幂等。处于 `failed` 的 handle 也是终态
 *   no-op。对存活 handle，先移除全部日程通道，再停止 runtime（幂等）并标记
 *   `disposed`，之后才调用 `instance.dispose()`，因此即使 dispose 抛错（该
 *   错误可向外传播），重入/重试 destroy 仍为 no-op。
 */

import { ipcMain } from 'electron';
import { ok } from '@memoflow/contracts/result';
import { ScheduleChannels, type IElectronModuleContext } from '@memoflow/contracts/electron';
import { createLogger } from '@memoflow/utils/logger';
import type { ScheduleModuleInstance } from '../server/infrastructure';
import { ScheduleController, ScheduleEventController } from '../server/transport';
import { withAuthenticatedValue } from './authenticated-ipc';

export { PowerSyncScheduleTaskRepository } from '../server/infrastructure';

const logger = createLogger('ScheduleElectron');

const allChannels = Object.values(ScheduleChannels);

/**
 * Per-handle lifecycle state. Only 'created' may enter 'registered' (or
 * 'failed' on a registration error); any state may end in 'disposed'.
 *
 * 每个 handle 的生命周期状态。只有 'created' 可以进入 'registered'
 * （或注册失败时进入 'failed'）；任意状态都可以结束于 'disposed'。
 */
type ModuleHandleState = 'created' | 'registered' | 'disposed' | 'failed';

/**
 * Schedule Electron module handle.
 * 日程 Electron 模块 handle。
 *
 * Structurally compatible with `IElectronModule` from
 * `@memoflow/contracts/electron`, but defined locally so this seam stays
 * host-shaped: the factory returns it already bound to one instance, plus the
 * bound runtime controller for the desktop delayed-start lifecycle.
 *
 * 与 `@memoflow/contracts/electron` 的 `IElectronModule` 结构兼容，
 * 但在本地定义，使该 seam 保持宿主形状：工厂返回时已绑定到单个实例，并附带
 * 桌面延迟启动生命周期所需的绑定 runtime controller。
 */
export interface ScheduleElectronModuleDef {
  readonly name: string;
  register(context: IElectronModuleContext): void;
  destroy?(): Promise<void> | void;
  /**
   * Bound schedule runtime controller (idempotent start/stop).
   * 绑定的 schedule runtime controller（幂等 start/stop）。
   */
  readonly runtime: {
    start(): Promise<void>;
    stop(): Promise<void>;
  };
}

/**
 * Options carrying the already-assembled schedule instance.
 * 携带已装配日程实例的选项。
 */
export interface ScheduleElectronModuleOptions {
  readonly instance: ScheduleModuleInstance;
}

/**
 * Creates the schedule Electron transport module handle.
 * 创建日程 Electron 传输模块 handle。
 *
 * Turns an already-assembled `ScheduleModuleInstance` into an
 * `IElectronModule`-compatible handle. The handle is a transport adapter, not a
 * composition root: it only registers IPC channels and owns start/dispose
 * lifecycle. IPC channel names, payload schemas, controller methods and
 * response envelopes are unchanged — see the handler registrations below. The
 * runtime controller returned alongside the handle is the sole schedule
 * start/stop owner in the desktop lane.
 *
 * 把已装配的 `ScheduleModuleInstance` 变成兼容 `IElectronModule` 的 handle。
 * 该 handle 是传输适配器而非组合根：只注册 IPC 通道并托管 start/dispose
 * 生命周期。IPC 通道名、payload schema、controller 方法与响应信封均保持
 * 不变——见下方各 handler 注册。与 handle 一起返回的 runtime controller 是
 * 桌面 lane 中 schedule 启停的唯一所有者。
 *
 * @param options - Options carrying the assembled schedule instance.
 * @returns An IElectronModule-compatible handle bound to the instance.
 */
export function createScheduleElectronModule(
  options: ScheduleElectronModuleOptions,
): ScheduleElectronModuleDef {
  if (!options?.instance) {
    throw new Error('[FAIL-CLOSED] createScheduleElectronModule requires options.instance');
  }
  let state: ModuleHandleState = 'created';
  let runtimeStarted = false;

  const runtime = {
    async start(): Promise<void> {
      if (runtimeStarted) {
        return;
      }
      await options.instance.start();
      runtimeStarted = true;
      logger.info('Schedule runtime started');
    },
    async stop(): Promise<void> {
      if (!runtimeStarted) {
        return;
      }
      await options.instance.dispose();
      runtimeStarted = false;
      logger.info('Schedule runtime stopped');
    },
  };

  return {
    name: 'Schedule',
    runtime,

    register(ctx: IElectronModuleContext): void {
      if (state !== 'created') {
        throw new Error(
          `ScheduleElectronModule.register() called while in '${state}' state; a handle may only register once from 'created'`,
        );
      }

      const installed: string[] = [];

      try {
        const eventController = new ScheduleEventController(options.instance.eventApi);
        const taskController = new ScheduleController(options.instance.api);

        ipcMain.handle(ScheduleChannels.LIST, async () =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.getByTimeRange(
              { startTime: 0, endTime: Number.MAX_SAFE_INTEGER },
              requestContext,
            ),
          ),
        );
        installed.push(ScheduleChannels.LIST);
        ipcMain.handle(ScheduleChannels.LIST_BY_DATE_RANGE, async (_event, params) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.getByTimeRange(params ?? {}, requestContext),
          ),
        );
        installed.push(ScheduleChannels.LIST_BY_DATE_RANGE);
        ipcMain.handle(ScheduleChannels.GET, async (_event, id) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.get(id, requestContext),
          ),
        );
        installed.push(ScheduleChannels.GET);
        ipcMain.handle(ScheduleChannels.CREATE, async (_event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.create(dto, requestContext),
          ),
        );
        installed.push(ScheduleChannels.CREATE);
        ipcMain.handle(ScheduleChannels.UPDATE, async (_event, id, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.update(id, dto, requestContext),
          ),
        );
        installed.push(ScheduleChannels.UPDATE);
        ipcMain.handle(ScheduleChannels.DELETE, async (_event, id, input) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const payload = typeof input === 'number' ? { expectedVersion: input } : input;
            const result = await eventController.delete(id, payload, requestContext);
            if (!result.ok) return result;
            return ok(null);
          }),
        );
        installed.push(ScheduleChannels.DELETE);
        ipcMain.handle(ScheduleChannels.GET_CONFLICTS, async (_event, id) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.getConflicts(id, requestContext),
          ),
        );
        installed.push(ScheduleChannels.GET_CONFLICTS);
        ipcMain.handle(ScheduleChannels.DETECT_CONFLICTS, async (_event, params) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.detectConflicts(params, requestContext),
          ),
        );
        installed.push(ScheduleChannels.DETECT_CONFLICTS);
        ipcMain.handle(ScheduleChannels.CREATE_WITH_CONFLICT_DETECTION, async (_event, request) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.createWithConflictDetection(request, requestContext),
          ),
        );
        installed.push(ScheduleChannels.CREATE_WITH_CONFLICT_DETECTION);
        ipcMain.handle(ScheduleChannels.RESOLVE_CONFLICT, async (_event, scheduleId, request) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            eventController.resolveConflict(scheduleId, request, requestContext),
          ),
        );
        installed.push(ScheduleChannels.RESOLVE_CONFLICT);

        ipcMain.handle(ScheduleChannels.TASK_CREATE, async (_event, request) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.createTask(request, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_CREATE);
        ipcMain.handle(ScheduleChannels.TASK_CREATE_BATCH, async (_event, tasks) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const createdTasks: unknown[] = [];
            for (const task of tasks) {
              const result = await taskController.createTask(task, requestContext);
              if (!result.ok) {
                return result;
              }
              createdTasks.push(result.data);
            }
            return createdTasks;
          }),
        );
        installed.push(ScheduleChannels.TASK_CREATE_BATCH);
        ipcMain.handle(ScheduleChannels.TASK_LIST, async () =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.listTasks({}, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_LIST);
        ipcMain.handle(ScheduleChannels.TASK_GET_BY_ID, async (_event, taskId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.getTask(taskId, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_GET_BY_ID);
        ipcMain.handle(ScheduleChannels.TASK_GET_DUE, async () =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.getDueTasks(requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_GET_DUE);
        ipcMain.handle(ScheduleChannels.TASK_GET_BY_SOURCE, async (_event, sourceModule, sourceEntityId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.listTasks({ sourceModule, sourceEntityId }, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_GET_BY_SOURCE);
        ipcMain.handle(ScheduleChannels.TASK_PAUSE, async (_event, taskId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.pauseTask(taskId, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_PAUSE);
        ipcMain.handle(ScheduleChannels.TASK_RESUME, async (_event, taskId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.resumeTask(taskId, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_RESUME);
        ipcMain.handle(ScheduleChannels.TASK_COMPLETE, async (_event, taskId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.completeTask(taskId, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_COMPLETE);
        ipcMain.handle(ScheduleChannels.TASK_CANCEL, async (_event, taskId, reason) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.cancelTask(taskId, { reason }, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_CANCEL);
        ipcMain.handle(ScheduleChannels.TASK_DELETE, async (_event, taskId) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await taskController.deleteTask(taskId, requestContext);
            if (!result.ok) return result;
            return ok(null);
          }),
        );
        installed.push(ScheduleChannels.TASK_DELETE);
        ipcMain.handle(ScheduleChannels.TASK_DELETE_BATCH, async (_event, taskIds) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.batchDeleteTasks({ taskIds }, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_DELETE_BATCH);
        ipcMain.handle(ScheduleChannels.TASK_UPDATE_METADATA, async (_event, taskId, metadata) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            taskController.updateTaskMetadata(taskId, metadata, requestContext),
          ),
        );
        installed.push(ScheduleChannels.TASK_UPDATE_METADATA);

        // Delayed runtime start: register() installs the IPC transport only;
        // the runtime controller starts the instance when the main window is
        // ready. No global accessor is imported or used here.
        // 延迟 runtime 启动：register() 只安装 IPC 传输；runtime controller
        // 在主窗口就绪时才启动实例。这里不引入也不使用任何全局 accessor。
        state = 'registered';
        logger.info('Schedule module registered');
      } catch (error) {
        state = 'failed';
        for (let i = installed.length - 1; i >= 0; i--) {
          ipcMain.removeHandler(installed[i]);
        }
        try {
          options.instance.dispose();
        } catch (disposeError) {
          logger.error(
            'ScheduleElectron: instance dispose failed during failed registration',
            disposeError,
          );
        }
        throw error;
      }
    },

    async destroy(): Promise<void> {
      if (state === 'disposed' || state === 'failed') {
        return;
      }

      for (const ch of allChannels) {
        ipcMain.removeHandler(ch);
      }
      state = 'disposed';

      await runtime.stop();
      logger.info('Schedule module destroyed');
    },
  };
}
