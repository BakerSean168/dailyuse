/**
 * Delete Goal Record
 *
 * 删除目标记录用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Delete Goal Record
 */
export class DeleteGoalRecord {
  private static instance: DeleteGoalRecord;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): DeleteGoalRecord {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteGoalRecord.instance = new DeleteGoalRecord(client);
    return DeleteGoalRecord.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteGoalRecord {
    if (!DeleteGoalRecord.instance) {
      DeleteGoalRecord.instance = DeleteGoalRecord.createInstance();
    }
    return DeleteGoalRecord.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteGoalRecord.instance = undefined as unknown as DeleteGoalRecord;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    await this.apiClient.deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);

    this.publishGoalRefreshEvent(goalUuid, 'goal-record-deleted', {
      keyResultUuid,
      goalRecordUuid: recordUuid,
    });
  }

  /**
   * 发布 Goal 刷新事件
   */
  private publishGoalRefreshEvent(
    goalUuid: string,
    reason: GoalAggregateRefreshReason,
    metadata?: Record<string, unknown>,
  ): void {
    const event: GoalAggregateRefreshEvent = {
      goalUuid,
      reason,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
  }
}
