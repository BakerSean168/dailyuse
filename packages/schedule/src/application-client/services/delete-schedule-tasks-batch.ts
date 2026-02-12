/**
 * Delete Schedule Tasks Batch
 *
 * 批量删除调度任务用例
 */

import type { IScheduleTaskApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Delete Schedule Tasks Batch
 */
export class DeleteScheduleTasksBatch {
  private static instance: DeleteScheduleTasksBatch;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): DeleteScheduleTasksBatch {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    DeleteScheduleTasksBatch.instance = new DeleteScheduleTasksBatch(client);
    return DeleteScheduleTasksBatch.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteScheduleTasksBatch {
    if (!DeleteScheduleTasksBatch.instance) {
      DeleteScheduleTasksBatch.instance = DeleteScheduleTasksBatch.createInstance();
    }
    return DeleteScheduleTasksBatch.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteScheduleTasksBatch.instance = undefined as unknown as DeleteScheduleTasksBatch;
  }

  /**
   * 执行用例
   */
  async execute(taskUuids: string[]): Promise<void> {
    await this.apiClient.deleteTasksBatch(taskUuids);

    this.publishEvent(taskUuids, ScheduleTaskEvents.TASKS_BATCH_DELETED);
  }

  /**
   * 发布事件
   */
  private publishEvent(taskUuids: string[], eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid: taskUuids.join(','),
      reason: eventName,
      timestamp: Date.now(),
      metadata: { ...metadata, taskUuids },
    };
    eventBus.emit(eventName, event);
  }
}

/**
 * 便捷函数
 */
export const deleteScheduleTasksBatch = (taskUuids: string[]): Promise<void> =>
  DeleteScheduleTasksBatch.getInstance().execute(taskUuids);
