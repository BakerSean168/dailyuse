/**
 * Setting IPC Adapter — Aligned with patchCategory API
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  IIpcClient,
  ISettingApiClient,
} from '../types';
import type {
  UserSettingClientDTO,
  PreferenceCategory,
} from '@dailyuse/contracts/setting';

export class SettingIpcAdapter implements ISettingApiClient {
  private readonly channel = 'setting';

  constructor(private readonly ipcClient: IIpcClient) {}

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:all`));
  }

  async patchCategory(category: PreferenceCategory, patch: Record<string, unknown>): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:patch`, { category, patch }));
  }

  async resetUserSettings(category?: string): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:reset`, { category }));
  }

  async exportSettings(): Promise<Result<string>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:export`));
  }

  async importSettings(data: string): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:import`, { data }));
  }
}
