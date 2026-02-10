/**
 * Pause Schedule Task
 *
 * 暂停调度任务用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Pause Schedule Task
 */
export class PauseScheduleTask {
  private static instance: PauseScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): PauseScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    PauseScheduleTask.instance = new PauseScheduleTask(client);
    return PauseScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): PauseScheduleTask {
    if (!PauseScheduleTask.instance) {
      PauseScheduleTask.instance = PauseScheduleTask.createInstance();
    }
    return PauseScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    PauseScheduleTask.instance = undefined as unknown as PauseScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<void> {
    await this.apiClient.pauseTask(taskUuid);

    this.publishEvent(taskUuid, ScheduleTaskEvents.TASK_PAUSED);
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
export const pauseScheduleTask = (taskUuid: string): Promise<void> =>
  PauseScheduleTask.getInstance().execute(taskUuid);
