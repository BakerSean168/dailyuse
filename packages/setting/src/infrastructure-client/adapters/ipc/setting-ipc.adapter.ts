/**
 * Setting IPC Adapter — Aligned with patchCategory API
 */

import type { Result } from '@memoflow/contracts/result';
import { SettingChannels } from '@memoflow/contracts/electron';
import type { IResultIpcClient, ISettingApiClient } from '../types';
import type { UserSettingClientDTO, PreferenceCategory } from '@memoflow/contracts/setting';

export class SettingIpcAdapter implements ISettingApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(SettingChannels.GET_ALL);
  }

  async getUserSettingDefaults(): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(SettingChannels.GET_DEFAULTS);
  }

  async patchCategory(
    category: PreferenceCategory,
    patch: Record<string, unknown>,
  ): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(SettingChannels.PATCH, { category, patch });
  }

  async resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(SettingChannels.RESET, { category });
  }

  async exportSettings(): Promise<Result<string>> {
    return this.ipcClient.invoke(SettingChannels.EXPORT);
  }

  async importSettings(
    data: string,
    options?: { merge?: boolean },
  ): Promise<Result<UserSettingClientDTO>> {
    return this.ipcClient.invoke(SettingChannels.IMPORT, { data, options });
  }
}

export function createSettingIpcAdapter(ipcClient: IResultIpcClient): SettingIpcAdapter {
  return new SettingIpcAdapter(ipcClient);
}
