/**
 * Setting Application Service - Renderer
 *
 * 设置模块应用服务层
 * 封装 @dailyuse/application-client 的 Setting Use Cases
 */

import {
  GetUserSettings,
  UpdateAppearance,
  UpdateLocale,
  ResetUserSettings,
  GetAppConfig,
  ExportSettings,
  ImportSettings,
} from '@dailyuse/application-client';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
} from '@dailyuse/contracts/setting';

/**
 * 设置应用服务
 *
 * 提供设置相关的所有业务操作
 */
export class SettingApplicationService {
  // ===== User Settings =====

  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<UserSettingClientDTO> {
    return GetUserSettings.getInstance().execute();
  }

  /**
   * 更新外观设置
   */
  async updateAppearance(input: UpdateAppearanceRequest): Promise<UserSettingClientDTO> {
    return UpdateAppearance.getInstance().execute(input);
  }

  /**
   * 更新语言设置
   */
  async updateLocale(input: UpdateLocaleRequest): Promise<UserSettingClientDTO> {
    return UpdateLocale.getInstance().execute(input);
  }

  /**
   * 重置用户设置
   */
  async resetUserSettings(): Promise<UserSettingClientDTO> {
    return ResetUserSettings.getInstance().execute();
  }

  // ===== App Config =====

  /**
   * 获取应用配置
   */
  async getAppConfig(): Promise<AppConfigClientDTO> {
    return GetAppConfig.getInstance().execute();
  }

  // ===== Import/Export =====

  /**
   * 导出设置
   * 返回 JSON 字符串
   */
  async exportSettings(): Promise<string> {
    return ExportSettings.getInstance().execute();
  }

  /**
   * 导入设置
   * 返回导入后的用户设置
   */
  async importSettings(data: string): Promise<UserSettingClientDTO> {
    return ImportSettings.getInstance().execute(data);
  }
}

/**
 * 设置应用服务单例
 */
export const settingApplicationService = new SettingApplicationService();
