import { defineStore } from 'pinia';
import type { UserSettingPreferences } from '@dailyuse/contracts/setting';
import type { AppLocale } from '../../../plugins/i18n';

export type PresentationThemeMode = 'light' | 'dark' | 'auto';

function normalizeLocale(value: unknown): AppLocale {
  return value === 'en-US' || value === 'zh-CN' ? value : detectBrowserLocale();
}

function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') {
    return 'zh-CN';
  }

  const candidates = [...navigator.languages, navigator.language].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  return candidates.some((value) => value.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en-US';
}

function normalizeTheme(value: unknown): PresentationThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}

export interface PresentationPreferenceState {
  locale: AppLocale;
  theme: PresentationThemeMode;
}

export const usePresentationPreferenceStore = defineStore('presentation-preference', {
  state: (): PresentationPreferenceState => ({
    locale: detectBrowserLocale(),
    theme: 'auto',
  }),

  actions: {
    setLocale(locale: AppLocale) {
      this.locale = normalizeLocale(locale);
    },

    setTheme(theme: PresentationThemeMode) {
      this.theme = normalizeTheme(theme);
    },

    syncFromUserSetting(preferences?: Partial<UserSettingPreferences> | null) {
      const locale = preferences?.locale?.language;
      const theme = preferences?.appearance?.theme;

      if (locale !== undefined) {
        this.locale = normalizeLocale(locale);
      }

      if (theme !== undefined) {
        this.theme = normalizeTheme(theme);
      }
    },
  },

  persist: {
    pick: ['locale', 'theme'] as Array<keyof PresentationPreferenceState>,
  },
});
