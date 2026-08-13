import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { UserSettingClientDTO, UserSettingPreferences } from '@memoflow/contracts/setting';
import { createTestPinia } from '@memoflow/test-utils';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
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

function createDefaults(): UserSettingClientDTO {
  return {
    id: 'setting-defaults' as UserSettingClientDTO['id'],
    identityId: 'identity-1' as UserSettingClientDTO['identityId'],
    preferences: {
      ...createSetting().preferences,
      appearance: { theme: 'auto' },
    } as UserSettingPreferences,
    version: 0,
    createdAt: 0,
    updatedAt: 0,
  } as UserSettingClientDTO;
}

function mountComposable(
  serviceOverrides: Partial<{
    getUserSettings: () => Promise<unknown>;
    getUserSettingDefaults: () => Promise<unknown>;
  }> = {},
) {
  let composable!: ReturnType<typeof usePresentationBootstrap>;
  // A dedicated pinia per mount keeps the store (and any in-flight bootstrap
  // continuation) isolated from other tests in the same worker.
  const pinia = createTestPinia();
  const service = {
    getUserSettings: vi.fn(),
    getUserSettingDefaults: vi.fn(),
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
        plugins: [pinia],
        provide: {
          [SETTING_SERVICE_KEY as symbol]: service,
        },
      },
    },
  );

  return { composable, service, pinia };
}

describe('usePresentationBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The composable schedules an automatic loadUserSettings on mount. Tests
    // drive the load explicitly, so stub setTimeout to a non-firing handle to
    // stop the auto-scheduled macrotask from leaking into later tests' pinias.
    vi.stubGlobal('setTimeout', vi.fn(() => 1));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps settings results before syncing the shared stores', async () => {
    const setting = createSetting();
    const { composable, service, pinia } = mountComposable({
      getUserSettings: vi.fn().mockResolvedValue(ok(setting)),
    });

    await composable.loadUserSettings();

    expect(service.getUserSettings).toHaveBeenCalled();
    expect(useUserSettingStore(pinia).userSetting).toEqual(setting);
    expect(usePresentationPreferenceStore(pinia).theme).toBe('dark');
    expect(usePresentationPreferenceStore(pinia).locale).toBe('en-US');
  });

  it('loads defaults eagerly so a brand-new user sees default values at startup', async () => {
    const defaults = createDefaults();
    const userSetting = createSetting();
    // A fresh account whose settings record has no appearance preference yet.
    delete (userSetting.preferences as Record<string, unknown>).appearance;
    const { composable, service, pinia } = mountComposable({
      getUserSettings: vi.fn().mockResolvedValue(ok(userSetting)),
      getUserSettingDefaults: vi.fn().mockResolvedValue(ok(defaults)),
    });

    await composable.loadUserSettings();

    expect(service.getUserSettingDefaults).toHaveBeenCalledTimes(1);
    expect(useUserSettingStore(pinia).defaults).toEqual(defaults);
    // The store getter falls back to the loaded defaults for a fresh account.
    expect(useUserSettingStore(pinia).getCategory('appearance')).toEqual({ theme: 'auto' });
  });

  it('keeps the settings load working when the defaults request fails', async () => {
    const setting = createSetting();
    const { composable, service, pinia } = mountComposable({
      getUserSettings: vi.fn().mockResolvedValue(ok(setting)),
      getUserSettingDefaults: vi.fn().mockResolvedValue(fail({ code: 'SERVICE_UNAVAILABLE', message: 'down' })),
    });

    await composable.loadUserSettings();

    // Defaults failure must not surface an error nor block the settings load.
    expect(useUserSettingStore(pinia).userSetting).toEqual(setting);
    expect(useUserSettingStore(pinia).error).toBeNull();
    expect(useUserSettingStore(pinia).defaults).toBeNull();
    expect(usePresentationPreferenceStore(pinia).theme).toBe('dark');
  });
});
