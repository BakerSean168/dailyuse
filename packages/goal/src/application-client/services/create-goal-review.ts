/**
 * Create Goal Review
 *
 * 创建目标复盘用例
 * 
 * **返回 Entity 对象**
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import type { CreateGoalReviewRequest } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';
import { GoalReview } from '@/domain-client';

/**
 * Create Goal Review
 */
export class CreateGoalReview {
  private static instance: CreateGoalReview;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CreateGoalReview {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateGoalReview.instance = new CreateGoalReview(client);
    return CreateGoalReview.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateGoalReview {
    if (!CreateGoalReview.instance) {
      CreateGoalReview.instance = CreateGoalReview.createInstance();
    }
    return CreateGoalReview.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateGoalReview.instance = undefined as unknown as CreateGoalReview;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReview> {
    const dto = await this.apiClient.createGoalReview(goalUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-created', {
      reviewUuid: dto.uuid,
    });

    return GoalReview.fromClientDTO(dto);
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
