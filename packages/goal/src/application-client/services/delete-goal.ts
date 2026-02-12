/**
 * Delete Goal
 *
 * 删除目标用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Delete Goal
 */
export class DeleteGoal {
  private static instance: DeleteGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): DeleteGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteGoal.instance = new DeleteGoal(client);
    return DeleteGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteGoal {
    if (!DeleteGoal.instance) {
      DeleteGoal.instance = DeleteGoal.createInstance();
    }
    return DeleteGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteGoal.instance = undefined as unknown as DeleteGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteGoal(uuid);
  }
}

/**
 * 便捷函数
 */
export const deleteGoal = (uuid: string): Promise<void> =>
  DeleteGoal.getInstance().execute(uuid);
