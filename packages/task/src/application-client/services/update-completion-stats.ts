/**
 * Update Completion Stats
 *
 * 更新完成统计信息用例
 */

import type { ITaskStatisticsApiClient } from '../../infrastructure-client/adapters/types';
import { TaskContainer } from '../../infrastructure-client/task.container';

/**
 * Update Completion Stats
 */
export class UpdateCompletionStats {
  private static instance: UpdateCompletionStats;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): UpdateCompletionStats {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    UpdateCompletionStats.instance = new UpdateCompletionStats(client);
    return UpdateCompletionStats.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateCompletionStats {
    if (!UpdateCompletionStats.instance) {
      UpdateCompletionStats.instance = UpdateCompletionStats.createInstance();
    }
    return UpdateCompletionStats.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateCompletionStats.instance = undefined as unknown as UpdateCompletionStats;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    await this.apiClient.updateCompletionStats(accountUuid);
  }
}
