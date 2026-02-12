/**
 * Complete Goal
 *
 * 完成目标用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { Goal } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Complete Goal
 */
export class CompleteGoal {
  private static instance: CompleteGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CompleteGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CompleteGoal.instance = new CompleteGoal(client);
    return CompleteGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CompleteGoal {
    if (!CompleteGoal.instance) {
      CompleteGoal.instance = CompleteGoal.createInstance();
    }
    return CompleteGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CompleteGoal.instance = undefined as unknown as CompleteGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<Goal> {
    const data = await this.apiClient.completeGoal(uuid);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const completeGoal = (uuid: string): Promise<Goal> =>
  CompleteGoal.getInstance().execute(uuid);
