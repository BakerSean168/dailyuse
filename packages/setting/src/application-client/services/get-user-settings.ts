/**
 * Get User Settings
 *
 * 获取用户设置用例
 */

import type { ISettingApiClient } from '@/infrastructure-client';
import { SettingContainer } from '@/infrastructure-client';
import { UserSetting } from '@/domain-client';

/**
 * Get User Settings
 */
export class GetUserSettings {
  private static instance: GetUserSettings;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): GetUserSettings {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUserSettings.instance = new GetUserSettings(client);
    return GetUserSettings.instance;
  }

  static getInstance(): GetUserSettings {
    if (!GetUserSettings.instance) {
      GetUserSettings.instance = GetUserSettings.createInstance();
    }
    return GetUserSettings.instance;
  }

  static resetInstance(): void {
    GetUserSettings.instance = undefined as unknown as GetUserSettings;
  }

  async execute(): Promise<UserSetting> {
    const dto = await this.apiClient.getUserSettings();
    return UserSetting.fromClientDTO(dto);
  }
}

export const getUserSettings = (): Promise<UserSetting> =>
  GetUserSettings.getInstance().execute();
