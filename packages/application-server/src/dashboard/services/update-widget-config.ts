/**
 * Update Widget Config
 *
 * 更新用户的 Widget 配置
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { UpdateWidgetConfigRequest, WidgetConfigResponse } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-server';

/**
 * Update Widget Config
 */
export class UpdateWidgetConfig {
  private static instance: UpdateWidgetConfig;

  private constructor(private readonly configRepository: IDashboardConfigRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(configRepository?: IDashboardConfigRepository): UpdateWidgetConfig {
    const container = DashboardContainer.getInstance();
    const repo = configRepository || container.getDashboardConfigRepository();
    UpdateWidgetConfig.instance = new UpdateWidgetConfig(repo);
    return UpdateWidgetConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateWidgetConfig {
    if (!UpdateWidgetConfig.instance) {
      UpdateWidgetConfig.instance = UpdateWidgetConfig.createInstance();
    }
    return UpdateWidgetConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateWidgetConfig.instance = undefined as unknown as UpdateWidgetConfig;
  }

  /**
   * 执行用例
   * 采用部分更新策略（合并）
   */
  async execute(accountUuid: string, input: UpdateWidgetConfigRequest): Promise<WidgetConfigResponse> {
    const { configs } = input;

    try {
      let config = await this.configRepository.findByAccountUuid(accountUuid);

      if (!config) {
        config = DashboardConfig.createDefault(accountUuid);
      }

      config.updateWidgetConfig(configs);

      const savedConfig = await this.configRepository.save(config);
      return { widgetConfig: savedConfig.widgetConfig };
    } catch (error) {
      console.error(
        `[UpdateWidgetConfig] Error updating widget config for account=${accountUuid}:`,
        error,
      );
      throw error;
    }
  }
}
