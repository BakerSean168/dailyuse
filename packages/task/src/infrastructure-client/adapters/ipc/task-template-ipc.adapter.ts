/**
 * Task Template IPC Adapter
 *
 * IPC implementation of ITaskTemplateApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { ITaskTemplateApiClient, IResultIpcClient, TaskTemplateListParams } from '../types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
} from '@dailyuse/contracts/task';

export class TaskTemplateIpcAdapter implements ITaskTemplateApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:create', request);
  }

  async getTaskTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    return this.ipcClient.invoke('task:template:list', params);
  }

  async getTaskTemplateById(
    id: string,
    includeChildren = false,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:get', { id, includeChildren });
  }

  async updateTaskTemplate(
    id: string,
    request: UpdateTaskTemplateReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:update', { id, ...request });
  }

  async deleteTaskTemplate(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke('task:template:delete', { id });
  }

  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>> {
    return this.ipcClient.invoke('task:template:get-by-priority', { params });
  }

  async activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:restore', { id });
  }

  async pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:pause', { id });
  }

  async archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:archive', { id });
  }

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke('task:template:generate-instances', {
      templateId,
      request,
    });
  }

  async getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke('task:template:get-instances', {
      templateId,
      from,
      to,
    });
  }

  async bindToGoal(
    templateId: string,
    request: BindToGoalReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:bind-goal', {
      templateId,
      request,
    });
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke('task:template:unbind-goal', { templateId });
  }
}

export function createTaskTemplateIpcAdapter(ipcClient: IResultIpcClient): TaskTemplateIpcAdapter {
  return new TaskTemplateIpcAdapter(ipcClient);
}
