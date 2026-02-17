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
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
} from '@dailyuse/contracts/task';

/**
 * TaskTemplateHttpAdapter
 *
 * HTTP 实现的任务模�?API 客户�?
 */
export class TaskTemplateHttpAdapter implements ITaskTemplateApiClient {
  private readonly baseUrl = '/tasks/templates';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Task Template CRUD =====

  async createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
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
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskTemplateById(
    id: string,
    includeChildren = false,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`, {
      params: { includeChildren },
    });
  }

  async updateTaskTemplate(
    id: string,
    request: UpdateTaskTemplateReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/${id}`, request);
  }

  async deleteTaskTemplate(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== 特殊查询方法 =====

  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/by-priority`, { params });
  }

  // ===== Task Template 状态管�?=====

  async activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/activate`);
  }

  async pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/pause`);
  }

  async archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/archive`);
  }

  // ===== 聚合根控制：任务实例管理 =====

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.post(`${this.baseUrl}/${templateId}/generate-instances`, request);
  }

  async getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${templateId}/instances`, {
      params: { from, to },
    });
  }

  // ===== 聚合根控制：目标关联管理 =====

  async bindToGoal(
    templateId: string,
    request: BindToGoalReq,
  ): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${templateId}/bind-goal`, request);
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${templateId}/unbind-goal`);
  }
}

/**
 * Factory function to create TaskTemplateHttpAdapter
 */
export function createTaskTemplateHttpAdapter(httpClient: IResultHttpClient): TaskTemplateHttpAdapter {
  return new TaskTemplateHttpAdapter(httpClient);
}
