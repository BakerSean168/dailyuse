/**
 * Schedule module Electron seam.
 *
 * Owns desktop-main registration for the schedule runtime.
 */

import { ipcMain } from 'electron';
import {
  ScheduleChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import { createLogger } from '@dailyuse/utils/logger';
import type { ScheduleTaskSourceExecutor } from '../server/application';
import {
  createScheduleModule,
  createSchedulePowerSyncRepositories,
  createScheduleRuntimeContribution,
  type ScheduleModuleInstance,
} from '../server/infrastructure';
import type { IScheduleRepository, IScheduleTaskRepository, ScheduleTask } from '../server/domain';
import { ScheduleController, ScheduleEventController } from '../server/transport';
import { withAuthenticatedValue } from './authenticated-ipc';

export { PowerSyncScheduleTaskRepository } from '../server/infrastructure';

const logger = createLogger('ScheduleElectron');

const allChannels = Object.values(ScheduleChannels);
let activeScheduleModule: ScheduleModuleInstance | null = null;
let runtimeStarted = false;

export interface CreateScheduleElectronModuleOptions {
  readonly sourceExecutor?: ScheduleTaskSourceExecutor;
  readonly shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>;
}

export function getScheduleRepository(): IScheduleRepository {
  if (!activeScheduleModule) {
    throw new Error('Schedule module not registered yet');
  }

  return activeScheduleModule.scheduleRepository;
}

export function getScheduleTaskRepository(): IScheduleTaskRepository {
  if (!activeScheduleModule) {
    throw new Error('Schedule module not registered yet');
  }

  return activeScheduleModule.scheduleTaskRepository;
}

export async function startScheduleRuntime(): Promise<void> {
  if (!activeScheduleModule || runtimeStarted) {
    return;
  }

  await activeScheduleModule.start();
  runtimeStarted = true;
  logger.info('Schedule runtime started');
}

export function stopScheduleRuntime(): void {
  if (!activeScheduleModule || !runtimeStarted) {
    return;
  }

  activeScheduleModule.dispose();
  runtimeStarted = false;
  logger.info('Schedule runtime stopped');
}

export function createScheduleElectronModule(
  options: CreateScheduleElectronModuleOptions = {},
): IElectronModule {
  return {
    name: 'Schedule',

    register(ctx: IElectronModuleContext): void {
      const repositories = createSchedulePowerSyncRepositories(ctx.db);
      const scheduleModule = createScheduleModule({
        ...repositories,
        runtimeContributions: createScheduleRuntimeContribution({
          scheduleTaskRepository: repositories.scheduleTaskRepository,
          shouldScheduleTask: options.shouldScheduleTask,
          sourceExecutor:
            options.sourceExecutor ??
            {
              async execute(task) {
                throw new Error(`No schedule source executor configured for ${task.sourceModule}`);
              },
            },
        }),
      });

      activeScheduleModule = scheduleModule;

      const eventController = new ScheduleEventController(scheduleModule.eventApi);
      const taskController = new ScheduleController(scheduleModule.api);

      ipcMain.handle(ScheduleChannels.LIST, async () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          eventController.getByTimeRange(
            { startTime: 0, endTime: Number.MAX_SAFE_INTEGER },
            requestContext,
          ),
        ),
      );
      ipcMain.handle(ScheduleChannels.LIST_BY_DATE_RANGE, async (_event, params) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          eventController.getByTimeRange(params ?? {}, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.GET, (_event, id) => eventController.get(id));
      ipcMain.handle(ScheduleChannels.CREATE, async (_event, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          eventController.create(dto, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.UPDATE, async (_event, id, dto) =>
        withAuthenticatedValue(ctx, async () => eventController.update(id, dto)),
      );
      ipcMain.handle(ScheduleChannels.DELETE, async (_event, id) =>
        withAuthenticatedValue(ctx, async () => eventController.delete(id)),
      );
      ipcMain.handle(ScheduleChannels.GET_CONFLICTS, async (_event, id) =>
        withAuthenticatedValue(ctx, async () => eventController.getConflicts(id)),
      );
      ipcMain.handle(ScheduleChannels.DETECT_CONFLICTS, async (_event, params) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          eventController.detectConflicts(params, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.CREATE_WITH_CONFLICT_DETECTION, async (_event, request) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          eventController.createWithConflictDetection(request, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.RESOLVE_CONFLICT, async (_event, scheduleId, request) =>
        withAuthenticatedValue(ctx, async () =>
          eventController.resolveConflict(scheduleId, request),
        ),
      );

      ipcMain.handle(ScheduleChannels.TASK_CREATE, async (_event, request) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          taskController.createTask(request, requestContext),
        ),
      );
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
      ipcMain.handle(ScheduleChannels.TASK_LIST, async () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          taskController.listTasks({}, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.TASK_GET_BY_ID, async (_event, taskId) =>
        withAuthenticatedValue(ctx, async () => taskController.getTask(taskId)),
      );
      ipcMain.handle(ScheduleChannels.TASK_GET_DUE, async () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          taskController.getDueTasks(requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.TASK_GET_BY_SOURCE, async (_event, sourceModule, sourceEntityId) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          taskController.listTasks({ sourceModule, sourceEntityId }, requestContext),
        ),
      );
      ipcMain.handle(ScheduleChannels.TASK_PAUSE, async (_event, taskId) =>
        withAuthenticatedValue(ctx, async () => taskController.pauseTask(taskId)),
      );
      ipcMain.handle(ScheduleChannels.TASK_RESUME, async (_event, taskId) =>
        withAuthenticatedValue(ctx, async () => taskController.resumeTask(taskId)),
      );
      ipcMain.handle(ScheduleChannels.TASK_COMPLETE, async (_event, taskId) =>
        withAuthenticatedValue(ctx, async () => taskController.completeTask(taskId)),
      );
      ipcMain.handle(ScheduleChannels.TASK_CANCEL, async (_event, taskId, reason) =>
        withAuthenticatedValue(ctx, async () => taskController.cancelTask(taskId, { reason })),
      );
      ipcMain.handle(ScheduleChannels.TASK_DELETE, async (_event, taskId) =>
        withAuthenticatedValue(ctx, async () => taskController.deleteTask(taskId)),
      );
      ipcMain.handle(ScheduleChannels.TASK_DELETE_BATCH, async (_event, taskIds) =>
        withAuthenticatedValue(ctx, async () => taskController.batchDeleteTasks({ taskIds })),
      );
      ipcMain.handle(ScheduleChannels.TASK_UPDATE_METADATA, async (_event, taskId, metadata) =>
        withAuthenticatedValue(ctx, async () =>
          taskController.updateTaskMetadata(taskId, metadata),
        ),
      );

      logger.info('Schedule module registered');
    },

    destroy(): void {
      for (const ch of allChannels) {
        ipcMain.removeHandler(ch);
      }
      stopScheduleRuntime();
      activeScheduleModule = null;
      logger.info('Schedule module destroyed');
    },
  };
}

export const ScheduleElectronModule: IElectronModule = createScheduleElectronModule();
