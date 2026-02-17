/**
 * Setting Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Setting API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/setting.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceReq,
  UpdateLocaleReq,
  UpdateWorkflowReq,
  UpdatePrivacyReq,
} from '@dailyuse/contracts/setting';

// ============ Transport Client Interfaces ============

// IResultHttpClient imported from @dailyuse/http-client

export type { IResultHttpClient };

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interface ============

/**
 * Setting API Client Interface
 */
export interface ISettingApiClient {
  // ===== User Settings =====
  getUserSettings(): Promise<Result<UserSettingClientDTO>>;
  updateAppearance(request: UpdateAppearanceReq): Promise<Result<UserSettingClientDTO>>;
  updateLocale(request: UpdateLocaleReq): Promise<Result<UserSettingClientDTO>>;
  updateWorkflow(request: UpdateWorkflowReq): Promise<Result<UserSettingClientDTO>>;
  updatePrivacy(request: UpdatePrivacyReq): Promise<Result<UserSettingClientDTO>>;
  resetUserSettings(): Promise<Result<UserSettingClientDTO>>;

  // ===== App Config =====
  getAppConfig(): Promise<Result<AppConfigClientDTO>>;

  // ===== Sync =====
  syncSettings(): Promise<Result<UserSettingClientDTO>>;
  exportSettings(): Promise<Result<string>>;
  importSettings(data: string): Promise<Result<UserSettingClientDTO>>;

  // ===== 向后兼容别名 =====
  /** @deprecated 请使用 getUserSettings() */
  getAll(): Promise<Result<unknown>>;
  /** @deprecated 请使用 updateAppearance/updateLocale 等方法 */
  setAll(settings: unknown): Promise<Result<unknown>>;
}
