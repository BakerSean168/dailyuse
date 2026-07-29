/**
 * Residual 973: createComposableHandleError sole factory.
 * useUserSetting - 设置模块主 composable
 *
 * 通过 inject 获取 setting client seam。
 * Setting client 返回 Result<T>，在这里统一解包为 DTO，
 * 失败时抛出结构化异常后由 try/catch 处理。
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
import { useUserSettingStore } from '../stores/user-setting-store';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  PreferenceCategory,
  UserSettingClientDTO,
  UserSettingPreferences,
} from '@memoflow/contracts/setting';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';

export function useUserSetting() {
  const { t } = useI18n();
  const service = useStrictInject(SETTING_SERVICE_KEY, 'SettingService');
  const store = useUserSettingStore();
  const presentationStore = usePresentationPreferenceStore();

  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const userSetting = computed(() => store.userSetting);
  const defaults = computed(() => store.defaults);

  const handleError = createComposableHandleError({
    t,
    setError: (message) => store.setError(message),
  });

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
      const data = unwrapOrThrowError<UserSettingClientDTO>(await service.getUserSettings());
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
      const data = unwrapOrThrowError<UserSettingClientDTO>(
        await service.patchCategory(category, sanitizeForIpc(partial) as Record<string, unknown>),
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
      const data = unwrapOrThrowError<UserSettingClientDTO>(await service.resetUserSettings());
      store.setUserSetting(data);
      store.setInitialized(true);
      presentationStore.syncFromUserSetting(data.preferences);
    } catch (e: unknown) {
      handleError(e, 'setting.errors.resetFailed');
    }
  }

  async function exportSettings() {
    try {
      return unwrapOrThrowError<string>(await service.exportSettings());
    } catch (e: unknown) {
      handleError(e, 'setting.errors.exportFailed');
      return null;
    }
  }

  async function importSettings(data: unknown) {
    store.setError(null);
    try {
      const result = unwrapOrThrowError<UserSettingClientDTO>(
        await service.importSettings(sanitizeForIpc(data) as string),
      );
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
