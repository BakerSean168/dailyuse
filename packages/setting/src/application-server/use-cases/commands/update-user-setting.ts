/**
 * Patch User Setting
 *
 * 按分类更新用户设置 — 使用 patchCategory() 单一方法
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';

export class PatchUserSetting {
  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(
    identityId: string,
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
    }

    setting.patchCategory(category, patch as never);

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}

/**
 * @deprecated Use PatchUserSetting instead
 */
export const UpdateUserSetting = PatchUserSetting;
