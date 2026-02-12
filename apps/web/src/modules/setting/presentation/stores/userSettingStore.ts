/**
 * User Setting Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 *
 * 注意: 同时导出为 useSettingStore 以保持向后兼容。
 */

import { defineStore } from 'pinia';
import type { UserSettingClientDTO, SettingEntryClientDTO } from '@dailyuse/contracts/setting';

export interface SettingState {
  userSetting: UserSettingClientDTO | null;
  entries: Record<string, unknown>;
  defaults: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useUserSettingStore = defineStore('user-setting', {
  state: (): SettingState => ({
    userSetting: null,
    entries: {},
    defaults: {},
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    getEntry: (state) => (key: string) => state.entries[key],
    hasEntry: (state) => (key: string) => key in state.entries,
  },

  actions: {
    setUserSetting(setting: UserSettingClientDTO | null) {
      this.userSetting = setting;
      if (setting?.entries) {
        try {
          this.entries = typeof setting.entries === 'string'
            ? JSON.parse(setting.entries)
            : setting.entries;
        } catch { this.entries = {}; }
      }
    },
    setEntry(key: string, value: unknown) { this.entries[key] = value; },
    setDefaults(defaults: Record<string, unknown>) { this.defaults = defaults; },

    async loadSettings() {
      // Stub — composable fills this via API
    },
    async loadDefaults() {
      // Stub — composable fills this via API
    },

    setLoading(v: boolean) { this.isLoading = v; },
    setError(e: string | null) { this.error = e; },
    setInitialized(v: boolean) { this.isInitialized = v; },

    reset() { this.$reset(); },
  },

  persist: {
    pick: ['entries'] as string[],
  },
});

/** Backward compatible alias */
export const useSettingStore = useUserSettingStore;

export type UserSettingStoreType = ReturnType<typeof useUserSettingStore>;
