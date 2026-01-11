/**
 * Export Settings
 *
 * 导出用户设置为 JSON 对象
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { SettingContainer } from '@dailyuse/infrastructure-server';

/**
 * Export Settings
 */
export class ExportSettings {
  private static instance: ExportSettings;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): ExportSettings {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    ExportSettings.instance = new ExportSettings(repo);
    return ExportSettings.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ExportSettings {
    if (!ExportSettings.instance) {
      ExportSettings.instance = ExportSettings.createInstance();
    }
    return ExportSettings.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ExportSettings.instance = undefined as unknown as ExportSettings;
  }

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
