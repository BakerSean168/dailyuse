/**
 * Reset Dashboard Config
 *
 * 重置仪表盘配置为默认用例
 */

import type { IDashboardApiClient } from '@dailyuse/infrastructure-client';
import { DashboardContainer } from '@dailyuse/infrastructure-client';
import { DashboardConfig } from '@dailyuse/domain-client/dashboard';

/**
 * Reset Dashboard Config
 */
export class ResetDashboardConfig {
  private static instance: ResetDashboardConfig;

  private constructor(private readonly apiClient: IDashboardApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IDashboardApiClient): ResetDashboardConfig {
    const container = DashboardContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ResetDashboardConfig.instance = new ResetDashboardConfig(client);
    return ResetDashboardConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResetDashboardConfig {
    if (!ResetDashboardConfig.instance) {
      ResetDashboardConfig.instance = ResetDashboardConfig.createInstance();
    }
    return ResetDashboardConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResetDashboardConfig.instance = undefined as unknown as ResetDashboardConfig;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<DashboardConfig> {
    const dto = await this.apiClient.resetConfig();
    return DashboardConfig.fromDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const resetDashboardConfig = (): Promise<DashboardConfig> =>
  ResetDashboardConfig.getInstance().execute();
