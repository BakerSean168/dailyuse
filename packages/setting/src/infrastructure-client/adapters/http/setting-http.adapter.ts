/**
 * Setting HTTP Adapter — Aligned with PATCH /:category API
 */

import type { Result } from '@memoflow/contracts/result';
import type { IResultHttpClient, ISettingApiClient } from '../types';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';

export class SettingHttpAdapter implements ISettingApiClient {
  private readonly baseUrl = '/settings';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.get(this.baseUrl);
  }

  async patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/${category}`, patch);
  }

  async resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/reset`, { category });
  }

  async exportSettings(): Promise<Result<string>> {
    return this.httpClient.get(`${this.baseUrl}/export`);
  }

  async importSettings(
    data: string,
    options?: { merge?: boolean },
  ): Promise<Result<UserSettingClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/import`, {
      data,
      ...(options ? { options } : {}),
    });
  }
}
