/**
 * Reset User Setting
 *
 * 重置用户设置为默认值。
 * 支持重置全部或指定分类。
 */

import type { IUserSettingRepository } from '../../../domain/repositories/i-user-setting-repository';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';

export class ResetUserSetting {
  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(identityId: string, category?: string): Promise<UserSettingClientDTO> {
    const setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      throw new Error('User setting not found');
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
