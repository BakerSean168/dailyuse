/**
 * Delete Key Result
 *
 * 删除关键结果用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Delete Key Result
 */
export class DeleteKeyResult {
  private static instance: DeleteKeyResult;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): DeleteKeyResult {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteKeyResult.instance = new DeleteKeyResult(client);
    return DeleteKeyResult.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteKeyResult {
    if (!DeleteKeyResult.instance) {
      DeleteKeyResult.instance = DeleteKeyResult.createInstance();
    }
    return DeleteKeyResult.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteKeyResult.instance = undefined as unknown as DeleteKeyResult;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string, keyResultUuid: string): Promise<void> {
    await this.apiClient.deleteKeyResultForGoal(goalUuid, keyResultUuid);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-deleted', {
      keyResultUuid,
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
