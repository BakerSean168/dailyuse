/**
 * Task Template IPC Handlers
 * 
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';

export class TaskTemplateIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  constructor() {
    super('TaskTemplateIPCHandler');
    this.taskService = new TaskDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    /**
     * @description 创建任务模板
     * Channel Name: task-template:create
     * Payload: payload (CreateTaskTemplateInput)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:create', async (_, payload) => {
      return this.handleRequest(
        'task-template:create',
        () => this.taskService.createTemplate(payload),
        { accountUuid: payload?.accountUuid },
      );
    });

    /**
     * @description 创建一次性任务
     * Channel Name: task-template:create-one-time
     * Payload: payload (CreateOneTimeTaskInput)
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:create-one-time', async (_, payload) => {
      return this.handleRequest(
        'task-template:create-one-time',
        () => this.taskService.createOneTimeTask(payload),
        { accountUuid: payload?.accountUuid },
      );
    });

    /**
     * @description 列出任务模板
     * Channel Name: task-template:list
     * Payload: params (ListTaskTemplatesInput)
     * Return: { templates: TaskTemplate[], total: number }
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:list', async (_, params) => {
      return this.handleRequest(
        'task-template:list',
        () => this.taskService.listTemplates(params),
        { accountUuid: params?.accountUuid },
      );
    });

    /**
     * @description 获取任务模板详情
     * Channel Name: task-template:get
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:get', async (_, uuid) => {
      return this.handleRequest(
        'task-template:get',
        () => this.taskService.getTemplate(uuid),
      );
    });

    /**
     * @description 更新任务模板
     * Channel Name: task-template:update
     * Payload: { uuid: string; request: UpdateTaskTemplateInput }
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:update', async (_, payload: { uuid: string; request: any }) => {
      return this.handleRequest(
        'task-template:update',
        () => this.taskService.updateTemplate(payload.uuid, payload.request),
      );
    });

    /**
     * @description 删除任务模板
     * Channel Name: task-template:delete
     * Payload: uuid (string)
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:delete', async (_, uuid) => {
      return this.handleRequest(
        'task-template:delete',
        () => this.taskService.deleteTemplate(uuid),
      );
    });

    /**
     * @description 激活任务模板
     * Channel Name: task-template:activate
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:activate', async (_, uuid) => {
      return this.handleRequest(
        'task-template:activate',
        () => this.taskService.activateTemplate(uuid),
      );
    });

    /**
     * @description 暂停任务模板
     * Channel Name: task-template:pause
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:pause', async (_, uuid) => {
      return this.handleRequest(
        'task-template:pause',
        () => this.taskService.pauseTemplate(uuid),
      );
    });

    /**
     * @description 归档任务模板
     * Channel Name: task-template:archive
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:archive', async (_, uuid) => {
      return this.handleRequest(
        'task-template:archive',
        () => this.taskService.archiveTemplate(uuid),
      );
    });

    /**
     * @description 恢复任务模板
     * Channel Name: task-template:restore
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:restore', async (_, uuid) => {
      return this.handleRequest(
        'task-template:restore',
        () => this.taskService.restoreTemplate(uuid),
      );
    });

    /**
     * @description 搜索任务模板
     * Channel Name: task-template:search
     * Payload: { query: string; limit?: number }
     * Return: { templates: TaskTemplate[]; total: number }
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:search', async (_, payload: { query: string; limit?: number }) => {
      return this.handleRequest(
        'task-template:search',
        async () => {
          // TODO: 实现搜索功能
          // 暂时返回空列表
          return { templates: [], total: 0 };
        },
      );
    });

    /**
     * @description 复制任务模板
     * Channel Name: task-template:duplicate
     * Payload: uuid (string)
     * Return: TaskTemplate | null
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:duplicate', async (_, uuid) => {
      return this.handleRequest(
        'task-template:duplicate',
        async () => {
          // TODO: 实现复制功能
          // 暂时返回空对象
          return null;
        },
      );
    });

    /**
     * @description 批量更新任务模板
     * Channel Name: task-template:batch-update
     * Payload: updates (any[])
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task-template:batch-update', async (_, updates) => {
      return this.handleRequest(
        'task-template:batch-update',
        () => this.taskService.batchUpdateTemplates(updates),
      );
    });

    this.logger.info('Registered Task Template IPC handlers');
  }
}

export const taskTemplateIPCHandler = new TaskTemplateIPCHandler();

/**
 * @deprecated 使用 TaskTemplateIPCHandler 类代替
 * 此文件保留用于向后兼容，所有功能已迁移到 TaskTemplateIPCHandler 类
 */
export function registerTaskTemplateIpcHandlers(): void {
  // 处理器已在 TaskTemplateIPCHandler 构造时自动注册
}
