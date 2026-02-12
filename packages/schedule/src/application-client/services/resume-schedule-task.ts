/**
 * Resume Schedule Task
 *
 * 恢复调度任务用例
 */

import type { IScheduleTaskApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';

/**
 * Resume Schedule Task
 */
export class ResumeScheduleTask {
  private static instance: ResumeScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): ResumeScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    ResumeScheduleTask.instance = new ResumeScheduleTask(client);
    return ResumeScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResumeScheduleTask {
    if (!ResumeScheduleTask.instance) {
      ResumeScheduleTask.instance = ResumeScheduleTask.createInstance();
    }
    return ResumeScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResumeScheduleTask.instance = undefined as unknown as ResumeScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<void> {
    await this.apiClient.resumeTask(taskUuid);

    this.publishEvent(taskUuid, ScheduleTaskEvents.TASK_RESUMED);
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
export const resumeScheduleTask = (taskUuid: string): Promise<void> =>
  ResumeScheduleTask.getInstance().execute(taskUuid);
