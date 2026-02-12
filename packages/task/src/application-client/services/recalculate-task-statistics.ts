/**
 * Recalculate Task Statistics
 *
 * 重新计算任务统计用例
 */

import type { ITaskStatisticsApiClient } from '../../infrastructure-client/adapters/types';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '../../infrastructure-client/task.container';

/**
 * Recalculate Task Statistics
 */
export class RecalculateTaskStatistics {
  private static instance: RecalculateTaskStatistics;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): RecalculateTaskStatistics {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    RecalculateTaskStatistics.instance = new RecalculateTaskStatistics(client);
    return RecalculateTaskStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RecalculateTaskStatistics {
    if (!RecalculateTaskStatistics.instance) {
      RecalculateTaskStatistics.instance = RecalculateTaskStatistics.createInstance();
    }
    return RecalculateTaskStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RecalculateTaskStatistics.instance = undefined as unknown as RecalculateTaskStatistics;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string, force = true): Promise<TaskStatisticsServerDTO> {
    return this.apiClient.recalculateTaskStatistics(accountUuid, force);
  }
}
