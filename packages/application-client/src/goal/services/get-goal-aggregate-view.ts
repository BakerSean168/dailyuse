/**
 * Get Goal Aggregate View
 *
 * 获取目标聚合视图用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO, GoalAggregateViewResponse } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Goal Aggregate View
 */
export class GetGoalAggregateView {
  private static instance: GetGoalAggregateView;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoalAggregateView {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetGoalAggregateView.instance = new GetGoalAggregateView(client);
    return GetGoalAggregateView.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalAggregateView {
    if (!GetGoalAggregateView.instance) {
      GetGoalAggregateView.instance = GetGoalAggregateView.createInstance();
    }
    return GetGoalAggregateView.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalAggregateView.instance = undefined as unknown as GetGoalAggregateView;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string): Promise<{
    goal: Goal;
    rawResponse: GoalAggregateViewResponse;
  }> {
    const data = await this.apiClient.getGoalAggregateView(goalUuid);
    const goal = Goal.fromClientDTO(data.goal as GoalClientDTO);

    return {
      goal,
      rawResponse: data,
    };
  }
}
