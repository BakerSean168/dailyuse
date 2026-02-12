/**
 * Delete Task Statistics
 *
 * 删除任务统计数据用例
 */

import type { ITaskStatisticsApiClient } from '../../infrastructure-client/adapters/types';
import { TaskContainer } from '../../infrastructure-client/task.container';

/**
 * Delete Task Statistics
 */
export class DeleteTaskStatistics {
  private static instance: DeleteTaskStatistics;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): DeleteTaskStatistics {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    DeleteTaskStatistics.instance = new DeleteTaskStatistics(client);
    return DeleteTaskStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteTaskStatistics {
    if (!DeleteTaskStatistics.instance) {
      DeleteTaskStatistics.instance = DeleteTaskStatistics.createInstance();
    }
    return DeleteTaskStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteTaskStatistics.instance = undefined as unknown as DeleteTaskStatistics;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    await this.apiClient.deleteTaskStatistics(accountUuid);
  }
}
