import { beforeEach, describe, expect, it } from 'vitest';
import type { UserSettingClientDTO, LocalePreferences, UserSettingPreferences } from '@memoflow/contracts/setting';
import { createTestPinia } from '@memoflow/test-utils';
import { useUserSettingStore } from './user-setting-store';

function createSetting(
  overrides: Partial<UserSettingClientDTO> = {},
): UserSettingClientDTO {
  return {
    id: 'setting-1' as UserSettingClientDTO['id'],
    preferences: {
      appearance: { theme: 'dark' },
      locale: { language: 'zh-CN' } as LocalePreferences,
    } as UserSettingPreferences,
    ...overrides,
  } as UserSettingClientDTO;
}

describe('useUserSettingStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('reads category and dot-notation values and mutates common flags', () => {
    const store = useUserSettingStore();
    const setting = createSetting();
    const defaults = createSetting({
      id: 'setting-defaults' as UserSettingClientDTO['id'],
      preferences: {
        appearance: { theme: 'auto' },
        locale: { language: 'en-US' } as LocalePreferences,
      } as UserSettingPreferences,
    });

    store.setUserSetting(setting);
    store.setDefaults(defaults);
    store.setLoading(true);
    store.setError('bad state');
    store.setInitialized(true);

    expect(store.getCategory('appearance')).toEqual({ theme: 'dark' });
    expect(store.getValue('appearance.theme')).toBe('dark');
    expect(store.getValue('locale.language')).toBe('zh-CN');
    expect(store.defaults?.id).toBe('setting-defaults');
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('bad state');
    expect(store.isInitialized).toBe(true);

    store.reset();
    expect(store.userSetting).toBeNull();
    expect(store.defaults).toBeNull();
    expect(store.isInitialized).toBe(false);
  });
});
