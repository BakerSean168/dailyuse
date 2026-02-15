/**
 * Setting IPC Adapter
 *
 * IPC implementation of ISettingApiClient for Electron desktop app.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type { IIpcClient, ISettingApiClient } from '../types';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
} from '@dailyuse/contracts/setting';

/**
 * Setting IPC Adapter
 *
 * Implements ISettingApiClient using Electron IPC.
 */
export class SettingIpcAdapter implements ISettingApiClient {
  private readonly channel = 'setting';

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:get`));
  }

  async updateAppearance(request: UpdateAppearanceRequest): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:appearance`, request));
  }

  async updateLocale(request: UpdateLocaleRequest): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:locale`, request));
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:workflow`, request));
  }

  async updatePrivacy(request: UpdatePrivacyRequest): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:privacy`, request));
  }

  async resetUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:user:reset`));
  }

  // ===== App Config =====

  async getAppConfig(): Promise<Result<AppConfigClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:app:get`));
  }

  // ===== Sync =====

  async syncSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:sync`));
  }

  async exportSettings(): Promise<Result<string>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:export`));
  }

  async importSettings(data: string): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:import`, { data }));
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
