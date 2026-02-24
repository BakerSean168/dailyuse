/**
 * Schedule Task HTTP Adapter
 *
 * HTTP implementation of IScheduleTaskApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  IScheduleTaskApiClient,
} from '../types';
import type { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

/**
 * ScheduleTaskHttpAdapter
 *
 * HTTP 实现的调度任务 API 客户端
 */
export class ScheduleTaskHttpAdapter implements IScheduleTaskApiClient {
  private readonly baseUrl = '/schedules';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTaskClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/tasks`, request);
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/batch`, { tasks });
  }

  async getTasks(): Promise<Result<{ tasks: ScheduleTaskClientDTO[]; total: number }>> {
    return this.httpClient.get(`${this.baseUrl}/tasks`);
  }

  async getTaskById(taskId: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/tasks/${taskId}`);
  }

  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/tasks/due`, { params });
  }

  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/tasks`, {
      params: { sourceModule, sourceEntityId },
    });
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskId: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskId}/pause`);
  }

  async resumeTask(taskId: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskId}/resume`);
  }

  async completeTask(taskId: string, reason?: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskId}/complete`, { reason });
  }

  async cancelTask(taskId: string, reason?: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskId}/cancel`, { reason });
  }

  async deleteTask(taskId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/tasks/${taskId}`);
  }

  async deleteTasksBatch(taskIds: string[]): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/batch/delete`, { taskIds });
  }

  async updateTaskMetadata(
    taskId: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<Result<void>> {
    return this.httpClient.patch(`${this.baseUrl}/tasks/${taskId}/metadata`, metadata);
  }
}

/**
 * Factory function to create ScheduleTaskHttpAdapter
 */
export function createScheduleTaskHttpAdapter(httpClient: IResultHttpClient): ScheduleTaskHttpAdapter {
  return new ScheduleTaskHttpAdapter(httpClient);
}
