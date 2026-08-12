/**
 * Reset User Setting
 *
 * 重置用户设置为默认值。
 * 支持重置全部或指定分类。
 * 用户没有任何设置记录时，materialize 一个默认 aggregate 并返回默认值，
 * 而不是抛错或返回空对象。
 */

import type { IUserSettingRepository } from '../../../domain/repositories/i-user-setting-repository';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';
import { UserSetting } from '../../../domain/aggregates/user-setting';

export class ResetUserSetting {
  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(identityId: string, category?: string): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      // No record: materialize the default aggregate so reset returns the
      // full default preference tree instead of throwing or an empty object.
      setting = UserSetting.create({ identityId });
      await this.userSettingRepository.save(setting);
    }

    if (category) {
      setting.resetCategory(category as PreferenceCategory);
    } else {
      setting.resetAll();
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}
