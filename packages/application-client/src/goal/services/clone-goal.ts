/**
 * Clone Goal
 *
 * 克隆目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Clone Goal
 */
export class CloneGoal {
  private static instance: CloneGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): CloneGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CloneGoal.instance = new CloneGoal(client);
    return CloneGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CloneGoal {
    if (!CloneGoal.instance) {
      CloneGoal.instance = CloneGoal.createInstance();
    }
    return CloneGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CloneGoal.instance = undefined as unknown as CloneGoal;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    options: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    } = {},
  ): Promise<Goal> {
    const data = await this.apiClient.cloneGoal(goalUuid, options);
    return Goal.fromClientDTO(data);
  }
}
