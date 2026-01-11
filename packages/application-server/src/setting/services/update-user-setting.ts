/**
 * Update User Setting
 *
 * 更新用户设置
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type {
  UserSettingClientDTO,
  UpdateUserSettingRequest,
} from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-server';

/**
 * Update User Setting
 */
export class UpdateUserSetting {
  private static instance: UpdateUserSetting;

  private constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(userSettingRepository?: IUserSettingRepository): UpdateUserSetting {
    const container = SettingContainer.getInstance();
    const repo = userSettingRepository || container.getUserSettingRepository();
    UpdateUserSetting.instance = new UpdateUserSetting(repo);
    return UpdateUserSetting.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateUserSetting {
    if (!UpdateUserSetting.instance) {
      UpdateUserSetting.instance = UpdateUserSetting.createInstance();
    }
    return UpdateUserSetting.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateUserSetting.instance = undefined as unknown as UpdateUserSetting;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string, updates: Omit<UpdateUserSettingRequest, 'uuid'>): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      setting = UserSetting.create({ accountUuid });
    }

    if (updates.appearance) {
      setting.updateAppearance(updates.appearance);
    }
    if (updates.locale) {
      setting.updateLocale(updates.locale);
    }
    if (updates.workflow) {
      setting.updateWorkflow(updates.workflow);
    }
    if (updates.privacy) {
      setting.updatePrivacy(updates.privacy);
    }
    if (updates.shortcuts?.custom) {
      for (const [action, shortcut] of Object.entries(updates.shortcuts.custom)) {
        setting.updateShortcut(action, shortcut as string);
      }
    }
    if (updates.experimental?.features) {
      for (const feature of updates.experimental.features) {
        setting.enableExperimentalFeature(feature);
      }
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}
