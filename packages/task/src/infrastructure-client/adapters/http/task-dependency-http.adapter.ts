/**
 * Task Dependency HTTP Adapter
 *
 * HTTP implementation of ITaskDependencyApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { ITaskDependencyApiClient } from '../../ports/task-dependency-api-client.port';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';
import type { IHttpClient } from '../../../shared/http-client.types';

/**
 * TaskDependencyHttpAdapter
 *
 * HTTP 实现的任务依赖关系 API 客户端
 */
export class TaskDependencyHttpAdapter implements ITaskDependencyApiClient {
  private readonly baseUrl = '/tasks';

  constructor(private readonly httpClient: IHttpClient) {}

  async createDependency(
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${taskUuid}/dependencies`, request);
  }

  async getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependencies`);
  }

  async getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependents`);
  }

  async getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${taskUuid}/dependency-chain`);
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    return this.httpClient.post(`${this.baseUrl}/dependencies/validate`, request);
  }

  async deleteDependency(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/dependencies/${uuid}`);
  }

  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    return this.httpClient.put(`${this.baseUrl}/dependencies/${uuid}`, request);
  }
}

/**
 * Factory function to create TaskDependencyHttpAdapter
 */
export function createTaskDependencyHttpAdapter(
  httpClient: IHttpClient,
): TaskDependencyHttpAdapter {
  return new TaskDependencyHttpAdapter(httpClient);
}
