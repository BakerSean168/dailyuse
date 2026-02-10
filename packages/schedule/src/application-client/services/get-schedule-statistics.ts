/**
 * Get Schedule Statistics
 *
 * 获取调度统计信息用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import type { ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@/infrastructure-client';

/**
 * Get Schedule Statistics
 */
export class GetScheduleStatistics {
  private static instance: GetScheduleStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetScheduleStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetScheduleStatistics.instance = new GetScheduleStatistics(client);
    return GetScheduleStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleStatistics {
    if (!GetScheduleStatistics.instance) {
      GetScheduleStatistics.instance = GetScheduleStatistics.createInstance();
    }
    return GetScheduleStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleStatistics.instance = undefined as unknown as GetScheduleStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<ScheduleStatisticsClientDTO> {
    return this.apiClient.getStatistics();
  }
}

/**
 * 便捷函数
 */
export const getScheduleStatistics = (): Promise<ScheduleStatisticsClientDTO> =>
  GetScheduleStatistics.getInstance().execute();
