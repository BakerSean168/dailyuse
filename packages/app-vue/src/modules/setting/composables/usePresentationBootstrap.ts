import { watch } from 'vue';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { useUserSettingStore } from '../stores/user-setting-store';
import { getI18nGlobal } from '../../../plugins/i18n';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import type { UserSettingClientDTO } from '@memoflow/contracts/setting';

export function usePresentationBootstrap() {
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

  /**
   * Load the defaults eagerly (best-effort) so the store getter fallback
   * (getCategory/getValue) can resolve for a brand-new user before their
   * settings record exists. A defaults failure never blocks the settings load
   * nor surfaces an error — it only disables the fallback for that boot.
   */
  async function loadDefaultsIfNeeded(): Promise<void> {
    if (userSettingStore.defaults) {
      return;
    }
    try {
      const data = unwrapOrThrowError<UserSettingClientDTO>(
        await settingService.getUserSettingDefaults(),
      );
      userSettingStore.setDefaults(data);
    } catch {
      // Best-effort: keep the defaults fallback unavailable rather than failing
      // the whole presentation bootstrap.
    }
  }

  async function loadUserSettings(): Promise<void> {
    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = (async () => {
      userSettingStore.setLoading(true);
      userSettingStore.setError(null);

      try {
        // Kick off defaults concurrently with the settings request. Defaults
        // are best-effort; only the settings load can fail the bootstrap.
        const defaultsPromise = loadDefaultsIfNeeded();
        const data = unwrapOrThrowError<UserSettingClientDTO>(await settingService.getUserSettings());
        userSettingStore.setUserSetting(data);
        userSettingStore.setInitialized(true);
        presentationStore.syncFromUserSetting(data.preferences);
        await defaultsPromise;
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

  scheduleLoadUserSettings();

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
