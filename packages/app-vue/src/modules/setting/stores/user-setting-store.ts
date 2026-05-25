/**
 * User Setting Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 *
 * 使用新的分类偏好模型:
 *   setting.appearance.theme, setting.locale.language 等
 *
 */

import { defineStore } from 'pinia';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
import type { PreferenceCategory, UserSettingPreferences } from '@dailyuse/contracts/setting';

export interface SettingState {
  userSetting: UserSettingClientDTO | null;
  defaults: UserSettingClientDTO | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useUserSettingStore = defineStore('user-setting', {
  state: (): SettingState => ({
    userSetting: null,
    defaults: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    /** 获取指定分类的偏好设置 */
    getCategory:
      (state) =>
      <K extends PreferenceCategory>(category: K): UserSettingPreferences[K] | undefined =>
        state.userSetting?.preferences?.[category],

    /** 按 dot-notation key 获取值 (e.g., 'appearance.theme') */
    getValue:
      (state) =>
      (key: string): unknown => {
        if (!state.userSetting?.preferences) return undefined;
        const [category, field] = key.split('.', 2);
        const cat = state.userSetting.preferences[category as PreferenceCategory];
        return cat ? (cat as Record<string, unknown>)[field] : undefined;
      },
  },

  actions: {
    setUserSetting(setting: UserSettingClientDTO | null) {
      this.userSetting = setting;
    },
    setDefaults(defaults: UserSettingClientDTO | null) {
      this.defaults = defaults;
    },

    async loadSettings() {
      // Stub — composable fills this via API
    },
    async loadDefaults() {
      // Stub — composable fills this via API
    },

    setLoading(v: boolean) {
      this.isLoading = v;
    },
    setError(e: string | null) {
      this.error = e;
    },
    setInitialized(v: boolean) {
      this.isInitialized = v;
    },

    reset() {
      this.$reset();
    },
  },

  persist: {
    pick: ['userSetting'] as string[],
  },
});

export type UserSettingStoreType = ReturnType<typeof useUserSettingStore>;
