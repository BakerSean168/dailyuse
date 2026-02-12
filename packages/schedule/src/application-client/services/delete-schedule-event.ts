/**
 * Delete Schedule Event
 *
 * 删除日程事件用例
 */

import type { IScheduleEventApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleEventEvents, type ScheduleEventRefreshEvent } from './schedule-events';

/**
 * Delete Schedule Event
 */
export class DeleteScheduleEvent {
  private static instance: DeleteScheduleEvent;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): DeleteScheduleEvent {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    DeleteScheduleEvent.instance = new DeleteScheduleEvent(client);
    return DeleteScheduleEvent.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteScheduleEvent {
    if (!DeleteScheduleEvent.instance) {
      DeleteScheduleEvent.instance = DeleteScheduleEvent.createInstance();
    }
    return DeleteScheduleEvent.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteScheduleEvent.instance = undefined as unknown as DeleteScheduleEvent;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteSchedule(uuid);

    this.publishEvent(uuid, ScheduleEventEvents.SCHEDULE_DELETED);
  }

  /**
   * 发布事件
   */
  private publishEvent(scheduleUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleEventRefreshEvent = {
      scheduleUuid,
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
export const deleteScheduleEvent = (uuid: string): Promise<void> =>
  DeleteScheduleEvent.getInstance().execute(uuid);
