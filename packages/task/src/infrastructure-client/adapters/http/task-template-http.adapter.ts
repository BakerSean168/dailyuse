/**
 * Task Template HTTP Adapter
 *
 * HTTP implementation of ITaskTemplateApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  ITaskTemplateApiClient,
} from '../types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
} from '@dailyuse/contracts/task';

/**
 * TaskTemplateHttpAdapter
 *
 * HTTP 实现的任务模板 API 客户端
 */
export class TaskTemplateHttpAdapter implements ITaskTemplateApiClient {
  private readonly baseUrl = '/tasks/templates';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Task Template CRUD =====

  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
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
  }): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskTemplateById(
    uuid: string,
    includeChildren = false,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`, {
      params: { includeChildren },
    });
  }

  async updateTaskTemplate(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteTaskTemplate(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== 方法别名（为了兼容 View 层调用）=====

  async create(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>> {
    return this.createTaskTemplate(request);
  }

  async getByUuid(uuid: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.getTaskTemplateById(uuid);
  }

  async update(
    uuid: string,
    request: UpdateTaskTemplateRequest,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.updateTaskTemplate(uuid, request);
  }

  // ===== 特殊查询方法 =====

  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/by-priority`, { params });
  }

  // ===== Task Template 状态管理 =====

  async activateTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/activate`);
  }

  async pauseTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/pause`);
  }

  async archiveTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/archive`);
  }

  // ===== 聚合根控制：任务实例管理 =====

  async generateInstances(
    templateUuid: string,
    request: GenerateInstancesRequest,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.post(`${this.baseUrl}/${templateUuid}/generate-instances`, request);
  }

  async getInstancesByDateRange(
    templateUuid: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${templateUuid}/instances`, {
      params: { from, to },
    });
  }

  // ===== 聚合根控制：目标关联管理 =====

  async bindToGoal(
    templateUuid: string,
    request: BindToGoalRequest,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${templateUuid}/bind-goal`, request);
  }

  async unbindFromGoal(templateUuid: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${templateUuid}/unbind-goal`);
  }
}

/**
 * Factory function to create TaskTemplateHttpAdapter
 */
export function createTaskTemplateHttpAdapter(httpClient: IResultHttpClient): TaskTemplateHttpAdapter {
  return new TaskTemplateHttpAdapter(httpClient);
}
