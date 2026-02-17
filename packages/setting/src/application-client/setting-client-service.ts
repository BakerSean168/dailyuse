/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Setting Client Service
 *
 * Application service with constructor injection of ISettingApiClient.
 * All methods return Result<T> for explicit error handling.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceReq,
  UpdateLocaleReq,
  UpdateWorkflowReq,
  UpdatePrivacyReq,
} from '@dailyuse/contracts/setting';
import type { ISettingApiClient } from '../infrastructure-client/adapters/types';

export class SettingClientService {
  constructor(private readonly settingApi: ISettingApiClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.getUserSettings();
  }

  async updateAppearance(request: UpdateAppearanceReq): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateAppearance(request);
  }

  async updateLocale(request: UpdateLocaleReq): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateLocale(request);
  }

  async updateWorkflow(request: UpdateWorkflowReq): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateWorkflow(request);
  }

  async updatePrivacy(request: UpdatePrivacyReq): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updatePrivacy(request);
  }

  async resetUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.resetUserSettings();
  }

  // ===== App Config =====

  async getAppConfig(): Promise<Result<AppConfigClientDTO>> {
    return this.settingApi.getAppConfig();
  }

  // ===== Sync =====

  async syncSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.syncSettings();
  }

  async exportSettings(): Promise<Result<string>> {
    return this.settingApi.exportSettings();
  }

  async importSettings(data: string): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.importSettings(data);
  }
}
