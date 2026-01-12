/**
 * Update Goal Review
 *
 * 更新目标复盘用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalReviewClientDTO, UpdateGoalReviewRequest } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Goal Review
 */
export class UpdateGoalReview {
  private static instance: UpdateGoalReview;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): UpdateGoalReview {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateGoalReview.instance = new UpdateGoalReview(client);
    return UpdateGoalReview.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoalReview {
    if (!UpdateGoalReview.instance) {
      UpdateGoalReview.instance = UpdateGoalReview.createInstance();
    }
    return UpdateGoalReview.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoalReview.instance = undefined as unknown as UpdateGoalReview;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    reviewUuid: string,
    request: UpdateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    const data = await this.apiClient.updateGoalReview(goalUuid, reviewUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-updated', {
      reviewUuid,
    });

    return data;
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
