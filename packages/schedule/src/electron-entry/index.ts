/**
 * Schedule Module — Electron Entry Point.
 * 调度模块 — Electron 入口点。
 *
 * Self-contained schedule runtime assembly for Electron main process.
 * 调度模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using the ScheduleEventController and ScheduleController.
 * 通过模块工厂实例化 PowerSync 仓储，并使用 ScheduleEventController 和 ScheduleController 注册 IPC 处理器。
 *
 * @module schedule/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  createScheduleModule,
  createScheduleUseCases,
  PowerSyncScheduleRepository,
  PowerSyncScheduleExecutionRepository,
  PowerSyncScheduleTaskRepository,
  type ScheduleModuleInstance,
} from '../infrastructure-server';
import { ScheduleEventController } from '../controllers/schedule-event.controller';
import { ScheduleController } from '../controllers/schedule.controller';
import { createScheduleRuntimeContribution } from '../api/runtime';
import { createScheduleEventTransportHandlers } from '../api/transport-handlers';
import { createLogger } from '@dailyuse/utils';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('ScheduleElectron');

// ═══════════ Channel Constants ═══════════

/** Schedule Event (calendar entry) channels */
const EventCh = {
  LIST: 'schedule:list',
  LIST_BY_DATE_RANGE: 'schedule:list-by-date-range',
  GET: 'schedule:get',
  CREATE: 'schedule:create',
  UPDATE: 'schedule:update',
  DELETE: 'schedule:delete',
  COMPLETE: 'schedule:complete',
  CANCEL: 'schedule:cancel',
  RESCHEDULE: 'schedule:reschedule',
  // Conflict Detection
  GET_CONFLICTS: 'schedule:get-conflicts',
  DETECT_CONFLICTS: 'schedule:detect-conflicts',
  CREATE_WITH_CONFLICT_DETECTION: 'schedule:create-with-conflict-detection',
  RESOLVE_CONFLICT: 'schedule:resolve-conflict',
} as const;

/** Schedule Task channels */
const TaskCh = {
  CREATE: 'schedule:task:create',
  CREATE_BATCH: 'schedule:task:create-batch',
  LIST: 'schedule:task:list',
  GET_BY_ID: 'schedule:task:get-by-id',
  GET_DUE: 'schedule:task:get-due',
  GET_BY_SOURCE: 'schedule:task:get-by-source',
  PAUSE: 'schedule:task:pause',
  RESUME: 'schedule:task:resume',
  COMPLETE: 'schedule:task:complete',
  CANCEL: 'schedule:task:cancel',
  DELETE: 'schedule:task:delete',
  DELETE_BATCH: 'schedule:task:delete-batch',
  UPDATE_METADATA: 'schedule:task:update-metadata',
} as const;

const allChannels = [...Object.values(EventCh), ...Object.values(TaskCh)];
let activeScheduleModule: ScheduleModuleInstance | null = null;

export const ScheduleElectronModule: IElectronModule = {
  name: 'Schedule',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — PowerSync repositories + runtime contribution
    // 1. 组合根 — PowerSync 仓储 + 运行时贡献
    const repos = {
      scheduleRepository: new PowerSyncScheduleRepository(db),
      scheduleExecutionRepository: new PowerSyncScheduleExecutionRepository(db),
      scheduleTaskRepository: new PowerSyncScheduleTaskRepository(db),
    };

    // Build use cases independently to break the chicken-and-egg cycle:
    // the runtime contribution needs use case references, but the module
    // constructor needs the runtime contribution.
    // 先独立构建 use case 以打破循环依赖：
    // 运行时贡献需要 use case 引用，而模块构造器需要运行时贡献。
    const useCases = createScheduleUseCases(repos);

    // Create the runtime contribution (ScheduleEventPublisher) with pre-built use cases.
    // The publisher listens for cross-module domain events (goal:create, task:create, etc.)
    // and creates/deletes/pauses/resumes schedule tasks accordingly.
    // 用预先构建的 use case 创建运行时贡献（ScheduleEventPublisher）。
    // 发布器监听跨模块领域事件（goal:create, task:create 等），
    // 并据此创建/删除/暂停/恢复调度任务。
    const runtimeContribution = createScheduleRuntimeContribution({
      createScheduleTask: useCases.createScheduleTask,
      listScheduleTasksBySource: useCases.listScheduleTasksBySource,
      deleteScheduleTask: useCases.deleteScheduleTask,
      pauseScheduleTask: useCases.pauseScheduleTask,
      resumeScheduleTask: useCases.resumeScheduleTask,
    });

    // Assemble the module with repos and runtime contribution.
    // createScheduleModule builds its own use cases internally — the pre-built
    // set above is only for wiring the runtime contribution.
    // 用仓储和运行时贡献组装模块。
    // createScheduleModule 内部会再构建一份 use case — 上面预构建的仅用于运行时贡献接线。
    const scheduleModule = createScheduleModule({
      ...repos,
      runtimeContributions: runtimeContribution,
    });
    activeScheduleModule = scheduleModule;
    scheduleModule.start();

    // 2. Controllers (Zod validation + use case orchestration)
    // 2. 控制器（Zod 验证 + use case 编排）
    const eventController = new ScheduleEventController({
      ...createScheduleEventTransportHandlers(scheduleModule.eventApi),
    });

    const taskController = new ScheduleController(scheduleModule.api);

    // ═══════════ 3. Schedule Event IPC Handlers ═══════════

    ipcMain.handle(EventCh.LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(
          { startTime: 0, endTime: Number.MAX_SAFE_INTEGER, identityId: requestContext.identityId },
          requestContext,
        ),
      ),
    );
    ipcMain.handle(EventCh.LIST_BY_DATE_RANGE, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(EventCh.GET, (_event, id) => eventController.get(id));
    ipcMain.handle(EventCh.CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.create(dto, requestContext),
      ),
    );
    ipcMain.handle(EventCh.UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async () => eventController.update(id, dto)),
    );
    ipcMain.handle(EventCh.DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async () => eventController.delete(id)),
    );
    ipcMain.handle(EventCh.COMPLETE, () => {
      throw new Error('schedule:complete is not supported for schedule events');
    });
    ipcMain.handle(EventCh.CANCEL, () => {
      throw new Error('schedule:cancel is not supported for schedule events');
    });
    ipcMain.handle(EventCh.RESCHEDULE, () => {
      throw new Error('schedule:reschedule is not supported for schedule events');
    });

    // ═══════════ Conflict Detection Handlers ═══════════

    ipcMain.handle(EventCh.GET_CONFLICTS, async (_event, id) =>
      withAuthenticatedValue(ctx, async () => eventController.getConflicts(id)),
    );
    ipcMain.handle(EventCh.DETECT_CONFLICTS, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.detectConflicts(params, requestContext),
      ),
    );
    ipcMain.handle(EventCh.CREATE_WITH_CONFLICT_DETECTION, async (_event, request) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.createWithConflictDetection(request, requestContext),
      ),
    );
    ipcMain.handle(EventCh.RESOLVE_CONFLICT, async (_event, scheduleId, request) =>
      withAuthenticatedValue(ctx, async () => eventController.resolveConflict(scheduleId, request)),
    );

    // ═══════════ 4. Schedule Task IPC Handlers ═══════════

    ipcMain.handle(TaskCh.CREATE, async (_event, request) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        taskController.createTask(request, requestContext),
      ),
    );
    ipcMain.handle(TaskCh.CREATE_BATCH, async (_event, tasks) =>
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
    ipcMain.handle(TaskCh.LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        taskController.listTasks({}, requestContext),
      ),
    );
    ipcMain.handle(TaskCh.GET_BY_ID, async (_event, taskId) =>
      withAuthenticatedValue(ctx, async () => taskController.getTask(taskId)),
    );
    ipcMain.handle(TaskCh.GET_DUE, async (_event, _params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        taskController.getDueTasks(requestContext),
      ),
    );
    ipcMain.handle(TaskCh.GET_BY_SOURCE, async (_event, sourceModule, sourceEntityId) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        taskController.listTasks({ sourceModule, sourceEntityId }, requestContext),
      ),
    );
    ipcMain.handle(TaskCh.PAUSE, async (_event, taskId) =>
      withAuthenticatedValue(ctx, async () => taskController.pauseTask(taskId)),
    );
    ipcMain.handle(TaskCh.RESUME, async (_event, taskId) =>
      withAuthenticatedValue(ctx, async () => taskController.resumeTask(taskId)),
    );
    ipcMain.handle(TaskCh.COMPLETE, async (_event, taskId) =>
      withAuthenticatedValue(ctx, async () => taskController.completeTask(taskId)),
    );
    ipcMain.handle(TaskCh.CANCEL, async (_event, taskId, reason) =>
      withAuthenticatedValue(ctx, async () => taskController.cancelTask(taskId, { reason })),
    );
    ipcMain.handle(TaskCh.DELETE, async (_event, taskId) =>
      withAuthenticatedValue(ctx, async () => taskController.deleteTask(taskId)),
    );
    ipcMain.handle(TaskCh.DELETE_BATCH, async (_event, taskIds) =>
      withAuthenticatedValue(ctx, async () => taskController.batchDeleteTasks({ taskIds })),
    );
    ipcMain.handle(TaskCh.UPDATE_METADATA, async (_event, taskId, metadata) =>
      withAuthenticatedValue(ctx, async () => taskController.updateTaskMetadata(taskId, metadata)),
    );

    logger.info('Schedule module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeScheduleModule?.dispose();
    activeScheduleModule = null;
    logger.info('Schedule module destroyed');
  },
};
