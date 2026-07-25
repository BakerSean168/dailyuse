/**
 * Task Dependency HTTP Adapter
 *
 * HTTP implementation of ITaskDependencyApiClient.
 * Uses IResultHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  ITaskDependencyApiClient,
} from '../types';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyBody,
  UpdateTaskDependencyBody,
  ValidateDependencyBody,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';

/**
 * TaskDependencyHttpAdapter
 *
 * HTTP 实现的任务依赖关系 API 客户端
 */
export class TaskDependencyHttpAdapter implements ITaskDependencyApiClient {
  private readonly baseUrl = '/tasks';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createDependency(
    taskId: string,
    request: CreateTaskDependencyBody,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${taskId}/dependencies`, request);
  }

  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${taskId}/dependencies`);
  }

  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${taskId}/dependents`);
  }

  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${taskId}/dependency-chain`);
  }

  async validateDependency(
    request: ValidateDependencyBody,
  ): Promise<Result<ValidateDependencyResponse>> {
    return this.httpClient.post(`${this.baseUrl}/dependencies/validate`, request);
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/dependencies/${id}`);
  }

  async updateDependency(
    id: string,
    request: UpdateTaskDependencyBody,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/dependencies/${id}`, request);
  }
}

/**
 * Factory function to create TaskDependencyHttpAdapter
 */
export function createTaskDependencyHttpAdapter(
  httpClient: IResultHttpClient,
): TaskDependencyHttpAdapter {
  return new TaskDependencyHttpAdapter(httpClient);
}
