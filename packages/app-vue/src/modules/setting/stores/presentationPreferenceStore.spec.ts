import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPinia } from '@dailyuse/test-utils';
import { usePresentationPreferenceStore } from './presentationPreferenceStore';

describe('usePresentationPreferenceStore', () => {
  beforeEach(() => {
    createTestPinia();
    vi.stubGlobal('navigator', {
      language: 'en-US',
      languages: ['en-US'],
    });
  });

  it('normalizes locale and theme through direct setters', () => {
    const store = usePresentationPreferenceStore();

    store.setLocale('zh-CN');
    store.setTheme('dark');
    expect(store.locale).toBe('zh-CN');
    expect(store.theme).toBe('dark');

    store.setLocale('fr-FR' as never);
    store.setTheme('sepia' as never);

    expect(store.locale).toBe('en-US');
    expect(store.theme).toBe('auto');
  });

  it('syncs partial user settings without overwriting omitted values', () => {
    const store = usePresentationPreferenceStore();
    store.setLocale('zh-CN');
    store.setTheme('light');

    store.syncFromUserSetting({
      appearance: { theme: 'dark' },
    });
    expect(store.locale).toBe('zh-CN');
    expect(store.theme).toBe('dark');

    store.syncFromUserSetting({
      locale: { language: 'en-US' },
      appearance: { theme: 'invalid-theme' as never },
    });

    expect(store.locale).toBe('en-US');
    expect(store.theme).toBe('auto');
  });
});
