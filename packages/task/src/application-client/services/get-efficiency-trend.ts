/**
 * Get Efficiency Trend
 *
 * 获取效率趋势用例
 */

import type { ITaskStatisticsApiClient } from '@/infrastructure-client';
import { TaskContainer } from '@/infrastructure-client';

/**
 * Efficiency trend type
 */
export type EfficiencyTrend = 'UP' | 'DOWN' | 'STABLE';

/**
 * Get Efficiency Trend
 */
export class GetEfficiencyTrend {
  private static instance: GetEfficiencyTrend;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): GetEfficiencyTrend {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    GetEfficiencyTrend.instance = new GetEfficiencyTrend(client);
    return GetEfficiencyTrend.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetEfficiencyTrend {
    if (!GetEfficiencyTrend.instance) {
      GetEfficiencyTrend.instance = GetEfficiencyTrend.createInstance();
    }
    return GetEfficiencyTrend.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetEfficiencyTrend.instance = undefined as unknown as GetEfficiencyTrend;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<EfficiencyTrend> {
    return this.apiClient.getEfficiencyTrend(accountUuid);
  }
}
