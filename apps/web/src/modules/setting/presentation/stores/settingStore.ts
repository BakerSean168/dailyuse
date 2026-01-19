/**
 * Setting Store - Pinia 状态管理
 * 管理 Setting 模块的所有状态
 */

import { defineStore } from 'pinia';
import type { UserSettingDTO, ThemeConfigDTO } from '@dailyuse/contracts/setting';

export interface SettingState {
  userSettings: UserSettingDTO | null;
  themeConfig: ThemeConfigDTO | null;
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  language: string;
}

export const useSettingStore = defineStore('setting', {
  state: (): SettingState => ({
    userSettings: null,
    themeConfig: null,
    isLoading: false,
    error: null,
    isDarkMode: false,
    language: 'en',
  }),

  getters: {
    getUserSettings: (state) => state.userSettings,
    getThemeConfig: (state) => state.themeConfig,
    getLanguage: (state) => state.language,
  },

  actions: {
    setUserSettings(settings: UserSettingDTO | null) {
      this.userSettings = settings;
    },

    setThemeConfig(config: ThemeConfigDTO | null) {
      this.themeConfig = config;
    },

    setDarkMode(isDark: boolean) {
      this.isDarkMode = isDark;
    },

    setLanguage(lang: string) {
      this.language = lang;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    reset() {
      this.userSettings = null;
      this.themeConfig = null;
      this.isLoading = false;
      this.error = null;
      this.isDarkMode = false;
      this.language = 'en';
    },
  },

  persist: {
    paths: ['isDarkMode', 'language'],
  },
});
