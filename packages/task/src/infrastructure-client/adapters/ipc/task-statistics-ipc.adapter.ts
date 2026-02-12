/**
 * Task Statistics IPC Adapter
 *
 * IPC implementation of ITaskStatisticsApiClient for Electron desktop.
 */

import type {
  ITaskStatisticsApiClient,
  IIpcClient,
  TaskStatisticsServerDTO,
} from '../types';


/**
 * TaskStatisticsIpcAdapter
 *
 * IPC 实现的任务统�?API 客户端（用于 Electron 桌面应用�?
 */
export class TaskStatisticsIpcAdapter implements ITaskStatisticsApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Task Statistics 查询 =====

  async getTaskStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    return this.ipcClient.invoke('task-statistics:get', {
      accountUuid,
      forceRecalculate,
    });
  }

  async recalculateTaskStatistics(
    accountUuid: string,
    force = true,
  ): Promise<TaskStatisticsServerDTO> {
    return this.ipcClient.invoke('task-statistics:recalculate', {
      accountUuid,
      force,
    });
  }

  async deleteTaskStatistics(accountUuid: string): Promise<void> {
    await this.ipcClient.invoke('task-statistics:delete', { accountUuid });
  }

  // ===== 部分更新操作 =====

  async updateTemplateStats(accountUuid: string): Promise<void> {
    await this.ipcClient.invoke('task-statistics:update-template', { accountUuid });
  }

  async updateInstanceStats(accountUuid: string): Promise<void> {
    await this.ipcClient.invoke('task-statistics:update-instance', { accountUuid });
  }

  async updateCompletionStats(accountUuid: string): Promise<void> {
    await this.ipcClient.invoke('task-statistics:update-completion', { accountUuid });
  }

  // ===== 快速查询方�?=====

  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    return this.ipcClient.invoke('task-statistics:today-rate', { accountUuid });
  }

  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    return this.ipcClient.invoke('task-statistics:week-rate', { accountUuid });
  }

  async getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    return this.ipcClient.invoke('task-statistics:efficiency-trend', { accountUuid });
  }
}

/**
 * Factory function to create TaskStatisticsIpcAdapter
 */
export function createTaskStatisticsIpcAdapter(
  ipcClient: IIpcClient,
): TaskStatisticsIpcAdapter {
  return new TaskStatisticsIpcAdapter(ipcClient);
}
