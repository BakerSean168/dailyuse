/**
 * Recalculate Statistics
 *
 * 重新计算统计信息用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import type { ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Recalculate Statistics
 */
export class RecalculateStatistics {
  private static instance: RecalculateStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): RecalculateStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    RecalculateStatistics.instance = new RecalculateStatistics(client);
    return RecalculateStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RecalculateStatistics {
    if (!RecalculateStatistics.instance) {
      RecalculateStatistics.instance = RecalculateStatistics.createInstance();
    }
    return RecalculateStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RecalculateStatistics.instance = undefined as unknown as RecalculateStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<ScheduleStatisticsClientDTO> {
    const statistics = await this.apiClient.recalculateStatistics();

    this.publishEvent(ScheduleTaskEvents.STATISTICS_RECALCULATED);

    return statistics;
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
export const recalculateStatistics = (): Promise<ScheduleStatisticsClientDTO> =>
  RecalculateStatistics.getInstance().execute();
