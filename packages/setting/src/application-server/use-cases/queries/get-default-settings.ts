/**
 * Get Default Settings
 *
 * 获取默认设置值（不涉及持久化）
 */

import { UserSetting } from '../../../domain-server/aggregates/user-setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

export class GetDefaultSettings {
  execute(): UserSettingClientDTO {
    const defaultSetting = UserSetting.create({ identityId: 'defaults' });
    return defaultSetting.toClientDTO();
  }
}
