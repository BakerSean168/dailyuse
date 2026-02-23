/**
 * Update User Setting
 *
 * 更新用户设置 — 支持按分类部分更新
 */

import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type {
  UserSettingClientDTO,
  UpdateUserSettingReq,
} from '@dailyuse/contracts/setting';

export class UpdateUserSetting {

  constructor(private readonly userSettingRepository: IUserSettingRepository) {}

  async execute(identityId: string, updates: Omit<UpdateUserSettingReq, 'id'>): Promise<UserSettingClientDTO> {
    let setting = await this.userSettingRepository.findByIdentityId(identityId);

    if (!setting) {
      setting = UserSetting.create({ identityId });
    }

    // 按分类应用部分更新
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
    if (updates.notification) {
      setting.updateNotification(updates.notification);
    }
    if (updates.editor) {
      setting.updateEditor(updates.editor);
    }
    if (updates.shortcuts) {
      setting.updateShortcuts(updates.shortcuts);
    }
    if (updates.experimental) {
      setting.updateExperimental(updates.experimental);
    }
    if (updates.ui) {
      setting.updateUI(updates.ui);
    }

    // 支持通用 entries（逐项 set）
    if (updates.entries) {
      for (const [key, value] of Object.entries(updates.entries)) {
        setting.set(key, value);
      }
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }
}
