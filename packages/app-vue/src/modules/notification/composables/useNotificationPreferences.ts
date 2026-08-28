/**
 * Notification preference presentation/application adapter.
 *
 * The server owns workflow capability/defaults and authenticated identity. The UI only edits the
 * user-owned layers: global channel defaults, workflow overrides, DND, and rate limits.
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NotificationChannelType,
  type NotificationPreferenceClientDTO,
  type UpdateNotificationPreferenceReq,
} from '@memoflow/contracts/notification';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

export const NOTIFICATION_PREFERENCE_MODULES = [
  'task',
  'goal',
  'schedule',
  'reminder',
  'account',
  'system',
] as const;

export type NotificationPreferenceModule = (typeof NOTIFICATION_PREFERENCE_MODULES)[number];

export const USER_NOTIFICATION_CHANNELS = [
  { flag: 'inApp', type: NotificationChannelType.InApp },
  { flag: 'push', type: NotificationChannelType.Push },
] as const;

export type PreferenceChannelFlag = (typeof USER_NOTIFICATION_CHANNELS)[number]['flag'];
export type PreferenceDecisionSource = 'global' | 'workflow';

export interface NotificationPreferenceWorkflowPresentation {
  readonly id: string;
  readonly workflowKey: string;
  readonly module: NotificationPreferenceModule;
  readonly readOnly: boolean;
}

export interface NotificationPreferenceWorkflowGroup {
  readonly module: NotificationPreferenceModule;
  readonly workflows: readonly NotificationPreferenceWorkflowPresentation[];
}

const generalWorkflow = (
  module: NotificationPreferenceModule,
): NotificationPreferenceWorkflowPresentation => ({
  id: `${module}-general`,
  workflowKey: `${module}.general`,
  module,
  readOnly: false,
});

/** Product labels are resolved by stable presentation ids; raw workflow keys never reach the UI. */
export const NOTIFICATION_PREFERENCE_WORKFLOW_GROUPS: readonly NotificationPreferenceWorkflowGroup[] =
  [
    { module: 'task', workflows: [generalWorkflow('task')] },
    { module: 'goal', workflows: [generalWorkflow('goal')] },
    { module: 'schedule', workflows: [generalWorkflow('schedule')] },
    { module: 'reminder', workflows: [generalWorkflow('reminder')] },
    { module: 'account', workflows: [generalWorkflow('account')] },
    {
      module: 'system',
      workflows: [
        generalWorkflow('system'),
        {
          id: 'account-security',
          workflowKey: 'system.account-security',
          module: 'system',
          readOnly: true,
        },
      ],
    },
  ] as const;

const CHANNEL_FLAG_TO_TYPE: Record<PreferenceChannelFlag, NotificationChannelType> = {
  inApp: NotificationChannelType.InApp,
  push: NotificationChannelType.Push,
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

function copyPreferenceRequest(
  preference: NotificationPreferenceClientDTO | null,
  patch: UpdateNotificationPreferenceReq,
): UpdateNotificationPreferenceReq {
  const request: UpdateNotificationPreferenceReq = {
    globalChannels: {
      ...(preference?.globalChannels ?? {}),
      ...(patch.globalChannels ?? {}),
    },
    workflowOverrides: {
      ...(preference?.workflowOverrides ?? {}),
      ...(patch.workflowOverrides ?? {}),
    },
  };

  const doNotDisturb = patch.doNotDisturb ?? preference?.doNotDisturb;
  if (doNotDisturb)
    request.doNotDisturb = { ...doNotDisturb, daysOfWeek: [...doNotDisturb.daysOfWeek] };

  const rateLimit = patch.rateLimit ?? preference?.rateLimit;
  if (rateLimit) request.rateLimit = { ...rateLimit };

  return request;
}

export function useNotificationPreferences() {
  const service = useStrictInject(NOTIFICATION_SERVICE_KEY, 'NotificationService');
  const { t } = useI18n();

  const preference = ref<NotificationPreferenceClientDTO | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  const settings = computed(() => preference.value?.workflowOverrides ?? {});
  const doNotDisturb = computed(() => preference.value?.doNotDisturb ?? null);
  const rateLimit = computed(() => preference.value?.rateLimit ?? null);

  function globalChannelEnabled(flag: PreferenceChannelFlag): boolean {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    return preference.value?.globalChannels?.[type] ?? true;
  }

  function workflowChannelSource(
    workflowKey: string,
    flag: PreferenceChannelFlag,
  ): PreferenceDecisionSource {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    return preference.value?.workflowOverrides?.[workflowKey]?.[type] === undefined
      ? 'global'
      : 'workflow';
  }

  function workflowChannelEnabled(workflowKey: string, flag: PreferenceChannelFlag): boolean {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    const workflowValue = preference.value?.workflowOverrides?.[workflowKey]?.[type];
    return workflowValue ?? globalChannelEnabled(flag);
  }

  /** Compatibility helper retained for existing module-general callers. */
  function hasChannel(moduleName: string, flag: PreferenceChannelFlag): boolean {
    return workflowChannelEnabled(`${moduleName}.general`, flag);
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

  async function updatePreferences(request: UpdateNotificationPreferenceReq): Promise<boolean> {
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

  async function setGlobalChannel(flag: PreferenceChannelFlag, enabled: boolean): Promise<boolean> {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    return updatePreferences(
      copyPreferenceRequest(preference.value, {
        globalChannels: { [type]: enabled },
      }),
    );
  }

  async function setWorkflowChannel(
    workflowKey: string,
    flag: PreferenceChannelFlag,
    enabled: boolean,
  ): Promise<boolean> {
    const type = CHANNEL_FLAG_TO_TYPE[flag];
    const existingOverrides = preference.value?.workflowOverrides ?? {};
    return updatePreferences(
      copyPreferenceRequest(preference.value, {
        workflowOverrides: {
          ...existingOverrides,
          [workflowKey]: {
            ...(existingOverrides[workflowKey] ?? {}),
            [type]: enabled,
          },
        },
      }),
    );
  }

  /** Compatibility helper retained for existing module-general callers. */
  async function setModuleChannel(
    moduleName: NotificationPreferenceModule,
    flag: PreferenceChannelFlag,
    enabled: boolean,
  ): Promise<boolean> {
    return setWorkflowChannel(`${moduleName}.general`, flag, enabled);
  }

  async function saveDoNotDisturb(config: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  }): Promise<boolean> {
    return updatePreferences(
      copyPreferenceRequest(preference.value, {
        doNotDisturb: { ...config, daysOfWeek: [...config.daysOfWeek] },
      }),
    );
  }

  async function saveRateLimit(config: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  }): Promise<boolean> {
    return updatePreferences(copyPreferenceRequest(preference.value, { rateLimit: { ...config } }));
  }

  return {
    preference,
    settings,
    doNotDisturb,
    rateLimit,
    isLoading,
    isSaving,
    error,
    modules: NOTIFICATION_PREFERENCE_MODULES,
    userChannels: USER_NOTIFICATION_CHANNELS,
    workflowGroups: NOTIFICATION_PREFERENCE_WORKFLOW_GROUPS,
    globalChannelEnabled,
    workflowChannelEnabled,
    workflowChannelSource,
    hasChannel,
    loadPreferences,
    updatePreferences,
    setGlobalChannel,
    setWorkflowChannel,
    setModuleChannel,
    saveDoNotDisturb,
    saveRateLimit,
  };
}
