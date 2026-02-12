/**
 * Get Today Completion Rate
 *
 * 获取今日完成率用例
 */

import type { ITaskStatisticsApiClient } from '../../infrastructure-client/adapters/types';
import { TaskContainer } from '../../infrastructure-client/task.container';

/**
 * Get Today Completion Rate
 */
export class GetTodayCompletionRate {
  private static instance: GetTodayCompletionRate;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): GetTodayCompletionRate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    GetTodayCompletionRate.instance = new GetTodayCompletionRate(client);
    return GetTodayCompletionRate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTodayCompletionRate {
    if (!GetTodayCompletionRate.instance) {
      GetTodayCompletionRate.instance = GetTodayCompletionRate.createInstance();
    }
    return GetTodayCompletionRate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTodayCompletionRate.instance = undefined as unknown as GetTodayCompletionRate;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<number> {
    return this.apiClient.getTodayCompletionRate(accountUuid);
  }
}
