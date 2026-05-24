/**
 * Get User Setting
 *
 * 获取用户设置（如果不存在则创建默认设置）
 */

import type { IUserSettingRepository } from '../../../domain-server/repositories/i-user-setting-repository';
import { UserSetting } from '../../../domain-server/aggregates/user-setting';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

export class GetUserSetting {
  constructor(
    private readonly userSettingRepository: IUserSettingRepository,
    private readonly options: {
      persistOnMissing?: boolean;
    } = {},
  ) {}

  async execute(identityId: string): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
      if (this.options.persistOnMissing ?? true) {
        await this.userSettingRepository.save(setting);
      }
    }

    return setting.toClientDTO();
  }
}
