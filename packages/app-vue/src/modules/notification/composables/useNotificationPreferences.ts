// Product boundary (architecture decision A): Desktop notifications are system-explicit
// (desktop durable worker), NOT user-configurable via preferences UI.
/**
 * useNotificationPreferences — residual 199
 *
 * Loads/updates NotificationPreference via NotificationClientPort.
 * Identity is never passed from the UI; transport auth stamps it server-side.
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  NotificationChannelType,
  NotificationPreferenceClientDTO,
  UpdateNotificationPreferenceReq,
} from '@memoflow/contracts/notification';

export const NOTIFICATION_PREFERENCE_MODULES = [
  'task',
  'goal',
  'schedule',
  'reminder',
  'account',
  'system',
] as const;

export type NotificationPreferenceModule = (typeof NOTIFICATION_PREFERENCE_MODULES)[number];

export type PreferenceChannelFlag = 'inApp' | 'push';

const CHANNEL_FLAG_TO_TYPE: Record<PreferenceChannelFlag, NotificationChannelType> = {
  inApp: 'InApp',
  push: 'Push',
};

function toPreferenceErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return t(fallbackKey);
}

export function useNotificationPreferences() {
  const service = useStrictInject(NOTIFICATION_SERVICE_KEY, 'NotificationService');
  const { t } = useI18n();

  const preference = ref<NotificationPreferenceClientDTO | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  const settings = computed(() => preference.value?.settings ?? {});

  function hasChannel(moduleName: string, flag: PreferenceChannelFlag): boolean {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    return (settings.value[moduleName] ?? []).includes(type);
  }

  async function loadPreferences(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await service.getPreferences();
      if (result.ok) {
        preference.value = result.data;
      } else {
        error.value = toPreferenceErrorMessage(
          result.error,
          t,
          'setting.notifications.loadPreferencesFailed',
        );
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePreferences(
    request: UpdateNotificationPreferenceReq,
  ): Promise<boolean> {
    isSaving.value = true;
    error.value = null;
    try {
      const result = await service.updatePreferences(request);
      if (result.ok) {
        preference.value = result.data;
        return true;
      }
      error.value = toPreferenceErrorMessage(
        result.error,
        t,
        'setting.notifications.updatePreferencesFailed',
      );
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function setModuleChannel(
    moduleName: NotificationPreferenceModule,
    flag: PreferenceChannelFlag,
    enabled: boolean,
  ): Promise<boolean> {
    const current = {
      inApp: hasChannel(moduleName, 'inApp'),
      push: hasChannel(moduleName, 'push'),
      email: false,
      sms: false,
    };
    current[flag] = enabled;
    return updatePreferences({
      categories: {
        [moduleName]: current,
      },
    });
  }

  return {
    preference,
    settings,
    isLoading,
    isSaving,
    error,
    modules: NOTIFICATION_PREFERENCE_MODULES,
    hasChannel,
    loadPreferences,
    updatePreferences,
    setModuleChannel,
  };
}
