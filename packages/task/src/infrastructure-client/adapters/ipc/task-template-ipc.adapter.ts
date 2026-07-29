/**
 * Task Template IPC Adapter
 *
 * IPC implementation of ITaskTemplateApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@memoflow/contracts/result';
import { TaskChannels } from '@memoflow/contracts/electron';
import type { ITaskTemplateApiClient, IResultIpcClient, TaskTemplateListParams } from '../types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  CreateTaskTemplateRes,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  QueryTaskTemplateGraphRes,
  TaskTemplateInstancesQuery,
} from '@memoflow/contracts/task';

export class TaskTemplateIpcAdapter implements ITaskTemplateApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<CreateTaskTemplateRes>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_CREATE, request);
  }

  async getTaskTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_LIST, params);
  }

  async getTaskGraph(params?: TaskTemplateListParams): Promise<Result<QueryTaskTemplateGraphRes>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_GRAPH, params);
  }

  async getTaskTemplateById(
    id: string,
    includeChildren = false,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_GET, { id, includeChildren });
  }

  async updateTaskTemplate(
    id: string,
    request: UpdateTaskTemplateReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_UPDATE, { id, request });
  }

  async deleteTaskTemplate(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_DELETE, { id });
  }

  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_GET_BY_PRIORITY, { params });
  }

  async activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_RESTORE, { id });
  }

  async pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_PAUSE, { id });
  }

  async archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_ARCHIVE, { id });
  }

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_GENERATE_INSTANCES, {
      templateId,
      request,
    });
  }

  async getInstancesByDateRange(
    templateId: string,
    query?: TaskTemplateInstancesQuery,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_GET_INSTANCES, {
      templateId,
      ...query,
    });
  }

  async bindToGoal(
    templateId: string,
    request: BindToGoalReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_BIND_GOAL, {
      templateId,
      request,
    });
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.TEMPLATE_UNBIND_GOAL, { templateId });
  }
}

export function createTaskTemplateIpcAdapter(ipcClient: IResultIpcClient): TaskTemplateIpcAdapter {
  return new TaskTemplateIpcAdapter(ipcClient);
}
