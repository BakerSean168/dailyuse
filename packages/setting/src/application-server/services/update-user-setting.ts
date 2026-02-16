/**
 * Update User Setting
 *
 * 更新用户设置
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type {
  UserSettingClientDTO,
  UpdateUserSettingRequest,
} from '@dailyuse/contracts/setting';

/**
 * Update User Setting
 */
export class UpdateUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(identityId: string, updates: Omit<UpdateUserSettingRequest, 'id'>): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByAccountId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
    }

    if (updates.appearance) {
      setting.updateAppearance(updates.appearance);
    }
    if (updates.locale) {
      setting.updateLocale(updates.locale);
    }
    if (updates.workflow) {
      setting.updateWorkflow(updates.workflow);
    }
    if (updates.privacy) {
      setting.updatePrivacy(updates.privacy);
    }
    if (updates.shortcuts?.custom) {
      for (const [action, shortcut] of Object.entries(updates.shortcuts.custom)) {
        setting.updateShortcut(action, shortcut as string);
      }
    }
    if (updates.experimental?.features) {
      for (const feature of updates.experimental.features) {
        setting.enableExperimentalFeature(feature);
      }
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}
