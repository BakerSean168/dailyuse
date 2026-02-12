/**
 * Get Module Statistics
 *
 * 获取模块统计信息用例
 */

import type { IScheduleTaskApiClient } from '../../infrastructure-client/adapters/types';
import type { ModuleStatisticsClientDTO, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';

/**
 * Get Module Statistics
 */
export class GetModuleStatistics {
  private static instance: GetModuleStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetModuleStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetModuleStatistics.instance = new GetModuleStatistics(client);
    return GetModuleStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetModuleStatistics {
    if (!GetModuleStatistics.instance) {
      GetModuleStatistics.instance = GetModuleStatistics.createInstance();
    }
    return GetModuleStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetModuleStatistics.instance = undefined as unknown as GetModuleStatistics;
  }

  /**
   * 执行用例
   */
  async execute(module: SourceModule): Promise<ModuleStatisticsClientDTO> {
    return this.apiClient.getModuleStatistics(module);
  }
}

/**
 * 便捷函数
 */
export const getModuleStatistics = (module: SourceModule): Promise<ModuleStatisticsClientDTO> =>
  GetModuleStatistics.getInstance().execute(module);
