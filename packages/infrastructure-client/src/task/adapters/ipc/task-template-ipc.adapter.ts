/**
 * Task Template IPC Adapter
 *
 * IPC implementation of ITaskTemplateApiClient for Electron desktop.
 * Uses Electron's contextBridge API for secure IPC communication.
 */

import type { ITaskTemplateApiClient } from '../../ports/task-template-api-client.port';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
} from '@dailyuse/contracts/task';
import type { ElectronAPI } from '../../../shared/ipc-client.types';

/**
 * TaskTemplateIpcAdapter
 *
 * IPC 实现的任务模板 API 客户端（用于 Electron 桌面应用）
 */
export class TaskTemplateIpcAdapter implements ITaskTemplateApiClient {
  constructor(private readonly electronApi: ElectronAPI) {}

  // ===== Task Template CRUD =====

  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:create', request);
  }

  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<{ templates: TaskTemplateClientDTO[]; total: number }> {
    return this.electronApi.invoke('task-template:list', params);
  }

  async getTaskTemplateById(
    uuid: string,
    includeChildren = false,
  ): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:get', { uuid, includeChildren });
  }

  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:update', { uuid, ...request });
  }

  async deleteTaskTemplate(uuid: string): Promise<void> {
    await this.electronApi.invoke('task-template:delete', { uuid });
  }

  // ===== Task Template 状态管理 =====

  async activateTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:activate', { uuid });
  }

  async pauseTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:pause', { uuid });
  }

  async archiveTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:archive', { uuid });
  }

  // ===== 聚合根控制：任务实例管理 =====

  async generateInstances(
    templateUuid: string,
    request: GenerateInstancesRequest,
  ): Promise<TaskInstanceClientDTO[]> {
    return this.electronApi.invoke('task-template:generate-instances', {
      templateUuid,
      request,
    });
  }

  async getInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number,
  ): Promise<TaskInstanceClientDTO[]> {
    return this.electronApi.invoke('task-template:get-instances', {
      templateUuid,
      from,
      to,
    });
  }

  // ===== 聚合根控制：目标关联管理 =====

  async bindToGoal(
    templateUuid: string,
    request: BindToGoalRequest,
  ): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:bind-goal', {
      templateUuid,
      request,
    });
  }

  async unbindFromGoal(templateUuid: string): Promise<TaskTemplateClientDTO> {
    return this.electronApi.invoke('task-template:unbind-goal', { templateUuid });
  }
}

/**
 * Factory function to create TaskTemplateIpcAdapter
 */
export function createTaskTemplateIpcAdapter(electronApi: ElectronAPI): TaskTemplateIpcAdapter {
  return new TaskTemplateIpcAdapter(electronApi);
}
