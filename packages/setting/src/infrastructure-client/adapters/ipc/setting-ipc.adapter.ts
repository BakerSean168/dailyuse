/**
 * Setting IPC Adapter
 *
 * IPC implementation of ISettingApiClient for Electron desktop app.
 */

import type { ISettingApiClient } from '../../ports/setting-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
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

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== User Settings =====

  async getUserSettings(): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:get`);
  }

  async updateAppearance(request: UpdateAppearanceRequest): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:appearance`, request);
  }

  async updateLocale(request: UpdateLocaleRequest): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:locale`, request);
  }

  async updateWorkflow(request: UpdateWorkflowRequest): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:workflow`, request);
  }

  async updatePrivacy(request: UpdatePrivacyRequest): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:privacy`, request);
  }

  async resetUserSettings(): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:user:reset`);
  }

  // ===== App Config =====

  async getAppConfig(): Promise<AppConfigClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:app:get`);
  }

  // ===== Sync =====

  async syncSettings(): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:sync`);
  }

  async exportSettings(): Promise<string> {
    return this.ipcClient.invoke(`${this.channel}:export`);
  }

  async importSettings(data: string): Promise<UserSettingClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:import`, { data });
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
    // 简化实现：返回当前设置（实际应分別调用对应的 update 方法）
    console.warn('setAll is deprecated. Use specific update methods instead.');
    return this.getUserSettings();
  }
}
