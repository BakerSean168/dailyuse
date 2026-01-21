/**
 * Get Widget Config
 *
 * 获取用户的 Widget 配置
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { WidgetConfigResponse } from '@dailyuse/contracts/dashboard';

/**
 * Get Widget Config
 */
export class GetWidgetConfig {
  constructor(private readonly configRepository: IDashboardConfigRepository) {}

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
