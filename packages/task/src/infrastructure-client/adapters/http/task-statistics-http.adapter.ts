/**
 * Task Statistics HTTP Adapter
 *
 * HTTP implementation of ITaskStatisticsApiClient.
 * Uses IHttpClient for making HTTP requests.
 */

import type { ITaskStatisticsApiClient } from '../../ports/task-statistics-api-client.port';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import type { IHttpClient } from '../../../shared/http-client.types';

/**
 * TaskStatisticsHttpAdapter
 *
 * HTTP 实现的任务统计 API 客户端
 */
export class TaskStatisticsHttpAdapter implements ITaskStatisticsApiClient {
  private readonly baseUrl = '/tasks/statistics';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Task Statistics 查询 =====

  async getTaskStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountUuid}`, {
      params: { forceRecalculate },
    });
  }

  async recalculateTaskStatistics(
    accountUuid: string,
    force = true,
  ): Promise<TaskStatisticsServerDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountUuid}/recalculate`, { force });
  }

  async deleteTaskStatistics(accountUuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${accountUuid}`);
  }

  // ===== 部分更新操作 =====

  async updateTemplateStats(accountUuid: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/${accountUuid}/update-template-stats`);
  }

  async updateInstanceStats(accountUuid: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/${accountUuid}/update-instance-stats`);
  }

  async updateCompletionStats(accountUuid: string): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/${accountUuid}/update-completion-stats`);
  }

  // ===== 快速查询方法 =====

  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    const data = await this.httpClient.get<{ rate: number }>(
      `${this.baseUrl}/${accountUuid}/today-completion-rate`,
    );
    return data.rate;
  }

  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    const data = await this.httpClient.get<{ rate: number }>(
      `${this.baseUrl}/${accountUuid}/week-completion-rate`,
    );
    return data.rate;
  }

  async getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const data = await this.httpClient.get<{ trend: 'UP' | 'DOWN' | 'STABLE' }>(
      `${this.baseUrl}/${accountUuid}/efficiency-trend`,
    );
    return data.trend;
  }
}

/**
 * Factory function to create TaskStatisticsHttpAdapter
 */
export function createTaskStatisticsHttpAdapter(
  httpClient: IHttpClient,
): TaskStatisticsHttpAdapter {
  return new TaskStatisticsHttpAdapter(httpClient);
}
