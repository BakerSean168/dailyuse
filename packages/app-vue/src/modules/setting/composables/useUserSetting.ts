/**
 * useUserSetting - 设置模块主 composable
 *
 * 通过 inject 获取 SettingClientService，所有方法返回 Result<T>。
 * 使用新的分类偏好模型（appearance, locale, workflow 等）。
 */

import { computed, inject } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import type { PreferenceCategory, UserSettingPreferences } from '@dailyuse/contracts/setting';

const BASE = '/settings';

export function useUserSetting() {
  const service = inject(SETTING_SERVICE_KEY);
  if (!service) {
    throw new Error('SettingClientService not provided. Ensure SETTING_SERVICE_KEY is provided via app.provide().');
  }
  const store = useUserSettingStore();

  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);
  const defaults = computed(() => store.defaults);

  function handleError(message: string): void {
    store.setError(message);
    console.error(message);
  }

  /** 获取指定分类设置 */
  function getCategory<K extends PreferenceCategory>(category: K): UserSettingPreferences[K] | undefined {
    return store.userSetting?.[category];
  }

  /** 按 dot-notation key 获取值 (e.g., 'appearance.theme') */
  function getValue(key: string): unknown {
    return store.getValue(key);
  }

  async function loadSettings() {
    store.setLoading(true); store.setError(null);
    const result = await service.getUserSettings();
    if (result.ok) {
      store.setUserSetting(result.data);
    } else {
      handleError(result.error.message || '加载设置失败');
    }
    store.setLoading(false);
  }

  async function loadDefaults() {
    // TODO: Replace with service method or injected HTTP client when available
    console.warn('loadDefaults: not yet implemented — requires HTTP client integration');
  }

  /** 按分类更新设置 (e.g., updateCategory('appearance', { theme: 'dark' })) */
  async function updateCategory<K extends PreferenceCategory>(
    category: K,
    partial: Partial<UserSettingPreferences[K]>,
  ) {
    // TODO: Replace with service method or injected HTTP client when available
    console.warn('updateCategory: not yet implemented — requires HTTP client integration');
  }

  async function resetToDefaults(category?: PreferenceCategory) {
    store.setError(null);
    const result = await service.resetUserSettings();
    if (result.ok) { store.setUserSetting(result.data); }
    else { handleError(result.error.message || '重置设置失败'); }
  }

  async function exportSettings() {
    const result = await service.exportSettings();
    if (result.ok) { return result.data; }
    handleError(result.error.message || '导出设置失败');
    return null;
  }

  async function importSettings(data: unknown) {
    store.setError(null);
    const result = await service.importSettings(data as string);
    if (result.ok) { store.setUserSetting(result.data); }
    else { handleError(result.error.message || '导入设置失败'); }
  }

  return {
    userSetting, defaults, isLoading, error,
    getCategory, getValue,
    loadSettings, loadDefaults,
    updateCategory, resetToDefaults,
    exportSettings, importSettings,
  };
}

/** Backward compatible alias */
export const useUserSettingData = useUserSetting;
