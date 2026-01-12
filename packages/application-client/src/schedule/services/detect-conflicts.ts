/**
 * Detect Conflicts
 *
 * 检测日程冲突用例
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { ConflictDetectionResult } from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleEventEvents, type ScheduleConflictEvent } from './schedule-events';

/**
 * Detect Conflicts
 */
export class DetectConflicts {
  private static instance: DetectConflicts;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): DetectConflicts {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    DetectConflicts.instance = new DetectConflicts(client);
    return DetectConflicts.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DetectConflicts {
    if (!DetectConflicts.instance) {
      DetectConflicts.instance = DetectConflicts.createInstance();
    }
    return DetectConflicts.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DetectConflicts.instance = undefined as unknown as DetectConflicts;
  }

  /**
   * 执行用例
   */
  async execute(
    userId: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string,
  ): Promise<ConflictDetectionResult> {
    const result = await this.apiClient.detectConflicts({ userId, startTime, endTime, excludeUuid });

    if (result.hasConflict) {
      this.publishConflictEvent(
        excludeUuid || 'new',
        result.conflicts.map(c => c.scheduleUuid),
      );
    }

    return result;
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
