/**
 * Reset User Settings
 *
 * 重置用户设置为默认用例
 */

import type { ISettingApiClient } from '@/infrastructure-client/adapters/types';
import { SettingContainer } from '@/infrastructure-client/setting.container';
import { UserSetting } from '@/domain-client/aggregates/user-setting';

/**
 * Reset User Settings
 */
export class ResetUserSettings {
  private static instance: ResetUserSettings;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): ResetUserSettings {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ResetUserSettings.instance = new ResetUserSettings(client);
    return ResetUserSettings.instance;
  }

  static getInstance(): ResetUserSettings {
    if (!ResetUserSettings.instance) {
      ResetUserSettings.instance = ResetUserSettings.createInstance();
    }
    return ResetUserSettings.instance;
  }

  static resetInstance(): void {
    ResetUserSettings.instance = undefined as unknown as ResetUserSettings;
  }

  async execute(): Promise<UserSetting> {
    const dto = await this.apiClient.resetUserSettings();
    return UserSetting.fromClientDTO(dto);
  }
}

export const resetUserSettings = (): Promise<UserSetting> =>
  ResetUserSettings.getInstance().execute();
