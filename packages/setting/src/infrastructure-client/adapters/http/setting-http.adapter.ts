/**
 * Setting HTTP Adapter
 *
 * HTTP implementation of ISettingApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient, ISettingApiClient } from '../types';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
} from '@dailyuse/contracts/setting';

/**
 * Setting HTTP Adapter
 *
 * Implements ISettingApiClient using HTTP REST API calls.
 */
export class SettingHttpAdapter implements ISettingApiClient {
  private readonly baseUrl = '/settings';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/user`);
  }

  async updateAppearance(request: UpdateAppearanceRequest): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/user/appearance`, request);
  }

  async updateLocale(request: UpdateLocaleRequest): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/user/locale`, request);
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/user/workflow`, request);
  }

  async updatePrivacy(request: UpdatePrivacyRequest): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/user/privacy`, request);
  }

  async resetUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/user/reset`);
  }

  // ===== App Config =====

  async getAppConfig(): Promise<Result<AppConfigClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/app`);
  }

  // ===== Sync =====

  async syncSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/sync`);
  }

  async exportSettings(): Promise<Result<string>> {
    return this.httpClient.get(`${this.baseUrl}/export`);
  }

  async importSettings(data: string): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/import`, { data });
  }

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getUserSettings()
   */
  async getAll(): Promise<Result<unknown>> {
    return this.getUserSettings();
  }

  /**
   * @deprecated 请使用 updateAppearance/updateLocale 等方法
   */
  async setAll(_settings: unknown): Promise<Result<unknown>> {
    console.warn('setAll is deprecated. Use specific update methods instead.');
    return this.getUserSettings();
  }
}
