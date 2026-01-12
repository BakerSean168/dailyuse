/**
 * Get Dashboard Config
 *
 * 获取仪表盘配置用例
 */

import type { IDashboardApiClient } from '@dailyuse/infrastructure-client';
import { DashboardContainer } from '@dailyuse/infrastructure-client';
import { DashboardConfig } from '@dailyuse/domain-client/dashboard';

/**
 * Get Dashboard Config
 */
export class GetDashboardConfig {
  private static instance: GetDashboardConfig;

  private constructor(private readonly apiClient: IDashboardApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IDashboardApiClient): GetDashboardConfig {
    const container = DashboardContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetDashboardConfig.instance = new GetDashboardConfig(client);
    return GetDashboardConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDashboardConfig {
    if (!GetDashboardConfig.instance) {
      GetDashboardConfig.instance = GetDashboardConfig.createInstance();
    }
    return GetDashboardConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDashboardConfig.instance = undefined as unknown as GetDashboardConfig;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<DashboardConfig> {
    const dto = await this.apiClient.getConfig();
    return DashboardConfig.fromDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const getDashboardConfig = (): Promise<DashboardConfig> =>
  GetDashboardConfig.getInstance().execute();
