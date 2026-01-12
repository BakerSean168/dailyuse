/**
 * Cancel Schedule Task
 *
 * 取消调度任务用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Cancel Schedule Task
 */
export class CancelScheduleTask {
  private static instance: CancelScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): CancelScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    CancelScheduleTask.instance = new CancelScheduleTask(client);
    return CancelScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CancelScheduleTask {
    if (!CancelScheduleTask.instance) {
      CancelScheduleTask.instance = CancelScheduleTask.createInstance();
    }
    return CancelScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CancelScheduleTask.instance = undefined as unknown as CancelScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string, reason?: string): Promise<void> {
    await this.apiClient.cancelTask(taskUuid, reason);

    this.publishEvent(taskUuid, ScheduleTaskEvents.TASK_CANCELLED, { reason });
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
