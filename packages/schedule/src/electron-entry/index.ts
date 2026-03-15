/**
 * Schedule Module — Electron Entry Point.
 * 调度模块 — Electron 入口点。
 *
 * Self-contained schedule runtime assembly for Electron main process.
 * 调度模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using the ScheduleEventController.
 * 通过模块工厂实例化 PowerSync 仓储，并使用 ScheduleEventController 注册 IPC 处理器。
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
import { createScheduleRuntimeContribution } from '../api/runtime';
import { createLogger } from '@dailyuse/utils';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('ScheduleElectron');

const Ch = {
  LIST: 'schedule:list',
  LIST_BY_DATE_RANGE: 'schedule:list-by-date-range',
  GET: 'schedule:get',
  CREATE: 'schedule:create',
  UPDATE: 'schedule:update',
  DELETE: 'schedule:delete',
  COMPLETE: 'schedule:complete',
  CANCEL: 'schedule:cancel',
  RESCHEDULE: 'schedule:reschedule',
} as const;

const channels = Object.values(Ch);
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

    // 2. Controller (Zod validation + use case orchestration)
    // 2. 控制器（Zod 验证 + use case 编排）
    const eventController = new ScheduleEventController({
      scheduleEventService: scheduleModule.useCases.scheduleEventService,
      conflictDetectionService: scheduleModule.useCases.conflictDetectionService,
    });

    // 3. IPC Handlers
    // 3. IPC 处理器
    ipcMain.handle(Ch.LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(
          { startTime: 0, endTime: Number.MAX_SAFE_INTEGER, identityId: requestContext.identityId },
          requestContext,
        ),
      ),
    );
    ipcMain.handle(Ch.LIST_BY_DATE_RANGE, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(Ch.GET, (_event, id) => eventController.get(id));
    ipcMain.handle(Ch.CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.create(dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.UPDATE, (_event, id, dto) => eventController.update(id, dto));
    ipcMain.handle(Ch.DELETE, (_event, id) => eventController.delete(id));
    ipcMain.handle(Ch.COMPLETE, () => {
      throw new Error('schedule:complete is not supported for schedule events');
    });
    ipcMain.handle(Ch.CANCEL, () => {
      throw new Error('schedule:cancel is not supported for schedule events');
    });
    ipcMain.handle(Ch.RESCHEDULE, () => {
      throw new Error('schedule:reschedule is not supported for schedule events');
    });

    logger.info('Schedule module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeScheduleModule?.dispose();
    activeScheduleModule = null;
    logger.info('Schedule module destroyed');
  },
};
