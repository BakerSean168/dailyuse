/**
 * Create Schedule Event
 *
 * 创建日程事件用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { CreateScheduleRequest } from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleEventEvents, type ScheduleEventRefreshEvent } from './schedule-events';
import { Schedule } from '@dailyuse/domain-client/schedule';

/**
 * Create Schedule Event Input
 */
export type CreateScheduleEventInput = CreateScheduleRequest;

/**
 * Create Schedule Event
 */
export class CreateScheduleEvent {
  private static instance: CreateScheduleEvent;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): CreateScheduleEvent {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    CreateScheduleEvent.instance = new CreateScheduleEvent(client);
    return CreateScheduleEvent.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateScheduleEvent {
    if (!CreateScheduleEvent.instance) {
      CreateScheduleEvent.instance = CreateScheduleEvent.createInstance();
    }
    return CreateScheduleEvent.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateScheduleEvent.instance = undefined as unknown as CreateScheduleEvent;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(input: CreateScheduleEventInput): Promise<Schedule> {
    const dto = await this.apiClient.createSchedule(input);

    this.publishEvent(dto.uuid, ScheduleEventEvents.SCHEDULE_CREATED);

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

/**
 * 便捷函数
 */
export const createScheduleEvent = (input: CreateScheduleEventInput): Promise<Schedule> =>
  CreateScheduleEvent.getInstance().execute(input);
