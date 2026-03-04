/**
 * Task Instance HTTP Adapter
 *
 * HTTP implementation of ITaskInstanceApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type { ITaskInstanceApiClient } from '../types';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
} from '@dailyuse/contracts/task';

/**
 * TaskInstanceHttpAdapter
 *
 * HTTP 实现的任务实�?API 客户�?
 */
export class TaskInstanceHttpAdapter implements ITaskInstanceApiClient {
  private readonly baseUrl = '/task-instances';

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

  // ===== Task Instance 状态管�?=====

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/start`);
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/complete`, request);
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/skip`, request);
  }

  // ===== 批量操作 =====

  async checkExpiredInstances(): Promise<
    Result<{
      count: number;
      instances: TaskInstanceClientDTO[];
    }>
  > {
    return this.httpClient.post(`${this.baseUrl}/check-expired`);
  }
}

/**
 * Factory function to create TaskInstanceHttpAdapter
 */
export function createTaskInstanceHttpAdapter(
  httpClient: IResultHttpClient,
): TaskInstanceHttpAdapter {
  return new TaskInstanceHttpAdapter(httpClient);
}
