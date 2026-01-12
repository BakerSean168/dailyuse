/**
 * Update Template Stats
 *
 * 更新模板统计信息用例
 */

import type { ITaskStatisticsApiClient } from '@dailyuse/infrastructure-client';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Template Stats
 */
export class UpdateTemplateStats {
  private static instance: UpdateTemplateStats;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): UpdateTemplateStats {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    UpdateTemplateStats.instance = new UpdateTemplateStats(client);
    return UpdateTemplateStats.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateTemplateStats {
    if (!UpdateTemplateStats.instance) {
      UpdateTemplateStats.instance = UpdateTemplateStats.createInstance();
    }
    return UpdateTemplateStats.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateTemplateStats.instance = undefined as unknown as UpdateTemplateStats;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    await this.apiClient.updateTemplateStats(accountUuid);
  }
}
