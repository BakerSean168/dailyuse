/**
 * Delete Schedule Task
 *
 * 删除调度任务用例
 */

import type { IScheduleTaskApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Delete Schedule Task
 */
export class DeleteScheduleTask {
  private static instance: DeleteScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): DeleteScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    DeleteScheduleTask.instance = new DeleteScheduleTask(client);
    return DeleteScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteScheduleTask {
    if (!DeleteScheduleTask.instance) {
      DeleteScheduleTask.instance = DeleteScheduleTask.createInstance();
    }
    return DeleteScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteScheduleTask.instance = undefined as unknown as DeleteScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<void> {
    await this.apiClient.deleteTask(taskUuid);

    this.publishEvent(taskUuid, ScheduleTaskEvents.TASK_DELETED);
  }

  /**
   * 发布事件
   */
  private publishEvent(taskUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid,
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
export const deleteScheduleTask = (taskUuid: string): Promise<void> =>
  DeleteScheduleTask.getInstance().execute(taskUuid);
