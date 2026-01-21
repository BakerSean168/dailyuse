/**
 * Update Widget Config
 *
 * 更新用户的 Widget 配置
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type {
  UpdateWidgetConfigRequest,
  WidgetConfigResponse,
} from '@dailyuse/contracts/dashboard';

/**
 * Update Widget Config
 */
export class UpdateWidgetConfig {
  constructor(private readonly configRepository: IDashboardConfigRepository) {}

  /**
   * 执行用例
   * 采用部分更新策略（合并）
   */
  async execute(
    accountUuid: string,
    input: UpdateWidgetConfigRequest,
  ): Promise<WidgetConfigResponse> {
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
