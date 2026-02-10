/**
 * Reset Statistics
 *
 * 重置统计信息用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Reset Statistics
 */
export class ResetStatistics {
  private static instance: ResetStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): ResetStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    ResetStatistics.instance = new ResetStatistics(client);
    return ResetStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResetStatistics {
    if (!ResetStatistics.instance) {
      ResetStatistics.instance = ResetStatistics.createInstance();
    }
    return ResetStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResetStatistics.instance = undefined as unknown as ResetStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<void> {
    await this.apiClient.resetStatistics();

    this.publishEvent(ScheduleTaskEvents.STATISTICS_RESET);
  }

  /**
   * 发布事件
   */
  private publishEvent(eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid: 'statistics',
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}

/**
 * 便捷函数
 */
export const resetStatistics = (): Promise<void> =>
  ResetStatistics.getInstance().execute();
