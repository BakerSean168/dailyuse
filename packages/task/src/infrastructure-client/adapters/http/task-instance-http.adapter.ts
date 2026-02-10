/**
 * Task Instance HTTP Adapter
 *
 * HTTP implementation of ITaskInstanceApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { ITaskInstanceApiClient } from '../../ports/task-instance-api-client.port';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';
import type { IHttpClient } from '../../../shared/http-client.types';

/**
 * TaskInstanceHttpAdapter
 *
 * HTTP 实现的任务实例 API 客户端
 */
export class TaskInstanceHttpAdapter implements ITaskInstanceApiClient {
  private readonly baseUrl = '/tasks/templates/instances';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Task Instance CRUD =====

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstanceClientDTO[]> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getTaskInstanceById(uuid: string): Promise<TaskInstanceClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Task Instance 状态管理 =====

  async startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/start`);
  }

  async completeTaskInstance(
    uuid: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/complete`, request);
  }

  async skipTaskInstance(
    uuid: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/skip`, request);
  }

  // ===== 批量操作 =====

  async checkExpiredInstances(): Promise<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }> {
    return this.httpClient.post(`${this.baseUrl}/check-expired`);
  }
}

/**
 * Factory function to create TaskInstanceHttpAdapter
 */
export function createTaskInstanceHttpAdapter(httpClient: IHttpClient): TaskInstanceHttpAdapter {
  return new TaskInstanceHttpAdapter(httpClient);
}
