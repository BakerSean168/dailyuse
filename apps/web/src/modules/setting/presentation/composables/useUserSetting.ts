/**
 * useUserSetting - 设置模块主 composable
 *
 * 通过 inject 获取 SettingClientService，所有方法返回 Result<T>。
 */

import { computed, inject } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import { SETTING_SERVICE_KEY } from '@/shared/di';
import { resultHttpClient } from '@/shared/http';

const BASE = '/settings';

export function useUserSetting() {
  const service = inject(SETTING_SERVICE_KEY)!;
  const store = useUserSettingStore();

  const entries = computed(() => store.entries);
  const defaults = computed(() => store.defaults);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);

  function handleError(message: string): void {
    store.setError(message);
    console.error(message);
  }

  function getEntry(key: string): unknown { return store.entries[key]; }
  function hasEntry(key: string): boolean { return key in store.entries; }

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
    const result = await resultHttpClient.get<Record<string, unknown>>(`${BASE}/defaults`);
    if (result.ok) { store.setDefaults(result.data); }
    else { handleError(result.error.message || '加载默认设置失败'); }
  }

  async function updateEntry(key: string, value: unknown) {
    store.setError(null);
    const result = await resultHttpClient.put<unknown>(`${BASE}/entries/${key}`, { value });
    if (result.ok) { store.setEntry(key, value); }
    else { handleError(result.error.message || '更新设置失败'); }
  }

  async function batchUpdate(items: Array<{ key: string; value: unknown }>) {
    store.setError(null);
    const result = await resultHttpClient.put<unknown>(`${BASE}/entries/batch`, { entries: items });
    if (result.ok) { items.forEach(({ key, value }) => store.setEntry(key, value)); }
    else { handleError(result.error.message || '批量更新设置失败'); }
  }

  async function resetToDefaults() {
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
    entries, defaults, isLoading, error, userSetting,
    getEntry, hasEntry,
    loadSettings, loadDefaults,
    updateEntry, batchUpdate, resetToDefaults,
    exportSettings, importSettings,
  };
}

/** Backward compatible alias */
export const useUserSettingData = useUserSetting;
