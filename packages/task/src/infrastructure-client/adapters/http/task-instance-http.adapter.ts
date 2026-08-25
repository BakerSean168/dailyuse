/**
 * Task Instance HTTP Adapter
 *
 * HTTP implementation of ITaskInstanceApiClient.
 * Uses IResultHttpClient for making HTTP requests.
 */

import type { Result } from '@memoflow/contracts/result';
import type { IResultHttpClient } from '@memoflow/http-client';
import type { ITaskInstanceApiClient } from '../types';
import type {
  GetTaskInstancesByRangeReq,
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  MarkTaskInstanceMissedReq,
  SkipTaskInstanceReq,
} from '@memoflow/contracts/task';

/**
 * TaskInstanceHttpAdapter
 *
 * HTTP implementation of the task instance API client.
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
  }): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskInstancesByDateRange(
    request: GetTaskInstancesByRangeReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/by-date-range`, {
      params: request,
    });
  }

  async getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async deleteTaskInstance(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Task Instance State Management =====

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/start`);
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/complete`, request);
  }

  async uncompleteTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/uncomplete`);
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/skip`, request);
  }

  async markTaskInstanceMissed(
    id: string,
    request?: MarkTaskInstanceMissedReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/missed`, request);
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
