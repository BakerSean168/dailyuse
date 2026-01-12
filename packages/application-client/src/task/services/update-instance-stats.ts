/**
 * Update Instance Stats
 *
 * 更新实例统计信息用例
 */

import type { ITaskStatisticsApiClient } from '@dailyuse/infrastructure-client';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Instance Stats
 */
export class UpdateInstanceStats {
  private static instance: UpdateInstanceStats;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): UpdateInstanceStats {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    UpdateInstanceStats.instance = new UpdateInstanceStats(client);
    return UpdateInstanceStats.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateInstanceStats {
    if (!UpdateInstanceStats.instance) {
      UpdateInstanceStats.instance = UpdateInstanceStats.createInstance();
    }
    return UpdateInstanceStats.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateInstanceStats.instance = undefined as unknown as UpdateInstanceStats;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    await this.apiClient.updateInstanceStats(accountUuid);
  }
}
