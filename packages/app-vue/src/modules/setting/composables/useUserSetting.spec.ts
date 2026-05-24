import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { UserSettingClientDTO, UserSettingPreferences } from '@dailyuse/contracts/setting';
import { createTestPinia } from '@dailyuse/test-utils';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { useUserSettingStore } from '../stores/user-setting-store';
import { useUserSetting } from './useUserSetting';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: {
        operationFailed: 'Operation failed',
      },
      setting: {
        errors: {
          loadFailed: 'Load failed',
          updateFailed: 'Update failed',
          resetFailed: 'Reset failed',
          exportFailed: 'Export failed',
          importFailed: 'Import failed',
        },
      },
    },
  },
});

function createSetting(
  overrides: Partial<UserSettingClientDTO> = {},
): UserSettingClientDTO {
  return {
    id: 'setting-1' as UserSettingClientDTO['id'],
    identityId: 'identity-1' as UserSettingClientDTO['identityId'],
    preferences: {
      appearance: { theme: 'dark' },
      locale: {
        language: 'en-US',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24H',
        currency: 'USD',
        weekStartsOn: 1,
      },
      notification: {
        email: true,
        push: true,
        inApp: true,
        sound: true,
        useCustomNotification: true,
      },
    } as UserSettingPreferences,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as UserSettingClientDTO;
}

function mountComposable(
  serviceOverrides: Partial<{
    getUserSettings: () => Promise<unknown>;
    patchCategory: (category: string, patch: Record<string, unknown>) => Promise<unknown>;
    resetUserSettings: () => Promise<unknown>;
    exportSettings: () => Promise<unknown>;
    importSettings: (data: string) => Promise<unknown>;
  }> = {},
) {
  let composable!: ReturnType<typeof useUserSetting>;
  const service = {
    getUserSettings: vi.fn(),
    patchCategory: vi.fn(),
    resetUserSettings: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    ...serviceOverrides,
  };

  mount(
    defineComponent({
      setup() {
        composable = useUserSetting();
        return () => h('div');
      },
    }),
    {
      global: {
        plugins: [i18n],
        provide: {
          [SETTING_SERVICE_KEY as symbol]: service,
        },
      },
    },
  );

  return { composable, service };
}

describe('useUserSetting', () => {
  beforeEach(() => {
    createTestPinia();
    vi.clearAllMocks();
  });

  it('unwraps successful settings results before hydrating the store', async () => {
    const setting = createSetting({
      preferences: {
        ...createSetting().preferences,
        appearance: { theme: 'light' },
        notification: {
          email: true,
          push: true,
          inApp: true,
          sound: true,
          useCustomNotification: false,
        },
      } as UserSettingPreferences,
    });
    const { composable, service } = mountComposable({
      getUserSettings: vi.fn().mockResolvedValue(ok(setting)),
    });

    await composable.loadSettings();

    const userSettingStore = useUserSettingStore();
    const presentationStore = usePresentationPreferenceStore();

    expect(service.getUserSettings).toHaveBeenCalledTimes(1);
    expect(userSettingStore.userSetting).toEqual(setting);
    expect(composable.getCategory('notification')?.useCustomNotification).toBe(false);
    expect(presentationStore.theme).toBe('light');
    expect(presentationStore.locale).toBe('en-US');
  });

  it('unwraps successful patch results before updating derived state', async () => {
    const initial = createSetting();
    const updated = createSetting({
      preferences: {
        ...initial.preferences,
        notification: {
          email: true,
          push: true,
          inApp: true,
          sound: true,
          useCustomNotification: false,
        },
      } as UserSettingPreferences,
      updatedAt: 2,
    });
    const { composable, service } = mountComposable({
      patchCategory: vi.fn().mockResolvedValue(ok(updated)),
    });

    useUserSettingStore().setUserSetting(initial);

    const result = await composable.updateCategory('notification', {
      useCustomNotification: false,
    });

    expect(service.patchCategory).toHaveBeenCalledWith('notification', {
      useCustomNotification: false,
    });
    expect(result).toEqual(updated);
    expect(useUserSettingStore().userSetting).toEqual(updated);
    expect(composable.getCategory('notification')?.useCustomNotification).toBe(false);
  });
});
