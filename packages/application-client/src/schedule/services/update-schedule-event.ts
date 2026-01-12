/**
 * Update Schedule Event
 *
 * 更新日程事件用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateScheduleRequest } from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleEventEvents, type ScheduleEventRefreshEvent } from './schedule-events';
import { Schedule } from '@dailyuse/domain-client/schedule';

/**
 * Update Schedule Event
 */
export class UpdateScheduleEvent {
  private static instance: UpdateScheduleEvent;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): UpdateScheduleEvent {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    UpdateScheduleEvent.instance = new UpdateScheduleEvent(client);
    return UpdateScheduleEvent.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateScheduleEvent {
    if (!UpdateScheduleEvent.instance) {
      UpdateScheduleEvent.instance = UpdateScheduleEvent.createInstance();
    }
    return UpdateScheduleEvent.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateScheduleEvent.instance = undefined as unknown as UpdateScheduleEvent;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(uuid: string, data: UpdateScheduleRequest): Promise<Schedule> {
    const dto = await this.apiClient.updateSchedule(uuid, data);

    this.publishEvent(dto.uuid, ScheduleEventEvents.SCHEDULE_UPDATED);

    return Schedule.fromClientDTO(dto);
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
