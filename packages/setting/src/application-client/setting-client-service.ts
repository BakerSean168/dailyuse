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
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
} from '@dailyuse/contracts/setting';
import type { ISettingApiClient } from '../infrastructure-client/adapters/types';

export class SettingClientService {
  constructor(private readonly settingApi: ISettingApiClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.getUserSettings();
  }

  async updateAppearance(request: UpdateAppearanceRequest): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateAppearance(request);
  }

  async updateLocale(request: UpdateLocaleRequest): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateLocale(request);
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<Result<UserSettingClientDTO>> {
    return this.settingApi.updateWorkflow(request);
  }

  async updatePrivacy(request: UpdatePrivacyRequest): Promise<Result<UserSettingClientDTO>> {
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
