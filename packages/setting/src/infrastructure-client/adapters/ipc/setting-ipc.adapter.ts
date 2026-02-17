/**
 * Setting IPC Adapter
 *
 * IPC implementation of ISettingApiClient for Electron desktop app.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  IIpcClient,
  ISettingApiClient,
} from '../types';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceReq,
  UpdateLocaleReq,
  UpdateWorkflowReq,
  UpdatePrivacyReq,
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
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:all`));
  }

  async updateAppearance(request: UpdateAppearanceReq): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:update`, { section: 'appearance', ...request }));
  }

  async updateLocale(request: UpdateLocaleReq): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:update`, { section: 'locale', ...request }));
  }

  async updateWorkflow(request: UpdateWorkflowReq): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:update`, { section: 'workflow', ...request }));
  }

  async updatePrivacy(request: UpdatePrivacyReq): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:update`, { section: 'privacy', ...request }));
  }

  async resetUserSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:reset`));
  }

  // ===== App Config =====

  async getAppConfig(): Promise<Result<AppConfigClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:get`, { key: 'app' }));
  }

  // ===== Sync =====

  async syncSettings(): Promise<Result<UserSettingClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:update`, { sync: true }));
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
