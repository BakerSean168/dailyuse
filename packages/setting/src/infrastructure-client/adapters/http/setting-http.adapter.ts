/**
 * Setting HTTP Adapter
 *
 * HTTP implementation of ISettingApiClient.
 */

import type { ISettingApiClient } from '../../ports/setting-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
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

  constructor(private readonly httpClient: HttpClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<UserSettingClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/user`);
  }

  async updateAppearance(request: UpdateAppearanceRequest): Promise<UserSettingClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/user/appearance`, request);
  }

  async updateLocale(request: UpdateLocaleRequest): Promise<UserSettingClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/user/locale`, request);
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<UserSettingClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/user/workflow`, request);
  }

  async updatePrivacy(request: UpdatePrivacyRequest): Promise<UserSettingClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/user/privacy`, request);
  }

  async resetUserSettings(): Promise<UserSettingClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/user/reset`);
  }

  // ===== App Config =====

  async getAppConfig(): Promise<AppConfigClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/app`);
  }

  // ===== Sync =====

  async syncSettings(): Promise<UserSettingClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/sync`);
  }

  async exportSettings(): Promise<string> {
    return this.httpClient.get(`${this.baseUrl}/export`);
  }

  async importSettings(data: string): Promise<UserSettingClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/import`, { data });
  }

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getUserSettings()
   */
  async getAll(): Promise<unknown> {
    return this.getUserSettings();
  }

  /**
   * @deprecated 请使用 updateAppearance/updateLocale 等方法
   */
  async setAll(_settings: unknown): Promise<unknown> {
    console.warn('setAll is deprecated. Use specific update methods instead.');
    return this.getUserSettings();
  }
}
