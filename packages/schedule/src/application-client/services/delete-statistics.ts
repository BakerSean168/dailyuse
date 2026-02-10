/**
 * Delete Statistics
 *
 * 删除统计信息用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Delete Statistics
 */
export class DeleteStatistics {
  private static instance: DeleteStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): DeleteStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    DeleteStatistics.instance = new DeleteStatistics(client);
    return DeleteStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteStatistics {
    if (!DeleteStatistics.instance) {
      DeleteStatistics.instance = DeleteStatistics.createInstance();
    }
    return DeleteStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteStatistics.instance = undefined as unknown as DeleteStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<void> {
    await this.apiClient.deleteStatistics();

    this.publishEvent(ScheduleTaskEvents.STATISTICS_DELETED);
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
export const deleteStatistics = (): Promise<void> =>
  DeleteStatistics.getInstance().execute();
