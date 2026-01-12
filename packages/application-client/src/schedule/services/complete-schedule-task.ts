/**
 * Complete Schedule Task
 *
 * 完成调度任务用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Complete Schedule Task
 */
export class CompleteScheduleTask {
  private static instance: CompleteScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): CompleteScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    CompleteScheduleTask.instance = new CompleteScheduleTask(client);
    return CompleteScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CompleteScheduleTask {
    if (!CompleteScheduleTask.instance) {
      CompleteScheduleTask.instance = CompleteScheduleTask.createInstance();
    }
    return CompleteScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CompleteScheduleTask.instance = undefined as unknown as CompleteScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string, reason?: string): Promise<void> {
    await this.apiClient.completeTask(taskUuid, reason);

    this.publishEvent(taskUuid, ScheduleTaskEvents.TASK_COMPLETED, { reason });
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
