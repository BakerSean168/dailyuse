/**
 * Reminder Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
} from '@dailyuse/contracts/reminder';

export interface ReminderState {
  templates: ReminderTemplateClientDTO[];
  groups: ReminderGroupClientDTO[];
  currentTemplate: ReminderTemplateClientDTO | null;
  currentGroup: ReminderGroupClientDTO | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useReminderStore = defineStore('reminder', {
  state: (): ReminderState => ({
    templates: [],
    groups: [],
    currentTemplate: null,
    currentGroup: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  actions: {
    // Templates
    setTemplates(items: ReminderTemplateClientDTO[], total?: number) {
      this.templates = items;
      if (total !== undefined) this.pagination.total = total;
    },
    addTemplate(t: ReminderTemplateClientDTO) { this.templates.push(t); },
    updateTemplate(t: ReminderTemplateClientDTO) {
      const idx = this.templates.findIndex((x) => x.id === t.id);
      if (idx >= 0) this.templates[idx] = t;
    },
    removeTemplate(id: string) {
      this.templates = this.templates.filter((t) => t.id !== id);
    },
    setCurrentTemplate(t: ReminderTemplateClientDTO | null) { this.currentTemplate = t; },

    // Groups
    setGroups(items: ReminderGroupClientDTO[]) { this.groups = items; },
    addGroup(g: ReminderGroupClientDTO) { this.groups.push(g); },
    updateGroup(g: ReminderGroupClientDTO) {
      const idx = this.groups.findIndex((x) => x.id === g.id);
      if (idx >= 0) this.groups[idx] = g;
    },
    removeGroup(id: string) {
      this.groups = this.groups.filter((g) => g.id !== id);
    },
    setCurrentGroup(g: ReminderGroupClientDTO | null) { this.currentGroup = g; },

    setLoading(v: boolean) { this.isLoading = v; },
    setError(e: string | null) { this.error = e; },
    setPage(p: number) { this.pagination.page = p; },
    setInitialized(v: boolean) { this.isInitialized = v; },

    reset() { this.$reset(); },
  },

  persist: {
    pick: ['pagination'] as string[],
  },
});

export type ReminderStoreType = ReturnType<typeof useReminderStore>;
