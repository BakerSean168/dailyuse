import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { UserSettingClientDTO, UserSettingPreferences } from '@memoflow/contracts/setting';
import { createTestPinia } from '@memoflow/test-utils';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { useAuthenticationStore } from '../../authentication/stores/authentication-store';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { useUserSettingStore } from '../stores/user-setting-store';
import { usePresentationBootstrap } from './usePresentationBootstrap';

function createSetting(): UserSettingClientDTO {
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
        useCustomNotification: false,
      },
    } as UserSettingPreferences,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
  } as UserSettingClientDTO;
}

function mountComposable(
  serviceOverrides: Partial<{
    getUserSettings: () => Promise<unknown>;
  }> = {},
) {
  let composable!: ReturnType<typeof usePresentationBootstrap>;
  const service = {
    getUserSettings: vi.fn(),
    ...serviceOverrides,
  };

  mount(
    defineComponent({
      setup() {
        composable = usePresentationBootstrap();
        return () => h('div');
      },
    }),
    {
      global: {
        provide: {
          [SETTING_SERVICE_KEY as symbol]: service,
        },
      },
    },
  );

  return { composable, service };
}

describe('usePresentationBootstrap', () => {
  beforeEach(() => {
    createTestPinia();
    vi.clearAllMocks();
  });

  it('unwraps settings results before syncing the shared stores', async () => {
    const setting = createSetting();
    const { composable, service } = mountComposable({
      getUserSettings: vi.fn().mockResolvedValue(ok(setting)),
    });

    const authStore = useAuthenticationStore();
    authStore.setCurrentIdentity({ id: 'identity-1' } as never);
    authStore.setAccessToken('token');

    await composable.loadUserSettings();

    expect(service.getUserSettings).toHaveBeenCalled();
    expect(useUserSettingStore().userSetting).toEqual(setting);
    expect(usePresentationPreferenceStore().theme).toBe('dark');
    expect(usePresentationPreferenceStore().locale).toBe('en-US');
  });
});
