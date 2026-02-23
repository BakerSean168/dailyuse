/**
 * Setting Application Client Layer
 */

import type { Result } from '@dailyuse/contracts/result';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';
import type { ISettingApiClient } from '../infrastructure-client/adapters/types';

/**
 * Setting Client Service — Facade over ISettingApiClient
 */
export class SettingClientService {
  constructor(private readonly apiClient: ISettingApiClient) {}

  async getUserSettings(): Promise<UserSettingClientDTO> {
    const result = await this.apiClient.getUserSettings();
    if (!result.ok) throw new Error(result.error?.message ?? 'Failed to get user settings');
    return result.data;
  }

  async patchCategory(category: PreferenceCategory, patch: Record<string, unknown>): Promise<UserSettingClientDTO> {
    const result = await this.apiClient.patchCategory(category, patch);
    if (!result.ok) throw new Error(result.error?.message ?? 'Failed to patch settings');
    return result.data;
  }

  async resetUserSettings(category?: string): Promise<UserSettingClientDTO> {
    const result = await this.apiClient.resetUserSettings(category);
    if (!result.ok) throw new Error(result.error?.message ?? 'Failed to reset settings');
    return result.data;
  }

  async exportSettings(): Promise<string> {
    const result = await this.apiClient.exportSettings();
    if (!result.ok) throw new Error(result.error?.message ?? 'Failed to export settings');
    return result.data;
  }

  async importSettings(data: string): Promise<UserSettingClientDTO> {
    const result = await this.apiClient.importSettings(data);
    if (!result.ok) throw new Error(result.error?.message ?? 'Failed to import settings');
    return result.data;
  }
}

// Singleton placeholder
let _settingApplicationService: any = null;

export function setSettingApplicationService(service: any) {
  _settingApplicationService = service;
}

export const settingApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_settingApplicationService) {
      throw new Error('settingApplicationService not initialized. Call setSettingApplicationService first.');
    }
    return (_settingApplicationService as any)[prop];
  }
});
