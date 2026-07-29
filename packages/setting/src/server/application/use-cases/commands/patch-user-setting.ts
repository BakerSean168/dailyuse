/**
 * Patch User Setting
 *
 * 按分类更新用户设置 — 使用 patchCategory() 单一方法
 */

import type { IUserSettingRepository } from '../../../domain/repositories/i-user-setting-repository';
import { UserSetting } from '../../../domain/aggregates/user-setting';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';

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
