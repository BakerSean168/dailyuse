/**
 * Schedule Task HTTP Adapter
 *
 * HTTP implementation of IScheduleTaskApiClient.
 */

import type {
  IHttpClient,
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

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/tasks`, request);
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<ScheduleTaskClientDTO[]> {
    return this.httpClient.post(`${this.baseUrl}/tasks/batch`, { tasks });
  }

  async getTasks(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    return this.httpClient.get(`${this.baseUrl}/tasks`);
  }

  async getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/tasks/${taskUuid}`);
  }

  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTaskClientDTO[]> {
    return this.httpClient.get(`${this.baseUrl}/tasks/due`, { params });
  }

  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]> {
    return this.httpClient.get(`${this.baseUrl}/tasks`, {
      params: { sourceModule, sourceEntityId },
    });
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskUuid: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/pause`);
  }

  async resumeTask(taskUuid: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/resume`);
  }

  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/complete`, { reason });
  }

  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/tasks/${taskUuid}/cancel`, { reason });
  }

  async deleteTask(taskUuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/tasks/${taskUuid}`);
  }

  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/tasks/batch/delete`, { taskUuids });
  }

  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    await this.httpClient.patch(`${this.baseUrl}/tasks/${taskUuid}/metadata`, metadata);
  }

  // ===== Schedule Statistics =====

  async getStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/statistics`);
  }

  async getModuleStatistics(module: SourceModule): Promise<ModuleStatisticsClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/statistics/module/${module}`);
  }

  async getAllModuleStatistics(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/statistics/modules`);
  }

  async recalculateStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/statistics/recalculate`);
  }

  async resetStatistics(): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/statistics/reset`);
  }

  async deleteStatistics(): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/statistics`);
  }
}

/**
 * Factory function to create ScheduleTaskHttpAdapter
 */
export function createScheduleTaskHttpAdapter(httpClient: IHttpClient): ScheduleTaskHttpAdapter {
  return new ScheduleTaskHttpAdapter(httpClient);
}
