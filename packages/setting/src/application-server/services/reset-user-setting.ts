/**
 * Reset User Setting
 *
 * 重置用户设置为默认值
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

/**
 * Reset User Setting
 */
export class ResetUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(identityId: string): Promise<UserSettingClientDTO> {
    const setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const newSetting = UserSetting.create({ identityId });

    await this.userSettingRepository.save(newSetting);
    return newSetting.toClientDTO();
  }
}
