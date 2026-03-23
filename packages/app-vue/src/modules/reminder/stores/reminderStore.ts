/**
 * Reminder Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  UserReminderPreferencesClientDTO,
} from '@dailyuse/contracts/reminder';

export interface ReminderState {
  templates: ReminderTemplateClientDTO[];
  groups: ReminderGroupClientDTO[];
  preferences: UserReminderPreferencesClientDTO | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useReminderStore = defineStore('reminder', {
  state: (): ReminderState => ({
    templates: [],
    groups: [],
    preferences: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  actions: {
    // Templates
    setTemplates(items: ReminderTemplateClientDTO[], total?: number) {
      this.templates = items;
    },
    addTemplate(t: ReminderTemplateClientDTO) {
      this.templates.push(t);
    },
    updateTemplate(t: ReminderTemplateClientDTO) {
      const idx = this.templates.findIndex((x) => x.id === t.id);
      if (idx >= 0) this.templates[idx] = t;
    },
    removeTemplate(id: string) {
      this.templates = this.templates.filter((t) => t.id !== id);
    },
    // Groups
    setGroups(items: ReminderGroupClientDTO[]) {
      this.groups = items;
    },
    addGroup(g: ReminderGroupClientDTO) {
      this.groups.push(g);
    },
    updateGroup(g: ReminderGroupClientDTO) {
      const idx = this.groups.findIndex((x) => x.id === g.id);
      if (idx >= 0) this.groups[idx] = g;
    },
    removeGroup(id: string) {
      this.groups = this.groups.filter((g) => g.id !== id);
    },
    setPreferences(p: UserReminderPreferencesClientDTO | null) {
      this.preferences = p;
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
});

export type ReminderStoreType = ReturnType<typeof useReminderStore>;
