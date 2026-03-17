/**
 * Setting IPC Adapter — Aligned with patchCategory API
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultIpcClient, ISettingApiClient } from '../types';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';

export class SettingIpcAdapter implements ISettingApiClient {
  private readonly channel = 'setting';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:all`);
  }

  async patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:patch`, { category, patch });
  }

  async resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:reset`, { category });
  }

  async exportSettings(): Promise<Result<string>> {
    return this.ipcClient.invoke(`${this.channel}:export`);
  }

  async importSettings(
    data: string,
    options?: { merge?: boolean },
  ): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:import`, { data, options });
  }
}

export function createSettingIpcAdapter(ipcClient: IResultIpcClient): SettingIpcAdapter {
  return new SettingIpcAdapter(ipcClient);
}
