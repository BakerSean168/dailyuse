/**
 * @file DashboardConfigApplicationService.ts
 * @description Dashboard 配置应用服务，管理用户的 Dashboard Widget 配置。
 * @date 2025-01-22
 */

import type { DashboardContainer } from '@dailyuse/infrastructure-server';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { DashboardConfigServerDTO, WidgetConfigDTO, WidgetConfigData } from '@dailyuse/contracts/dashboard';


/**
 * Dashboard 配置应用服务。
 *
 * @remarks
 * 负责处理仪表板配置的业务逻辑，包括：
 * - 获取用户的 Widget 配置（支持默认配置自动创建）
 * - 更新 Widget 配置（支持部分更新）
 * - 重置配置为默认值
 */
export class DashboardConfigApplicationService {
  constructor(private container: DashboardContainer) {}

  /**
   * 获取用户的 Widget 配置。
   *
   * @remarks
   * 如果用户尚无配置记录，将自动创建并保存默认配置。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<WidgetConfigData>} Widget 配置数据
   */
  async getWidgetConfig(accountUuid: string): Promise<WidgetConfigData> {
    try {
      const repository = this.container.getDashboardConfigRepository();
      const config = await repository.findByAccountUuid(accountUuid);

      if (config) {
        return config.widgetConfig;
      }

      // 用户没有配置，创建默认配置并保存到数据库
      console.log(
        `[DashboardConfigApplicationService] Creating default config for account=${accountUuid}`,
      );
      const defaultConfig = DashboardConfig.createDefault(accountUuid);
      const savedConfig = await repository.save(defaultConfig);
      console.log(
        `[DashboardConfigApplicationService] Default config saved for account=${accountUuid}`,
        savedConfig.widgetConfig,
      );

      return savedConfig.widgetConfig;
    } catch (error) {
      console.error(
        `[DashboardConfigApplicationService] Error getting widget config for account=${accountUuid}:`,
        error,
      );
      // 出错时返回默认配置（但不保存，避免在错误状态下写入数据库）
      const defaultConfig = DashboardConfig.createDefault(accountUuid);
      return defaultConfig.widgetConfig;
    }
  }

  /**
   * 更新用户的 Widget 配置。
   *
   * @remarks
   * 采用部分更新策略，将传入的配置与现有配置合并。
   *
   * @param accountUuid - 账户 UUID
   * @param configs - 部分 Widget 配置数据
   * @returns {Promise<WidgetConfigData>} 更新后的完整配置
   */
  async updateWidgetConfig(
    accountUuid: string,
    configs: Partial<WidgetConfigData>,
  ): Promise<WidgetConfigData> {
    try {
      const repository = this.container.getDashboardConfigRepository();

      // 获取或创建配置
      let config = await repository.findByAccountUuid(accountUuid);

      if (!config) {
        // 创建新配置
        config = DashboardConfig.createDefault(accountUuid);
      }

      // 使用聚合根的业务方法更新配置
      config.updateWidgetConfig(configs);

      // 保存到仓储
      const savedConfig = await repository.save(config);
      return savedConfig.widgetConfig;
    } catch (error) {
      console.error(
        `[DashboardConfigApplicationService] Error updating widget config for account=${accountUuid}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * 重置为默认配置。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<WidgetConfigData>} 重置后的默认配置
   */
  async resetWidgetConfig(accountUuid: string): Promise<WidgetConfigData> {
    try {
      const repository = this.container.getDashboardConfigRepository();

      // 获取或创建配置
      let config = await repository.findByAccountUuid(accountUuid);

      if (!config) {
        config = DashboardConfig.createDefault(accountUuid);
      } else {
        // 使用聚合根的业务方法重置
        config.resetToDefault();
      }

      // 保存到仓储
      const savedConfig = await repository.save(config);
      return savedConfig.widgetConfig;
    } catch (error) {
      console.error(
        `[DashboardConfigApplicationService] Error resetting widget config for account=${accountUuid}:`,
        error,
      );
      throw error;
    }
  }
}
