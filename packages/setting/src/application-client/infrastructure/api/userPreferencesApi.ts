/**
 * User Preferences API Client
 * 用户偏好设置 API 客户端
 */

import { apiClient } from '@/shared/api/instances';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';

// 导出 contracts 中的类型
// Note: 这些类型在 contracts 中不存在，使用 any 作为临时方案
// 建议迁移到新的 UserSetting API (userSettingApiClient.ts)
export type UserPreferencesDTO = any;
export type UpdateUserPreferencesRequestDTO = any;
export type SwitchThemeModeRequestDTO = any;
export type ChangeLanguageRequestDTO = any;
export type SetNotificationsRequestDTO = any;

/**
 * 用户偏好设置 API
 */
export const userPreferencesApi = {
  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferencesDTO> {
    return apiClient.get<UserPreferencesDTO>('/settings/preferences');
  },

  /**
   * 切换主题模式
   */
  async switchThemeMode(themeMode: 'light' | 'dark' | 'system'): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/theme-mode', { themeMode });
  },

  /**
   * 更改语言
   */
  async changeLanguage(language: string): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/language', { language });
  },

  /**
   * 更新通知偏好
   */
  async updateNotificationPreferences(
    preferences: Partial<UpdateUserPreferencesRequestDTO>,
  ): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/notifications', preferences);
  },

  /**
   * 更新用户偏好（批量）
   */
  async updatePreferences(updates: UpdateUserPreferencesRequestDTO): Promise<UserPreferencesDTO> {
    return apiClient.put<UserPreferencesDTO>('/settings/preferences', updates);
  },

  /**
   * 重置为默认设置
   */
  async resetToDefault(): Promise<UserPreferencesDTO> {
    return apiClient.post<UserPreferencesDTO>('/settings/preferences/reset');
  },
};

