/**
 * Create Goal
 *
 * 创建目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { CreateGoalRequest } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Create Goal
 */
export class CreateGoal {
  private static instance: CreateGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CreateGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateGoal.instance = new CreateGoal(client);
    return CreateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateGoal {
    if (!CreateGoal.instance) {
      CreateGoal.instance = CreateGoal.createInstance();
    }
    return CreateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateGoal.instance = undefined as unknown as CreateGoal;
  }

  /**
   * 执行用例
   */
  async execute(request: CreateGoalRequest): Promise<Goal> {
    const goalData = await this.apiClient.createGoal(request);
    return Goal.fromClientDTO(goalData);
  }
}
