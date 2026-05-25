/**
 * Import Settings
 *
 * 导入用户设置 — 支持合并或覆盖模式
 */

import type { IUserSettingRepository } from '../../../domain-server/repositories/i-user-setting-repository';
import { UserSetting } from '../../../domain-server/aggregates/user-setting';
import type { UserSettingClientDTO, UserSettingPreferences } from '@dailyuse/contracts/setting';

export class ImportSettings {
  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(
    identityId: string,
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ): Promise<UserSettingClientDTO> {
    const { merge = false } = options ?? {};
    this.validateImportData(data);

    const importedPreferences = data.settings as Partial<UserSettingPreferences>;

    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
    }

    if (merge) {
      // 合并模式：只覆盖提供的分类/字段
      setting.importPreferences(importedPreferences);
    } else {
      // 覆盖模式：先重置，再导入
      setting.resetAll();
      setting.importPreferences(importedPreferences);
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }

  private validateImportData(data: Record<string, unknown>): void {
    if (!data.settings) {
      throw new Error('Invalid import data: missing settings field');
    }

    if (!data.version) {
      throw new Error('Invalid import data: missing version field');
    }

    const supportedVersions = ['1.0.0', '2.0.0'];
    if (!supportedVersions.includes(data.version as string)) {
      throw new Error(`Unsupported settings version: ${data.version}`);
    }
  }
}
