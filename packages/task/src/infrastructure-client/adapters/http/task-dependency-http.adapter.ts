/**
 * Task Dependency HTTP Adapter
 *
 * HTTP implementation of ITaskDependencyApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  ITaskDependencyApiClient,
} from '../types';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
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
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${taskUuid}/dependencies`, request);
  }

  async getDependencies(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependencies`);
  }

  async getDependents(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependents`);
  }

  async getDependencyChain(taskUuid: string): Promise<Result<DependencyChainClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependency-chain`);
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    return this.httpClient.post(`${this.baseUrl}/dependencies/validate`, request);
  }

  async deleteDependency(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/dependencies/${uuid}`);
  }

  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/dependencies/${uuid}`, request);
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
