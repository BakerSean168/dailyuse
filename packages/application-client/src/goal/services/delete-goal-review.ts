/**
 * Delete Goal Review
 *
 * 删除目标复盘用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Delete Goal Review
 */
export class DeleteGoalReview {
  private static instance: DeleteGoalReview;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): DeleteGoalReview {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteGoalReview.instance = new DeleteGoalReview(client);
    return DeleteGoalReview.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteGoalReview {
    if (!DeleteGoalReview.instance) {
      DeleteGoalReview.instance = DeleteGoalReview.createInstance();
    }
    return DeleteGoalReview.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteGoalReview.instance = undefined as unknown as DeleteGoalReview;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string, reviewUuid: string): Promise<void> {
    await this.apiClient.deleteGoalReview(goalUuid, reviewUuid);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-deleted', {
      reviewUuid,
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
