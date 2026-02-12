/**
 * useUserSetting - 设置模块主 composable
 */

import { computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import { settingApi, SettingApiError } from '../services/settingApi';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

export function useUserSetting() {
  const store = useUserSettingStore();

  const entries = computed(() => store.entries);
  const defaults = computed(() => store.defaults);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof SettingApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  function getEntry(key: string): unknown { return store.entries[key]; }
  function hasEntry(key: string): boolean { return key in store.entries; }

  async function loadSettings() {
    store.setLoading(true); store.setError(null);
    try {
      const setting = await settingApi.getSettings() as UserSettingClientDTO;
      store.setUserSetting(setting);
    } catch (e) { handleError(e, '加载设置失败'); }
    finally { store.setLoading(false); }
  }

  async function loadDefaults() {
    try {
      const defs = await settingApi.getDefaults() as Record<string, unknown>;
      store.setDefaults(defs);
    } catch (e) { handleError(e, '加载默认设置失败'); }
  }

  async function updateEntry(key: string, value: unknown) {
    store.setError(null);
    try {
      await settingApi.updateEntry(key, value);
      store.setEntry(key, value);
    } catch (e) { handleError(e, '更新设置失败'); }
  }

  async function batchUpdate(items: Array<{ key: string; value: unknown }>) {
    store.setError(null);
    try {
      await settingApi.batchUpdate(items);
      items.forEach(({ key, value }) => store.setEntry(key, value));
    } catch (e) { handleError(e, '批量更新设置失败'); }
  }

  async function resetToDefaults() {
    store.setError(null);
    try {
      const setting = await settingApi.resetToDefaults() as UserSettingClientDTO;
      store.setUserSetting(setting);
    } catch (e) { handleError(e, '重置设置失败'); }
  }

  async function exportSettings() {
    try { return await settingApi.exportSettings(); }
    catch (e) { handleError(e, '导出设置失败'); return null; }
  }

  async function importSettings(data: unknown) {
    store.setError(null);
    try {
      const setting = await settingApi.importSettings(data) as UserSettingClientDTO;
      store.setUserSetting(setting);
    } catch (e) { handleError(e, '导入设置失败'); }
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
