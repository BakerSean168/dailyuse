/**
 * Task Template IPC Adapter
 *
 * IPC implementation of ITaskTemplateApiClient for Electron desktop.
 * Uses Electron's contextBridge API for secure IPC communication.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  ITaskTemplateApiClient,
  IIpcClient,
} from '../types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
} from '@dailyuse/contracts/task';

/**
 * TaskTemplateIpcAdapter
 *
 * IPC 实现的任务模�?API 客户端（用于 Electron 桌面应用�?
 */
export class TaskTemplateIpcAdapter implements ITaskTemplateApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Task Template CRUD =====

  async createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:create', request));
  }

  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderId?: string;
    goalId?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:list', params));
  }

  async getTaskTemplateById(id: string, includeChildren = false): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:get', { id, includeChildren }));
  }

  async updateTaskTemplate(
    id: string,
    request: UpdateTaskTemplateReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:update', { id, ...request }));
  }

  async deleteTaskTemplate(id: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:delete', { id }));
  }

  // ===== 特殊查询方法 =====

  async getTasksWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplateClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:get-by-priority', { params }));
  }

  // ===== Task Template 状态管�?=====

  async activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:activate', { id }));
  }

  async pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:pause', { id }));
  }

  async archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:archive', { id }));
  }

  // ===== 聚合根控制：任务实例管理 =====

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:generate-instances', {
      templateId,
      request,
    }));
  }

  async getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:get-instances', {
      templateId,
      from,
      to,
    }));
  }

  // ===== 聚合根控制：目标关联管理 =====

  async bindToGoal(
    templateId: string,
    request: BindToGoalReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:bind-goal', {
      templateId,
      request,
    }));
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:template:unbind-goal', { templateId }));
  }
}

/**
 * Factory function to create TaskTemplateIpcAdapter
 */
export function createTaskTemplateIpcAdapter(ipcClient: IIpcClient): TaskTemplateIpcAdapter {
  return new TaskTemplateIpcAdapter(ipcClient);
}
