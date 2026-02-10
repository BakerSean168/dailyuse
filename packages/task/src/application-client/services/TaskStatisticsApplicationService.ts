/**
 * Task Statistics Application Service
 *
 * Handles task statistics queries and updates.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 职责：
 * - 获取任务统计数据
 * - 重新计算统计
 * - 获取完成率和效率趋势
 */

import type { ITaskStatisticsApiClient } from '@/infrastructure-client';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';

/**
 * Task Statistics Application Service
 */
export class TaskStatisticsApplicationService {
  constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  // ===== Task Statistics 查询 =====

  /**
   * 获取任务统计数据
   */
  async getTaskStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    return this.apiClient.getTaskStatistics(accountUuid, forceRecalculate);
  }

  /**
   * 重新计算任务统计
   */
  async recalculateStatistics(
    accountUuid: string,
    force = true,
  ): Promise<TaskStatisticsServerDTO> {
    return this.apiClient.recalculateTaskStatistics(accountUuid, force);
  }

  /**
   * 删除统计数据
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    await this.apiClient.deleteTaskStatistics(accountUuid);
  }

  // ===== 部分更新操作 =====

  /**
   * 更新模板统计信息
   */
  async updateTemplateStats(accountUuid: string): Promise<void> {
    await this.apiClient.updateTemplateStats(accountUuid);
  }

  /**
   * 更新实例统计信息
   */
  async updateInstanceStats(accountUuid: string): Promise<void> {
    await this.apiClient.updateInstanceStats(accountUuid);
  }

  /**
   * 更新完成统计信息
   */
  async updateCompletionStats(accountUuid: string): Promise<void> {
    await this.apiClient.updateCompletionStats(accountUuid);
  }

  // ===== 快速查询方法 =====

  /**
   * 获取今日完成率
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    return this.apiClient.getTodayCompletionRate(accountUuid);
  }

  /**
   * 获取本周完成率
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    return this.apiClient.getWeekCompletionRate(accountUuid);
  }

  /**
   * 获取效率趋势
   */
  async getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    return this.apiClient.getEfficiencyTrend(accountUuid);
  }
}

/**
 * Factory function to create TaskStatisticsApplicationService
 */
export function createTaskStatisticsService(
  apiClient: ITaskStatisticsApiClient,
): TaskStatisticsApplicationService {
  return new TaskStatisticsApplicationService(apiClient);
}
