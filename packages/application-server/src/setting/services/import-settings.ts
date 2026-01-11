/**
 * Import Settings
 *
 * 导入用户设置
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-server';
import { UpdateUserSetting } from './update-user-setting';

/**
 * Import Settings
 */
export class ImportSettings {
  private static instance: ImportSettings;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): ImportSettings {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    ImportSettings.instance = new ImportSettings(repo);
    return ImportSettings.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ImportSettings {
    if (!ImportSettings.instance) {
      ImportSettings.instance = ImportSettings.createInstance();
    }
    return ImportSettings.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ImportSettings.instance = undefined as unknown as ImportSettings;
  }

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
      return await UpdateUserSetting.getInstance().execute(
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
