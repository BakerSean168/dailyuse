/**
 * Update User Setting
 *
 * 更新用户设置
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type {
  UserSettingClientDTO,
  UpdateUserSettingReq,
} from '@dailyuse/contracts/setting';

/**
 * Update User Setting
 */
export class UpdateUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(identityId: string, updates: Omit<UpdateUserSettingReq, 'id'>): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
    }

    if (updates.appearance) {
      setting.setValue('appearance', updates.appearance);
    }
    if (updates.locale) {
      setting.setValue('locale', updates.locale);
    }
    if (updates.workflow) {
      setting.setValue('workflow', updates.workflow);
    }
    if (updates.privacy) {
      setting.setValue('privacy', updates.privacy);
    }
    if (updates.experimental) {
      setting.setValue('experimental', updates.experimental);
    }
    if (updates.entries) {
      setting.setValues(updates.entries);
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}
