/**
 * 改进的 Task IPC 处理器示例
 * 展示如何使用新的基础设施进行错误处理、日志和性能监控
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import type { CreateTaskTemplateRequest } from '@dailyuse/contracts/task';

export class TaskIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  constructor() {
    super('TaskIPCHandler');
    this.taskService = new TaskDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    /**
     * @description 创建任务模板
     * Channel Name: task:create-template
     * Payload: input (CreateTaskTemplateInput)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task:create-template', async (event, input: CreateTaskTemplateRequest) => {
      return this.handleRequest(
        'task:create-template',
        () => this.taskService.createTemplate(input),
        { accountUuid: input.accountUuid },
      );
    });

    /**
     * @description 获取任务模板详情
     * Channel Name: task:get-template
     * Payload: uuid (string)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task:get-template', async (event, uuid: string) => {
      return this.handleRequest(
        'task:get-template',
        () => this.taskService.getTemplate(uuid),
      );
    });

    /**
     * @description 列出任务模板
     * Channel Name: task:list-templates
     * Payload: params (ListTaskTemplatesInput)
     * Return: TaskTemplate[]
     * Security: Requires authentication
     */
    ipcMain.handle('task:list-templates', async (event, params: any) => {
      return this.handleRequest(
        'task:list-templates',
        () => this.taskService.listTemplates(params),
        { accountUuid: params?.accountUuid },
      );
    });

    /**
     * @description 更新任务模板
     * Channel Name: task:update-template
     * Payload: uuid (string), updates (UpdateTaskTemplateInput)
     * Return: TaskTemplate
     * Security: Requires authentication
     */
    ipcMain.handle('task:update-template', async (event, uuid: string, updates: any) => {
      return this.handleRequest(
        'task:update-template',
        () => this.taskService.updateTemplate(uuid, updates),
      );
    });

    /**
     * @description 删除任务模板
     * Channel Name: task:delete-template
     * Payload: uuid (string)
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('task:delete-template', async (event, uuid: string) => {
      return this.handleRequest(
        'task:delete-template',
        () => this.taskService.deleteTemplate(uuid),
      );
    });

    /**
     * @description 获取任务实例详情
     * Channel Name: task:get-instance
     * Payload: uuid (string)
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task:get-instance', async (event, uuid: string) => {
      return this.handleRequest(
        'task:get-instance',
        () => this.taskService.getInstance(uuid),
      );
    });

    /**
     * @description 列出任务实例
     * Channel Name: task:list-instances
     * Payload: params (ListTaskInstancesInput)
     * Return: TaskInstance[]
     * Security: Requires authentication
     */
    ipcMain.handle('task:list-instances', async (event, params: any) => {
      return this.handleRequest(
        'task:list-instances',
        () => this.taskService.listInstances(params),
        { accountUuid: params?.accountUuid },
      );
    });

    /**
     * @description 完成任务实例
     * Channel Name: task:complete-instance
     * Payload: uuid (string)
     * Return: TaskInstance
     * Security: Requires authentication
     */
    ipcMain.handle('task:complete-instance', async (event, uuid: string) => {
      return this.handleRequest(
        'task:complete-instance',
        () => this.taskService.completeInstance(uuid),
      );
    });

    /**
     * @description 获取任务仪表板数据
     * Channel Name: task:get-dashboard
     * Payload: accountUuid (string)
     * Return: TaskDashboardData
     * Security: Requires authentication
     */
    ipcMain.handle('task:get-dashboard', async (event, accountUuid: string) => {
      return this.handleRequest(
        'task:get-dashboard',
        () => this.taskService.getDashboard(accountUuid),
        { accountUuid },
      );
    });

    this.logger.info(`Registered ${9} task IPC handlers`);
  }
}

// 导出单例
export const taskIPCHandler = new TaskIPCHandler();
