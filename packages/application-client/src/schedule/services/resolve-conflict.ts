/**
 * Resolve Conflict
 *
 * 解决日程冲突用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type {
  ConflictDetectionResult,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleEventEvents, type ScheduleEventRefreshEvent } from './schedule-events';
import { Schedule } from '@dailyuse/domain-client/schedule';

/**
 * Resolve Conflict Result
 */
export interface ResolveConflictResult {
  schedule: Schedule;
  conflicts: ConflictDetectionResult;
  applied: {
    strategy: string;
    previousStartTime?: number;
    previousEndTime?: number;
    changes: string[];
  };
}

/**
 * Resolve Conflict
 */
export class ResolveConflict {
  private static instance: ResolveConflict;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): ResolveConflict {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    ResolveConflict.instance = new ResolveConflict(client);
    return ResolveConflict.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResolveConflict {
    if (!ResolveConflict.instance) {
      ResolveConflict.instance = ResolveConflict.createInstance();
    }
    return ResolveConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResolveConflict.instance = undefined as unknown as ResolveConflict;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(scheduleUuid: string, request: ResolveConflictRequest): Promise<ResolveConflictResult> {
    const result = await this.apiClient.resolveConflict(scheduleUuid, request);

    this.publishEvent(result.schedule.uuid, ScheduleEventEvents.CONFLICT_RESOLVED, {
      strategy: result.applied.strategy,
      changes: result.applied.changes,
    });

    return {
      schedule: Schedule.fromClientDTO(result.schedule),
      conflicts: result.conflicts,
      applied: result.applied,
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
}
