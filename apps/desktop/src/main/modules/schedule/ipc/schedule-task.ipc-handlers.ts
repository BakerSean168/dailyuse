/**
 * Schedule Task IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 * IPC 通道：调度任务 CRUD 和生命周期管理
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import type { CreateScheduleTaskRequest } from '@dailyuse/contracts/schedule';

export class ScheduleTaskIPCHandler extends BaseIPCHandler {
  private scheduleService: ScheduleDesktopApplicationService;

  constructor() {
    super('ScheduleTaskIPCHandler');
    this.scheduleService = new ScheduleDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建调度任务
    ipcMain.handle('schedule:task:create', async (_, payload: { accountUuid: string; input: CreateScheduleTaskRequest }) => {
      return this.handleRequest(
        'schedule:task:create',
        () => this.scheduleService.createTask(payload.accountUuid, payload.input),
        { accountUuid: payload.accountUuid },
      );
    });

    // 获取单个调度任务
    ipcMain.handle('schedule:task:get', async (_, uuid: string) => {
      return this.handleRequest(
        'schedule:task:get',
        () => this.scheduleService.getTask(uuid),
      );
    });

    // 列出调度任务
    ipcMain.handle(
      'schedule:task:list',
      async (
        _,
        params?: { accountUuid?: string; sourceModule?: string; sourceEntityId?: string },
      ) => {
        return this.handleRequest('schedule:task:list', () =>
          this.scheduleService.listTasks(params as any),
        );
      },
    );

    // 按源实体列出任务
    ipcMain.handle(
      'schedule:task:listBySourceEntity',
      async (_, sourceModule: string, sourceEntityId: string) => {
        return this.handleRequest('schedule:task:listBySourceEntity', () =>
          this.scheduleService.listTasksBySourceEntity(sourceModule, sourceEntityId),
        );
      },
    );

    // 更新调度任务
    ipcMain.handle(
      'schedule:task:update',
      async (
        _,
        uuid: string,
        updates: { description?: string; schedule?: { cronExpression?: string } },
      ) => {
        return this.handleRequest('schedule:task:update', () =>
          this.scheduleService.updateTask(uuid, updates),
        );
      },
    );

    // 删除调度任务
    ipcMain.handle('schedule:task:delete', async (_, uuid: string) => {
      return this.handleRequest('schedule:task:delete', () =>
        this.scheduleService.deleteTask(uuid),
      );
    });

    // 暂停任务
    ipcMain.handle('schedule:task:pause', async (_, uuid: string) => {
      return this.handleRequest('schedule:task:pause', () =>
        this.scheduleService.pauseTask(uuid),
      );
    });

    // 恢复任务
    ipcMain.handle('schedule:task:resume', async (_, uuid: string) => {
      return this.handleRequest('schedule:task:resume', () =>
        this.scheduleService.resumeTask(uuid),
      );
    });

    // 重新调度任务
    ipcMain.handle(
      'schedule:task:reschedule',
      async (_, uuid: string, newSchedule: { cronExpression?: string }) => {
        return this.handleRequest('schedule:task:reschedule', () =>
          this.scheduleService.rescheduleTask(uuid, newSchedule),
        );
      },
    );

    // 批量重新调度
    ipcMain.handle(
      'schedule:task:batchReschedule',
      async (_, tasks: Array<{ uuid: string; cronExpression: string }>) => {
        return this.handleRequest('schedule:task:batchReschedule', () =>
          this.scheduleService.batchReschedule(tasks),
        );
      },
    );

    // 查找到期任务
    ipcMain.handle('schedule:task:findDue', async (_, params?: { beforeTime?: number }) => {
      return this.handleRequest('schedule:task:findDue', () =>
        this.scheduleService.findDueTasks({
          beforeTime: params?.beforeTime ? new Date(params.beforeTime) : undefined,
        }),
      );
    });
  }
}

/**
 * 注册调度任务 IPC 通道（已弃用）
 *
 * @deprecated 使用 ScheduleTaskIPCHandler 类代替
 */
export function registerScheduleTaskIpcHandlers(): void {
  const handler = new ScheduleTaskIPCHandler();
  (global as any).scheduleTaskIPCHandler = handler;
}

/**
 * 注销调度任务 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterScheduleTaskIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
