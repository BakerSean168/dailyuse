/**
 * Export Settings
 *
 * 导出用户设置为 JSON 对象
 */

import type { IUserSettingRepository } from '@/domain-server';

/**
 * Export Settings
 */
export class ExportSettings {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<Record<string, any>> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const dto = setting.toServerDTO();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accountUuid: accountUuid,
      settings: dto,
    };
  }
}
