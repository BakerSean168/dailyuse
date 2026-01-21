/**
 * Reset User Setting
 *
 * 重置用户设置为默认值
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

/**
 * Reset User Setting
 */
export class ResetUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<UserSettingClientDTO> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const newSetting = UserSetting.create({ accountUuid });
    (newSetting as any)._uuid = setting.uuid;

    await this.userSettingRepository.save(newSetting);
    return newSetting.toClientDTO();
  }
}
