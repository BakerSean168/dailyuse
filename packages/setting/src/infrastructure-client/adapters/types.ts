/**
 * Setting Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Setting API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/setting.
 */

import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
} from '@dailyuse/contracts/setting';

// ============ Transport Client Interfaces ============

export interface IHttpClient {
  get<T>(url: string, options?: { params?: Record<string, unknown> }): Promise<T>;
  post<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  put<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  patch<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  delete<T>(url: string, options?: { params?: Record<string, unknown> }): Promise<T>;
}

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interface ============

/**
 * Setting API Client Interface
 */
export interface ISettingApiClient {
  // ===== User Settings =====
  getUserSettings(): Promise<UserSettingClientDTO>;
  updateAppearance(request: UpdateAppearanceRequest): Promise<UserSettingClientDTO>;
  updateLocale(request: UpdateLocaleRequest): Promise<UserSettingClientDTO>;
  updateWorkflow(request: UpdateWorkflowRequest): Promise<UserSettingClientDTO>;
  updatePrivacy(request: UpdatePrivacyRequest): Promise<UserSettingClientDTO>;
  resetUserSettings(): Promise<UserSettingClientDTO>;

  // ===== App Config =====
  getAppConfig(): Promise<AppConfigClientDTO>;

  // ===== Sync =====
  syncSettings(): Promise<UserSettingClientDTO>;
  exportSettings(): Promise<string>;
  importSettings(data: string): Promise<UserSettingClientDTO>;

  // ===== 向后兼容别名 =====
  /** @deprecated 请使用 getUserSettings() */
  getAll(): Promise<unknown>;
  /** @deprecated 请使用 updateAppearance/updateLocale 等方法 */
  setAll(settings: unknown): Promise<unknown>;
}
