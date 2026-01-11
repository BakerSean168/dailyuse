/**
 * Get Widget Config
 *
 * 获取用户的 Widget 配置
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { WidgetConfigResponse } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Widget Config
 */
export class GetWidgetConfig {
  private static instance: GetWidgetConfig;

  private constructor(private readonly configRepository: IDashboardConfigRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(configRepository?: IDashboardConfigRepository): GetWidgetConfig {
    const container = DashboardContainer.getInstance();
    const repo = configRepository || container.getDashboardConfigRepository();
    GetWidgetConfig.instance = new GetWidgetConfig(repo);
    return GetWidgetConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetWidgetConfig {
    if (!GetWidgetConfig.instance) {
      GetWidgetConfig.instance = GetWidgetConfig.createInstance();
    }
    return GetWidgetConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetWidgetConfig.instance = undefined as unknown as GetWidgetConfig;
  }

  /**
   * 执行用例
   * 如果用户没有配置，创建并保存默认配置
   */
  async execute(accountUuid: string): Promise<WidgetConfigResponse> {
    try {
      const config = await this.configRepository.findByAccountUuid(accountUuid);

      if (config) {
        return { widgetConfig: config.widgetConfig };
      }

      console.log(`[GetWidgetConfig] Creating default config for account=${accountUuid}`);
      const defaultConfig = DashboardConfig.createDefault(accountUuid);
      const savedConfig = await this.configRepository.save(defaultConfig);
      console.log(
        `[GetWidgetConfig] Default config saved for account=${accountUuid}`,
        savedConfig.widgetConfig,
      );

      return { widgetConfig: savedConfig.widgetConfig };
    } catch (error) {
      console.error(
        `[GetWidgetConfig] Error getting widget config for account=${accountUuid}:`,
        error,
      );
      const defaultConfig = DashboardConfig.createDefault(accountUuid);
      return { widgetConfig: defaultConfig.widgetConfig };
    }
  }
}
