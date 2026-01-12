/**
 * Update Dashboard Config
 *
 * 更新仪表盘配置用例
 */

import type { IDashboardApiClient } from '@dailyuse/infrastructure-client';
import type { DashboardConfigClientDTO } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-client';
import { DashboardConfig } from '@dailyuse/domain-client/dashboard';

/**
 * Update Dashboard Config Input
 */
export type UpdateDashboardConfigInput = Partial<DashboardConfigClientDTO>;

/**
 * Update Dashboard Config
 */
export class UpdateDashboardConfig {
  private static instance: UpdateDashboardConfig;

  private constructor(private readonly apiClient: IDashboardApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IDashboardApiClient): UpdateDashboardConfig {
    const container = DashboardContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateDashboardConfig.instance = new UpdateDashboardConfig(client);
    return UpdateDashboardConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateDashboardConfig {
    if (!UpdateDashboardConfig.instance) {
      UpdateDashboardConfig.instance = UpdateDashboardConfig.createInstance();
    }
    return UpdateDashboardConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateDashboardConfig.instance = undefined as unknown as UpdateDashboardConfig;
  }

  /**
   * 执行用例
   */
  async execute(input: UpdateDashboardConfigInput): Promise<DashboardConfig> {
    const dto = await this.apiClient.updateConfig(input);
    return DashboardConfig.fromDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const updateDashboardConfig = (
  input: UpdateDashboardConfigInput,
): Promise<DashboardConfig> =>
  UpdateDashboardConfig.getInstance().execute(input);
