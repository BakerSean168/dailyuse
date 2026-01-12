/**
 * Get Week Completion Rate
 *
 * 获取本周完成率用例
 */

import type { ITaskStatisticsApiClient } from '@dailyuse/infrastructure-client';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Week Completion Rate
 */
export class GetWeekCompletionRate {
  private static instance: GetWeekCompletionRate;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): GetWeekCompletionRate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    GetWeekCompletionRate.instance = new GetWeekCompletionRate(client);
    return GetWeekCompletionRate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetWeekCompletionRate {
    if (!GetWeekCompletionRate.instance) {
      GetWeekCompletionRate.instance = GetWeekCompletionRate.createInstance();
    }
    return GetWeekCompletionRate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetWeekCompletionRate.instance = undefined as unknown as GetWeekCompletionRate;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<number> {
    return this.apiClient.getWeekCompletionRate(accountUuid);
  }
}
