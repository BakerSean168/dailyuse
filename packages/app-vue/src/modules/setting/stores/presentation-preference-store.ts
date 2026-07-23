import { defineStore } from 'pinia';
import type { UserSettingPreferences } from '@dailyuse/contracts/setting';
import type { AppLocale } from '../../../plugins/i18n';
// Residual 1005: sole presentation helpers (local dual retired).
import {
  detectBrowserLocale,
  normalizeLocale,
  normalizeTheme,
  type PresentationThemeMode,
} from '@dailyuse/utils/shared';

export type { PresentationThemeMode };

// Residual 1005: detectBrowserLocale/normalizeLocale/normalizeTheme elevated to @dailyuse/utils/shared.

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
