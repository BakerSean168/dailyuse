/**
 * useAppSettings Hook
 *
 * 应用设置管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { settingApplicationService } from '@dailyuse/setting/application-client';
import type { UserSettingClientDTO, AppConfigClientDTO } from '@dailyuse/contracts/setting';
import type { UpdateAppearanceInput, UpdateLocaleInput } from '@dailyuse/setting/application-client';

export interface AppSettingsState {
  userSettings: UserSettingClientDTO | null;
  appConfig: AppConfigClientDTO | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UseAppSettingsReturn extends AppSettingsState {
  loadSettings: () => Promise<void>;
  loadAppConfig: () => Promise<void>;
  updateAppearance: (input: UpdateAppearanceInput) => Promise<void>;
  updateLocale: (input: UpdateLocaleInput) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
}

/**
 * 应用设置管理 Hook
 */
export function useAppSettings(): UseAppSettingsReturn {
  const [state, setState] = useState<AppSettingsState>({
    userSettings: null,
    appConfig: null,
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
   * 加载应用配置
   */
  const loadAppConfig = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const appConfig = await settingApplicationService.getAppConfig();
      setState((prev) => ({
        ...prev,
        appConfig,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载应用配置失败',
      }));
    }
  }, []);

  /**
   * 更新外观设置
   */
  const updateAppearance = useCallback(async (input: UpdateAppearanceInput) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.updateAppearance(input);
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '更新外观设置失败',
      }));
    }
  }, []);

  /**
   * 更新语言设置
   */
  const updateLocale = useCallback(async (input: UpdateLocaleInput) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.updateLocale(input);
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '更新语言设置失败',
      }));
    }
  }, []);

  /**
   * 重置设置
   */
  const resetSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.resetUserSettings();
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '重置设置失败',
      }));
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
  const importSettings = useCallback(async (data: string) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const userSettings = await settingApplicationService.importSettings(data);
      setState((prev) => ({
        ...prev,
        userSettings,
        saving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : '导入设置失败',
      }));
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadSettings();
    loadAppConfig();
  }, [loadSettings, loadAppConfig]);

  return {
    ...state,
    loadSettings,
    loadAppConfig,
    updateAppearance,
    updateLocale,
    resetSettings,
    exportSettings,
    importSettings,
  };
}
