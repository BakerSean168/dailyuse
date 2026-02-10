/**
 * Archive Goal
 *
 * 归档目标用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { Goal } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Archive Goal
 */
export class ArchiveGoal {
  private static instance: ArchiveGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): ArchiveGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ArchiveGoal.instance = new ArchiveGoal(client);
    return ArchiveGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ArchiveGoal {
    if (!ArchiveGoal.instance) {
      ArchiveGoal.instance = ArchiveGoal.createInstance();
    }
    return ArchiveGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ArchiveGoal.instance = undefined as unknown as ArchiveGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<Goal> {
    const data = await this.apiClient.archiveGoal(uuid);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const archiveGoal = (uuid: string): Promise<Goal> =>
  ArchiveGoal.getInstance().execute(uuid);
