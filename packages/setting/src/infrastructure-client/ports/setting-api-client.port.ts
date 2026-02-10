/**
 * Setting API Client Port Interface
 *
 * Defines the contract for Setting API operations.
 * Implementations: SettingHttpAdapter (web), SettingIpcAdapter (desktop)
 */

import type {
  UserSettingClientDTO,
  AppConfigClientDTO,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
} from '@dailyuse/contracts/setting';

/**
 * Setting API Client Interface
 */
export interface ISettingApiClient {
  // ===== User Settings =====

  /** 获取用户设置 */
  getUserSettings(): Promise<UserSettingClientDTO>;

  /** 更新外观设置 */
  updateAppearance(request: UpdateAppearanceRequest): Promise<UserSettingClientDTO>;

  /** 更新语言区域设置 */
  updateLocale(request: UpdateLocaleRequest): Promise<UserSettingClientDTO>;

  /** 更新工作流设置 */
  updateWorkflow(request: UpdateWorkflowRequest): Promise<UserSettingClientDTO>;

  /** 更新隐私设置 */
  updatePrivacy(request: UpdatePrivacyRequest): Promise<UserSettingClientDTO>;

  /** 重置用户设置为默认 */
  resetUserSettings(): Promise<UserSettingClientDTO>;

  // ===== App Config =====

  /** 获取应用配置 */
  getAppConfig(): Promise<AppConfigClientDTO>;

  // ===== Sync =====

  /** 同步设置 */
  syncSettings(): Promise<UserSettingClientDTO>;

  /** 导出设置 */
  exportSettings(): Promise<string>;

  /** 导入设置 */
  importSettings(data: string): Promise<UserSettingClientDTO>;

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getUserSettings()
   */
  getAll(): Promise<unknown>;

  /**
   * @deprecated 请使用 updateAppearance/updateLocale 等方法
   */
  setAll(settings: unknown): Promise<unknown>;
}
