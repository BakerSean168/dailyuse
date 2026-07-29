import { watch } from 'vue';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
import { useAuthenticationStore } from '../../authentication/stores/authentication-store';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { useUserSettingStore } from '../stores/user-setting-store';
import { getI18nGlobal } from '../../../plugins/i18n';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import type { UserSettingClientDTO } from '@memoflow/contracts/setting';

export function usePresentationBootstrap() {
  const authStore = useAuthenticationStore();
  const userSettingStore = useUserSettingStore();
  const presentationStore = usePresentationPreferenceStore();
  const settingService = useStrictInject(SETTING_SERVICE_KEY, 'SettingService');

  let loadingPromise: Promise<void> | null = null;
  let scheduledLoad: ReturnType<typeof globalThis.setTimeout> | null = null;
  let scheduledIdleHandle: number | null = null;
  const browserWindow = globalThis as unknown as {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  function cancelScheduledLoad() {
    if (scheduledLoad !== null) {
      clearTimeout(scheduledLoad);
      scheduledLoad = null;
    }

    const cancelIdleCallback = browserWindow.cancelIdleCallback;
    if (scheduledIdleHandle !== null && cancelIdleCallback) {
      cancelIdleCallback(scheduledIdleHandle);
      scheduledIdleHandle = null;
    }
  }

  function scheduleLoadUserSettings() {
    if (loadingPromise || scheduledLoad !== null) {
      return;
    }

    const run = () => {
      scheduledLoad = null;
      scheduledIdleHandle = null;
      void loadUserSettings();
    };

    if (browserWindow.requestIdleCallback) {
      scheduledIdleHandle = browserWindow.requestIdleCallback(run, { timeout: 3000 });
      return;
    }

    scheduledLoad = globalThis.setTimeout(run, 0);
  }

  if (userSettingStore.userSetting) {
    presentationStore.syncFromUserSetting(userSettingStore.userSetting.preferences);
  }

  async function loadUserSettings(): Promise<void> {
    if (!authStore.isAuthenticated) {
      return;
    }

    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = (async () => {
      userSettingStore.setLoading(true);
      userSettingStore.setError(null);

      try {
        const data = unwrapOrThrowError<UserSettingClientDTO>(await settingService.getUserSettings());
        userSettingStore.setUserSetting(data);
        userSettingStore.setInitialized(true);
        presentationStore.syncFromUserSetting(data.preferences);
      } catch (error) {
        const t = getI18nGlobal()?.t;
        userSettingStore.setError(
          t
            ? translateResultError(error, t, {
                fallbackKey: 'setting.errors.loadFailed',
              })
            : error instanceof Error
              ? error.message
              : String(error),
        );
      } finally {
        userSettingStore.setLoading(false);
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        scheduleLoadUserSettings();
        return;
      }

      cancelScheduledLoad();
      userSettingStore.reset();
    },
    { immediate: true },
  );

  watch(
    () => userSettingStore.userSetting,
    (setting) => {
      if (setting) {
        presentationStore.syncFromUserSetting(setting.preferences);
      }
    },
  );

  return {
    loadUserSettings,
  };
}
