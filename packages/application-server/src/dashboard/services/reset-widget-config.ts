/**
 * Reset Widget Config
 *
 * 重置用户的 Widget 配置为默认值
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { WidgetConfigResponse } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-server';

/**
 * Reset Widget Config
 */
export class ResetWidgetConfig {
  private static instance: ResetWidgetConfig;

  private constructor(private readonly configRepository: IDashboardConfigRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(configRepository?: IDashboardConfigRepository): ResetWidgetConfig {
    const container = DashboardContainer.getInstance();
    const repo = configRepository || container.getDashboardConfigRepository();
    ResetWidgetConfig.instance = new ResetWidgetConfig(repo);
    return ResetWidgetConfig.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResetWidgetConfig {
    if (!ResetWidgetConfig.instance) {
      ResetWidgetConfig.instance = ResetWidgetConfig.createInstance();
    }
    return ResetWidgetConfig.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResetWidgetConfig.instance = undefined as unknown as ResetWidgetConfig;
  }

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
