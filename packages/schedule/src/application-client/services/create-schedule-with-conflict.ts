/**
 * Create Schedule With Conflict
 *
 * 创建日程（带冲突检测）用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '../../infrastructure-client/adapters/types';
import type {
  CreateScheduleRequest,
  ConflictDetectionResult,
} from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleEventEvents, type ScheduleEventRefreshEvent, type ScheduleConflictEvent } from './schedule-events';
import { Schedule } from '../../domain-client/aggregates/schedule';

/**
 * Create Schedule With Conflict Input
 */
export type CreateScheduleWithConflictInput = CreateScheduleRequest;

/**
 * Create Schedule With Conflict Result
 */
export interface CreateScheduleWithConflictResult {
  schedule: Schedule;
  conflicts?: ConflictDetectionResult;
}

/**
 * Create Schedule With Conflict
 */
export class CreateScheduleWithConflict {
  private static instance: CreateScheduleWithConflict;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): CreateScheduleWithConflict {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    CreateScheduleWithConflict.instance = new CreateScheduleWithConflict(client);
    return CreateScheduleWithConflict.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateScheduleWithConflict {
    if (!CreateScheduleWithConflict.instance) {
      CreateScheduleWithConflict.instance = CreateScheduleWithConflict.createInstance();
    }
    return CreateScheduleWithConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateScheduleWithConflict.instance = undefined as unknown as CreateScheduleWithConflict;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(input: CreateScheduleWithConflictInput): Promise<CreateScheduleWithConflictResult> {
    const result = await this.apiClient.createScheduleWithConflictDetection(input);

    this.publishEvent(result.schedule.uuid, ScheduleEventEvents.SCHEDULE_CREATED);

    if (result.conflicts?.hasConflict) {
      this.publishConflictEvent(
        result.schedule.uuid,
        result.conflicts.conflicts.map(c => c.scheduleUuid),
      );
    }

    return {
      schedule: Schedule.fromClientDTO(result.schedule),
      conflicts: result.conflicts,
    };
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

  /**
   * 发布冲突事件
   */
  private publishConflictEvent(scheduleUuid: string, conflictingUuids: string[]): void {
    const event: ScheduleConflictEvent = {
      scheduleUuid,
      conflictingUuids,
      reason: ScheduleEventEvents.CONFLICT_DETECTED,
      timestamp: Date.now(),
    };
    eventBus.emit(ScheduleEventEvents.CONFLICT_DETECTED, event);
  }
}

/**
 * 便捷函数
 */
export const createScheduleWithConflict = (
  input: CreateScheduleWithConflictInput,
): Promise<CreateScheduleWithConflictResult> =>
  CreateScheduleWithConflict.getInstance().execute(input);
