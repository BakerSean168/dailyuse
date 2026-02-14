/**
 * Schedule Task HTTP Adapter
 *
 * HTTP implementation of IScheduleTaskApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  IScheduleTaskApiClient,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
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

  async getTaskById(taskUuid: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/tasks/${taskUuid}`);
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

  async pauseTask(taskUuid: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/pause`);
  }

  async resumeTask(taskUuid: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/resume`);
  }

  async completeTask(taskUuid: string, reason?: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/complete`, { reason });
  }

  async cancelTask(taskUuid: string, reason?: string): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/cancel`, { reason });
  }

  async deleteTask(taskUuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/tasks/${taskUuid}`);
  }

  async deleteTasksBatch(taskUuids: string[]): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/tasks/batch/delete`, { taskUuids });
  }

  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<Result<void>> {
    return this.httpClient.patch(`${this.baseUrl}/tasks/${taskUuid}/metadata`, metadata);
  }

  // ===== Schedule Statistics =====

  async getStatistics(): Promise<Result<ScheduleStatisticsClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/statistics`);
  }

  async getModuleStatistics(module: SourceModule): Promise<Result<ModuleStatisticsClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/statistics/module/${module}`);
  }

  async getAllModuleStatistics(): Promise<Result<Record<SourceModule, ModuleStatisticsClientDTO>>> {
    return this.httpClient.get(`${this.baseUrl}/statistics/modules`);
  }

  async recalculateStatistics(): Promise<Result<ScheduleStatisticsClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/statistics/recalculate`);
  }

  async resetStatistics(): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/statistics/reset`);
  }

  async deleteStatistics(): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/statistics`);
  }
}

/**
 * Factory function to create ScheduleTaskHttpAdapter
 */
export function createScheduleTaskHttpAdapter(httpClient: IResultHttpClient): ScheduleTaskHttpAdapter {
  return new ScheduleTaskHttpAdapter(httpClient);
}
