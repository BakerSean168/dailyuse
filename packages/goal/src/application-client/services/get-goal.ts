/**
 * Get Goal
 *
 * 获取目标详情用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { Goal } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Get Goal
 */
export class GetGoal {
  private static instance: GetGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetGoal.instance = new GetGoal(client);
    return GetGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoal {
    if (!GetGoal.instance) {
      GetGoal.instance = GetGoal.createInstance();
    }
    return GetGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoal.instance = undefined as unknown as GetGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, includeChildren = true): Promise<Goal> {
    const data = await this.apiClient.getGoalById(uuid, includeChildren);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const getGoal = (uuid: string, includeChildren = true): Promise<Goal> =>
  GetGoal.getInstance().execute(uuid, includeChildren);
