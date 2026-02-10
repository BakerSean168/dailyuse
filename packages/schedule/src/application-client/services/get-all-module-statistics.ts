/**
 * Get All Module Statistics
 *
 * 获取所有模块统计信息用例
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import type { ModuleStatisticsClientDTO, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@/infrastructure-client';

/**
 * Get All Module Statistics
 */
export class GetAllModuleStatistics {
  private static instance: GetAllModuleStatistics;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetAllModuleStatistics {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetAllModuleStatistics.instance = new GetAllModuleStatistics(client);
    return GetAllModuleStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetAllModuleStatistics {
    if (!GetAllModuleStatistics.instance) {
      GetAllModuleStatistics.instance = GetAllModuleStatistics.createInstance();
    }
    return GetAllModuleStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetAllModuleStatistics.instance = undefined as unknown as GetAllModuleStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>> {
    return this.apiClient.getAllModuleStatistics();
  }
}

/**
 * 便捷函数
 */
export const getAllModuleStatistics = (): Promise<Record<SourceModule, ModuleStatisticsClientDTO>> =>
  GetAllModuleStatistics.getInstance().execute();
