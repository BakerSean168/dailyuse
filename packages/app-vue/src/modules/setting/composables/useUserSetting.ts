/**
 * useUserSetting - 设置模块主 composable
 *
 * 通过 inject 获取 SettingClientService。
 * NOTE: SettingClientService 返回 raw Promise<T>（非 Result<T>），
 * 失败时会抛出异常，因此使用 try/catch 处理错误。
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingStore } from '../stores/userSettingStore';
import { usePresentationPreferenceStore } from '../stores/presentationPreferenceStore';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { PreferenceCategory, UserSettingPreferences } from '@dailyuse/contracts/setting';
import { translateResultError } from '../../../shared/utils/translateResultError';

export function useUserSetting() {
  const { t } = useI18n();
  const service = useStrictInject(SETTING_SERVICE_KEY, 'SettingService');
  const store = useUserSettingStore();
  const presentationStore = usePresentationPreferenceStore();

  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);
  const defaults = computed(() => store.defaults);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  /** 获取指定分类设置 */
  function getCategory<K extends PreferenceCategory>(
    category: K,
  ): UserSettingPreferences[K] | undefined {
    return store.userSetting?.preferences?.[category];
  }

  /** 按 dot-notation key 获取值 (e.g., 'appearance.theme') */
  function getValue(key: string): unknown {
    return store.getValue(key);
  }

  async function loadSettings() {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await service.getUserSettings();
      store.setUserSetting(data);
      store.setInitialized(true);
      presentationStore.syncFromUserSetting(data.preferences);
    } catch (e: unknown) {
      handleError(e, 'setting.errors.loadFailed');
    } finally {
      store.setLoading(false);
    }
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
    store.setError(null);
    try {
      const data = await service.patchCategory(
        category,
        sanitizeForIpc(partial) as Record<string, unknown>,
      );
      store.setUserSetting(data);
      store.setInitialized(true);
      presentationStore.syncFromUserSetting(data.preferences);
      return data;
    } catch (e: unknown) {
      handleError(e, 'setting.errors.updateFailed');
      return null;
    }
  }

  async function resetToDefaults(_category?: PreferenceCategory) {
    store.setError(null);
    try {
      const data = await service.resetUserSettings();
      store.setUserSetting(data);
      store.setInitialized(true);
      presentationStore.syncFromUserSetting(data.preferences);
    } catch (e: unknown) {
      handleError(e, 'setting.errors.resetFailed');
    }
  }

  async function exportSettings() {
    try {
      return await service.exportSettings();
    } catch (e: unknown) {
      handleError(e, 'setting.errors.exportFailed');
      return null;
    }
  }

  async function importSettings(data: unknown) {
    store.setError(null);
    try {
      const result = await service.importSettings(sanitizeForIpc(data) as string);
      store.setUserSetting(result);
      store.setInitialized(true);
      presentationStore.syncFromUserSetting(result.preferences);
    } catch (e: unknown) {
      handleError(e, 'setting.errors.importFailed');
    }
  }

  return {
    userSetting,
    defaults,
    isLoading,
    error,
    getCategory,
    getValue,
    loadSettings,
    loadDefaults,
    updateCategory,
    resetToDefaults,
    exportSettings,
    importSettings,
  };
}
