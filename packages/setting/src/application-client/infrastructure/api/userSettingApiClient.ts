import { apiClient } from '@/shared/api/instances';
import type {
  UserSettingClientDTO,
  PreferenceCategory,
} from '@dailyuse/contracts/setting';

/**
 * UserSetting API 客户端 — Aligned with PATCH /:category API
 */
export class UserSettingApiClient {
  private readonly baseUrl = '/settings';

  async getUserSettings(): Promise<UserSettingClientDTO> {
    return apiClient.get(this.baseUrl);
  }

  async patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<UserSettingClientDTO> {
    return apiClient.patch(`${this.baseUrl}/${category}`, patch);
  }

  async resetUserSettings(category?: string): Promise<UserSettingClientDTO> {
    return apiClient.post(`${this.baseUrl}/reset`, { category });
  }

  async exportSettings(): Promise<string> {
    return apiClient.post(`${this.baseUrl}/export`);
  }

  async importSettings(data: string): Promise<UserSettingClientDTO> {
    return apiClient.post(`${this.baseUrl}/import`, { data });
  }
}

export const userSettingApiClient = new UserSettingApiClient();
