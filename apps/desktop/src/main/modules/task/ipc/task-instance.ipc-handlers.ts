/**
 * Task Instance IPC Handlers
 * 
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';

export class TaskInstanceIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  constructor() {
    super('TaskInstanceIPCHandler');
    this.taskService = new TaskDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    /**
     * @description 列出任务实例
     * Channel Name: task-instance:list
     * Payload: params (ListTaskInstancesInput)
     * Return: PaginatedResult<TaskInstance>
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:list', async (_, params) => {
      return this.handleRequest(
        'task-instance:list',
        () => this.taskService.listInstances(params),
        { accountUuid: params?.accountUuid },
      );
    });

    /**
     * @description 获取任务实例详情
     * Channel Name: task-instance:get
     * Payload: uuid (string)
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:get', async (_, uuid) => {
      return this.handleRequest(
        'task-instance:get',
        () => this.taskService.getInstance(uuid),
      );
    });

    /**
     * @description 删除任务实例
     * Channel Name: task-instance:delete
     * Payload: uuid (string)
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:delete', async (_, uuid) => {
      return this.handleRequest(
        'task-instance:delete',
        () => this.taskService.deleteInstance(uuid),
      );
    });

    /**
     * @description 完成任务实例
     * Channel Name: task-instance:complete
     * Payload: { uuid: string; completion?: any }
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:complete', async (_, payload: { uuid: string; completion?: any }) => {
      return this.handleRequest(
        'task-instance:complete',
        () => this.taskService.completeInstance(payload.uuid, payload.completion),
      );
    });

    /**
     * @description 取消完成任务实例
     * Channel Name: task-instance:uncomplete
     * Payload: uuid (string)
     * Return: TaskInstance | null
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:uncomplete', async (_, uuid) => {
      return this.handleRequest(
        'task-instance:uncomplete',
        async () => {
          // TODO: 实现 uncompleteInstance 方法
          return null;
        },
      );
    });

    /**
     * @description 重新调度任务实例
     * Channel Name: task-instance:reschedule
     * Payload: { uuid: string; newDate: any }
     * Return: TaskInstance | null
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:reschedule', async (_, payload: { uuid: string; newDate: any }) => {
      return this.handleRequest(
        'task-instance:reschedule',
        async () => {
          // TODO: 实现 rescheduleInstance 方法
          return null;
        },
      );
    });

    /**
     * @description 跳过任务实例
     * Channel Name: task-instance:skip
     * Payload: { uuid: string; reason?: string }
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:skip', async (_, payload: { uuid: string; reason?: string }) => {
      return this.handleRequest(
        'task-instance:skip',
        () => this.taskService.skipInstance(payload.uuid, payload.reason),
      );
    });

    /**
     * @description 开始任务实例（计时）
     * Channel Name: task-instance:start
     * Payload: uuid (string)
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:start', async (_, uuid) => {
      return this.handleRequest(
        'task-instance:start',
        () => this.taskService.startInstance(uuid),
      );
    });

    /**
     * @description 暂停任务实例
     * Channel Name: task-instance:pause
     * Payload: uuid (string)
     * Return: TaskInstance | null
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:pause', async (_, uuid) => {
      return this.handleRequest(
        'task-instance:pause',
        async () => {
          // TODO: 实现 pauseInstance 方法
          return null;
        },
      );
    });

    /**
     * @description 记录任务时间
     * Channel Name: task-instance:log-time
     * Payload: { uuid: string; duration: number; note?: string }
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:log-time', async (_, payload: { uuid: string; duration: number; note?: string }) => {
      return this.handleRequest(
        'task-instance:log-time',
        async () => {
          // TODO: 实现 logTime 方法
          return null;
        },
      );
    });

    /**
     * @description 按日期列出任务实例
     * Channel Name: task-instance:list-by-date
     * Payload: { date: number; accountUuid: string }
     * Return: TaskInstance[]
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:list-by-date', async (_, payload: { date: number; accountUuid: string }) => {
      return this.handleRequest(
        'task-instance:list-by-date',
        () => this.taskService.listInstancesByDate(payload.date, payload.accountUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    /**
     * @description 按日期范围列出任务实例
     * Channel Name: task-instance:list-by-range
     * Payload: { startDate: number; endDate: number; accountUuid: string }
     * Return: TaskInstance[]
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:list-by-range', async (_, payload: { startDate: number; endDate: number; accountUuid: string }) => {
      return this.handleRequest(
        'task-instance:list-by-range',
        () => this.taskService.listInstancesByDateRange(payload.accountUuid, payload.startDate, payload.endDate),
        { accountUuid: payload.accountUuid },
      );
    });

    /**
     * @description 按模板列出任务实例
     * Channel Name: task-instance:list-by-template
     * Payload: templateUuid (string)
     * Return: TaskInstance[]
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:list-by-template', async (_, templateUuid) => {
      return this.handleRequest(
        'task-instance:list-by-template',
        () => this.taskService.listInstancesByTemplate(templateUuid),
      );
    });

    /**
     * @description 批量更新任务实例
     * Channel Name: task-instance:batch-update
     * Payload: updates (any[])
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:batch-update', async (_, updates) => {
      return this.handleRequest(
        'task-instance:batch-update',
        async () => {
          // TODO: 实现 batchUpdateInstances 方法
          return null;
        },
      );
    });

    /**
     * @description 批量完成任务实例
     * Channel Name: task-instance:batch-complete
     * Payload: uuids (string[])
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-instance:batch-complete', async (_, uuids) => {
      return this.handleRequest(
        'task-instance:batch-complete',
        async () => {
          // TODO: 实现 batchCompleteInstances 方法
          return null;
        },
      );
    });

    this.logger.info('Registered Task Instance IPC handlers');
  }
}

export const taskInstanceIPCHandler = new TaskInstanceIPCHandler();

/**
 * @deprecated 使用 TaskInstanceIPCHandler 类代替
 * 此文件保留用于向后兼容，所有功能已迁移到 TaskInstanceIPCHandler 类
 */
export function registerTaskInstanceIpcHandlers(): void {
  // 处理器已在 TaskInstanceIPCHandler 构造时自动注册
}

