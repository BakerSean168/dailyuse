/**
 * Task Instance HTTP Adapter
 *
 * HTTP implementation of ITaskInstanceApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  ITaskInstanceApiClient,
} from '../types';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';

/**
 * TaskInstanceHttpAdapter
 *
 * HTTP 实现的任务实例 API 客户端
 */
export class TaskInstanceHttpAdapter implements ITaskInstanceApiClient {
  private readonly baseUrl = '/tasks/templates/instances';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Task Instance CRUD =====

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async deleteTaskInstance(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Task Instance 状态管理 =====

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/start`);
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/complete`, request);
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/skip`, request);
  }

  // ===== 批量操作 =====

  async checkExpiredInstances(): Promise<Result<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }>> {
    return this.httpClient.post(`${this.baseUrl}/check-expired`);
  }
}

/**
 * Factory function to create TaskInstanceHttpAdapter
 */
export function createTaskInstanceHttpAdapter(httpClient: IResultHttpClient): TaskInstanceHttpAdapter {
  return new TaskInstanceHttpAdapter(httpClient);
}
