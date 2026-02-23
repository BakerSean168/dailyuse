/**
 * useAppSettings Hook
 *
 * 应用设置管理 Hook — Aligned with patchCategory API
 */

import { useState, useCallback, useEffect } from 'react';
import { settingApplicationService } from '@dailyuse/setting/application-client';
import type { UserSettingClientDTO, PreferenceCategory } from '@dailyuse/contracts/setting';

export interface AppSettingsState {
  userSettings: UserSettingClientDTO | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UseAppSettingsReturn extends AppSettingsState {
  loadSettings: () => Promise<void>;
  patchCategory: (category: PreferenceCategory, patch: Record<string, unknown>) => Promise<void>;
  resetSettings: () => Promise<UserSettingClientDTO>;
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<UserSettingClientDTO>;
}

/**
 * 应用设置管理 Hook
 */
export function useAppSettings(): UseAppSettingsReturn {
  const [state, setState] = useState<AppSettingsState>({
    userSettings: null,
    loading: false,
    saving: false,
    error: null,
  });

  /**
   * 加载用户设置
   */
  const loadSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const userSettings = await settingApplicationService.getUserSettings();
      setState((prev) => ({
        ...prev,
        userSettings,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载设置失败',
      }));
    }
  }, []);

  /**
   * 按分类更新设置
   */
  const patchCategory = useCallback(async (category: PreferenceCategory, patch: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.patchCategory(category, patch);
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '更新设置失败',
      }));
    }
  }, []);

  /**
   * 重置设置
   */
  const resetSettings = useCallback(async (): Promise<UserSettingClientDTO> => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.resetUserSettings();
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
      return userSettings;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '重置设置失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 导出设置
   */
  const exportSettings = useCallback(async (): Promise<string> => {
    try {
      return await settingApplicationService.exportSettings();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '导出设置失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 导入设置
   */
  const importSettings = useCallback(async (data: string): Promise<UserSettingClientDTO> => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.importSettings(data);
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
      return userSettings;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '导入设置失败',
      }));
      throw error;
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    ...state,
    loadSettings,
    patchCategory,
    resetSettings,
    exportSettings,
    importSettings,
  };
}
