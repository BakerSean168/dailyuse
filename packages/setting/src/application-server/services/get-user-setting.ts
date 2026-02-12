/**
 * Get User Setting
 *
 * 获取用户设置（如果不存在则创建默认设置）
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

/**
 * Get User Setting
 */
export class GetUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      setting = UserSetting.create({ accountUuid });
      await this.userSettingRepository.save(setting);
    }

    return setting.toClientDTO();
  }
}
