/**
 * Create Key Result
 *
 * 为目标创建关键结果用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { KeyResultClientDTO, AddKeyResultRequest } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Create Key Result
 */
export class CreateKeyResult {
  private static instance: CreateKeyResult;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CreateKeyResult {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateKeyResult.instance = new CreateKeyResult(client);
    return CreateKeyResult.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateKeyResult {
    if (!CreateKeyResult.instance) {
      CreateKeyResult.instance = CreateKeyResult.createInstance();
    }
    return CreateKeyResult.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateKeyResult.instance = undefined as unknown as CreateKeyResult;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    const data = await this.apiClient.addKeyResultForGoal(goalUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-created', {
      keyResultUuid: data.uuid,
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
