/**
 * Export Settings
 *
 * 导出用户设置为可传输的 JSON 对象
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';

export class ExportSettings {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(identityId: string): Promise<Record<string, unknown>> {
    const setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      throw new Error('User setting not found');
    }

    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      identityId,
      settings: setting.toPreferences(),
    };
  }
}
