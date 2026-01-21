/**
 * Reset Widget Config
 *
 * 重置用户的 Widget 配置为默认值
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { WidgetConfigResponse } from '@dailyuse/contracts/dashboard';

/**
 * Reset Widget Config
 */
export class ResetWidgetConfig {
  constructor(private readonly configRepository: IDashboardConfigRepository) {}

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<WidgetConfigResponse> {
    try {
      let config = await this.configRepository.findByAccountUuid(accountUuid);

      if (!config) {
        config = DashboardConfig.createDefault(accountUuid);
      } else {
        config.resetToDefault();
      }

      const savedConfig = await this.configRepository.save(config);
      return { widgetConfig: savedConfig.widgetConfig };
    } catch (error) {
      console.error(
        `[ResetWidgetConfig] Error resetting widget config for account=${accountUuid}:`,
        error,
      );
      throw error;
    }
  }
}
