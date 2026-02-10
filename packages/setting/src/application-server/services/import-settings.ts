/**
 * Import Settings
 *
 * 导入用户设置
 */

import type { IUserSettingRepository } from '@/domain-server';
import { UserSetting } from '@/domain-server';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';
import { UpdateUserSetting } from './update-user-setting';

/**
 * Import Settings
 */
export class ImportSettings {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(
    accountUuid: string,
    data: Record<string, any>,
    options?: { merge?: boolean; validate?: boolean },
  ): Promise<UserSettingClientDTO> {
    const { merge = false, validate = true } = options || {};

    if (validate) {
      this.validateImportData(data);
    }

    const importedSettings = data.settings;

    if (merge) {
      return await new UpdateUserSetting(this.userSettingRepository).execute(
        accountUuid,
        importedSettings as Omit<UpdateUserSettingRequest, 'uuid'>,
      );
    } else {
      let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

      if (!setting) {
        setting = UserSetting.create({ accountUuid });
      }

      const newSetting = UserSetting.fromServerDTO({
        ...importedSettings,
        accountUuid: accountUuid,
        uuid: setting.uuid,
      });

      await this.userSettingRepository.save(newSetting);
      return newSetting.toClientDTO();
    }
  }

  /**
   * 验证导入数据的格式
   */
  private validateImportData(data: Record<string, any>): void {
    if (!data.settings) {
      throw new Error('Invalid import data: missing settings field');
    }

    if (!data.version) {
      throw new Error('Invalid import data: missing version field');
    }

    const supportedVersions = ['1.0.0'];
    if (!supportedVersions.includes(data.version)) {
      throw new Error(`Unsupported settings version: ${data.version}`);
    }

    const settings = data.settings;
    const requiredFields = ['appearance', 'locale', 'workflow', 'privacy'];

    for (const field of requiredFields) {
      if (!settings[field]) {
        throw new Error(`Invalid import data: missing ${field} settings`);
      }
    }
  }
}
