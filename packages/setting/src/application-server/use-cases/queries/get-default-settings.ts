/**
 * Get Default Settings
 *
 * 获取默认设置值（不涉及持久化）
 */

import { UserSetting } from '../../../domain-server/aggregates/user-setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

export const DEFAULT_SETTINGS_IDENTITY_ID = 'IdentityId_00000000-0000-4000-8000-000000000000';

export class GetDefaultSettings {
  execute(): UserSettingClientDTO {
    const defaultSetting = UserSetting.create({ identityId: DEFAULT_SETTINGS_IDENTITY_ID });
    return defaultSetting.toClientDTO();
  }
}
