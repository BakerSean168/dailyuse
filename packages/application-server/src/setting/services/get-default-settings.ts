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

  /**
   * 执行用例
   */
  execute(): UserSettingClientDTO {
    const defaultSetting = UserSetting.create({ accountUuid: 'temp-uuid' });
    return defaultSetting.toClientDTO();
  }
}
