/**
 * Update Key Result
 *
 * 更新关键结果用例
 * 
 * **返回 Entity 对象**
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import type { UpdateKeyResultRequest } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';
import { KeyResult } from '@/domain-client';

/**
 * Update Key Result
 */
export class UpdateKeyResult {
  private static instance: UpdateKeyResult;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): UpdateKeyResult {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateKeyResult.instance = new UpdateKeyResult(client);
    return UpdateKeyResult.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateKeyResult {
    if (!UpdateKeyResult.instance) {
      UpdateKeyResult.instance = UpdateKeyResult.createInstance();
    }
    return UpdateKeyResult.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateKeyResult.instance = undefined as unknown as UpdateKeyResult;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResult> {
    const dto = await this.apiClient.updateKeyResultForGoal(goalUuid, keyResultUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {
      keyResultUuid,
    });

    return KeyResult.fromClientDTO(dto);
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
