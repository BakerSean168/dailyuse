/**
 * Get Default Settings
 *
 * 获取默认设置
 */

import { UserSetting } from '@dailyuse/domain-server/setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

/**
 * Get Default Settings
 */
export class GetDefaultSettings {
  private static instance: GetDefaultSettings;

  private constructor() {}

  /**
   * 创建服务实例
   */
  static createInstance(): GetDefaultSettings {
    GetDefaultSettings.instance = new GetDefaultSettings();
    return GetDefaultSettings.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDefaultSettings {
    if (!GetDefaultSettings.instance) {
      GetDefaultSettings.instance = GetDefaultSettings.createInstance();
    }
    return GetDefaultSettings.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDefaultSettings.instance = undefined as unknown as GetDefaultSettings;
  }

  /**
   * 执行用例
   */
  execute(): UserSettingClientDTO {
    const defaultSetting = UserSetting.create({ accountUuid: 'temp-uuid' });
    return defaultSetting.toClientDTO();
  }
}
