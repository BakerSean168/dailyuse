/**
 * Get Progress Breakdown
 *
 * 获取目标进度分解详情用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Get Progress Breakdown
 */
export class GetProgressBreakdown {
  private static instance: GetProgressBreakdown;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetProgressBreakdown {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetProgressBreakdown.instance = new GetProgressBreakdown(client);
    return GetProgressBreakdown.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetProgressBreakdown {
    if (!GetProgressBreakdown.instance) {
      GetProgressBreakdown.instance = GetProgressBreakdown.createInstance();
    }
    return GetProgressBreakdown.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetProgressBreakdown.instance = undefined as unknown as GetProgressBreakdown;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string): Promise<ProgressBreakdown> {
    return this.apiClient.getProgressBreakdown(goalUuid);
  }
}

/**
 * 便捷函数
 */
export const getProgressBreakdown = (goalUuid: string): Promise<ProgressBreakdown> =>
  GetProgressBreakdown.getInstance().execute(goalUuid);
