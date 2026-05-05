/**
 * Task Template HTTP Adapter
 *
 * HTTP implementation of ITaskTemplateApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type { ITaskTemplateApiClient, TaskTemplateListParams } from '../types';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  QueryTaskTemplateGraphRes,
  TaskTemplateInstancesQuery,
} from '@dailyuse/contracts/task';

/**
 * TaskTemplateHttpAdapter
 *
 * HTTP implementation of the task template API client.
 */
export class TaskTemplateHttpAdapter implements ITaskTemplateApiClient {
  private readonly baseUrl = '/task-templates';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Task Template CRUD =====

  async createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getTaskTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskGraph(params?: TaskTemplateListParams): Promise<Result<QueryTaskTemplateGraphRes>> {
    return this.httpClient.get(`${this.baseUrl}/graph`, { params });
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
    return this.httpClient.patch(`${this.baseUrl}/${id}`, request);
  }

  async deleteTaskTemplate(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Special Query Methods =====

  async getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/by-priority`, { params });
  }

  // ===== Task Template State Management =====

  async activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/activate`);
  }

  async pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/pause`);
  }

  async archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/archive`);
  }

  // ===== Aggregate Control: Instance Management =====

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.post(`${this.baseUrl}/${templateId}/generate-instances`, request);
  }

  async getInstancesByDateRange(
    templateId: string,
    query?: TaskTemplateInstancesQuery,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${templateId}/instances`, {
      params: query,
    });
  }

  // ===== Aggregate Control: Goal Binding Management =====

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
export function createTaskTemplateHttpAdapter(
  httpClient: IResultHttpClient,
): TaskTemplateHttpAdapter {
  return new TaskTemplateHttpAdapter(httpClient);
}
