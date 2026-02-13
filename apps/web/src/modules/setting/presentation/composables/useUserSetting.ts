/**
 * useUserSetting - 设置模块主 composable
 *
 * 使用 @dailyuse/http-client 的 AxiosHttpClient 进行 HTTP 调用。
 */

import { computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import { httpClient } from '@/shared/http';
import { HttpClientError } from '@dailyuse/http-client';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';

const BASE = '/settings';

export function useUserSetting() {
  const store = useUserSettingStore();

  const entries = computed(() => store.entries);
  const defaults = computed(() => store.defaults);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof HttpClientError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  function getEntry(key: string): unknown { return store.entries[key]; }
  function hasEntry(key: string): boolean { return key in store.entries; }

  async function loadSettings() {
    store.setLoading(true); store.setError(null);
    try {
      const setting = await httpClient.get<UserSettingClientDTO>(BASE);
      store.setUserSetting(setting);
    } catch (e) { handleError(e, '加载设置失败'); }
    finally { store.setLoading(false); }
  }

  async function loadDefaults() {
    try {
      const defs = await httpClient.get<Record<string, unknown>>(`${BASE}/defaults`);
      store.setDefaults(defs);
    } catch (e) { handleError(e, '加载默认设置失败'); }
  }

  async function updateEntry(key: string, value: unknown) {
    store.setError(null);
    try {
      await httpClient.put<unknown>(`${BASE}/entries/${key}`, { value });
      store.setEntry(key, value);
    } catch (e) { handleError(e, '更新设置失败'); }
  }

  async function batchUpdate(items: Array<{ key: string; value: unknown }>) {
    store.setError(null);
    try {
      await httpClient.put<unknown>(`${BASE}/entries/batch`, { entries: items });
      items.forEach(({ key, value }) => store.setEntry(key, value));
    } catch (e) { handleError(e, '批量更新设置失败'); }
  }

  async function resetToDefaults() {
    store.setError(null);
    try {
      const setting = await httpClient.post<UserSettingClientDTO>(`${BASE}/reset`);
      store.setUserSetting(setting);
    } catch (e) { handleError(e, '重置设置失败'); }
  }

  async function exportSettings() {
    try { return await httpClient.get<unknown>(`${BASE}/export`); }
    catch (e) { handleError(e, '导出设置失败'); return null; }
  }

  async function importSettings(data: unknown) {
    store.setError(null);
    try {
      const setting = await httpClient.post<UserSettingClientDTO>(`${BASE}/import`, data);
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
