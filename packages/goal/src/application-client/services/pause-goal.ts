/**
 * Pause Goal
 *
 * 暂停目标用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { Goal } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Pause Goal
 */
export class PauseGoal {
  private static instance: PauseGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): PauseGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    PauseGoal.instance = new PauseGoal(client);
    return PauseGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): PauseGoal {
    if (!PauseGoal.instance) {
      PauseGoal.instance = PauseGoal.createInstance();
    }
    return PauseGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    PauseGoal.instance = undefined as unknown as PauseGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<Goal> {
    const data = await this.apiClient.pauseGoal(uuid);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const pauseGoal = (uuid: string): Promise<Goal> =>
  PauseGoal.getInstance().execute(uuid);
