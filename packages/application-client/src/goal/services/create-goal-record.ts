/**
 * Create Goal Record
 *
 * 创建目标记录用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalRecordClientDTO, CreateGoalRecordRequest } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent, type GoalAggregateRefreshReason } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Create Goal Record
 */
export class CreateGoalRecord {
  private static instance: CreateGoalRecord;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CreateGoalRecord {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateGoalRecord.instance = new CreateGoalRecord(client);
    return CreateGoalRecord.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateGoalRecord {
    if (!CreateGoalRecord.instance) {
      CreateGoalRecord.instance = CreateGoalRecord.createInstance();
    }
    return CreateGoalRecord.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateGoalRecord.instance = undefined as unknown as CreateGoalRecord;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    const data = await this.apiClient.createGoalRecord(goalUuid, keyResultUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'goal-record-created', {
      keyResultUuid,
      goalRecordUuid: data.uuid,
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
