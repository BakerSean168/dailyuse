/**
 * Batch Update Key Result Weights
 *
 * 批量更新关键结果权重用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import type { KeyResultsResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Batch Update Key Result Weights
 */
export class BatchUpdateKeyResultWeights {
  private static instance: BatchUpdateKeyResultWeights;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): BatchUpdateKeyResultWeights {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    BatchUpdateKeyResultWeights.instance = new BatchUpdateKeyResultWeights(client);
    return BatchUpdateKeyResultWeights.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): BatchUpdateKeyResultWeights {
    if (!BatchUpdateKeyResultWeights.instance) {
      BatchUpdateKeyResultWeights.instance = BatchUpdateKeyResultWeights.createInstance();
    }
    return BatchUpdateKeyResultWeights.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    BatchUpdateKeyResultWeights.instance = undefined as unknown as BatchUpdateKeyResultWeights;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    updates: Array<{ keyResultUuid: string; weight: number }>,
  ): Promise<KeyResultsResponse> {
    const data = await this.apiClient.batchUpdateKeyResultWeights(goalUuid, { updates });

    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {});

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
