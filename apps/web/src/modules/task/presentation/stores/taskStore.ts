/**
 * Task Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskFolderClientDTO,
} from '@dailyuse/contracts/task';

export interface TaskState {
  templates: TaskTemplateClientDTO[];
  instances: TaskInstanceClientDTO[];
  folders: TaskFolderClientDTO[];
  currentTemplate: TaskTemplateClientDTO | null;
  currentInstance: TaskInstanceClientDTO | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    templates: [],
    instances: [],
    folders: [],
    currentTemplate: null,
    currentInstance: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  getters: {
    getTemplateById: (state) => (id: string) => state.templates.find((t) => t.id === id),
    getInstanceById: (state) => (id: string) => state.instances.find((i) => i.id === id),
    activeTemplateCount: (state): number => state.templates.filter((t) => t.status === 'Active').length,
    totalPages: (state): number => Math.ceil(state.pagination.total / state.pagination.pageSize),
  },

  actions: {
    setTemplates(t: TaskTemplateClientDTO[], total?: number) {
      this.templates = t;
      if (total !== undefined) this.pagination.total = total;
    },
    addTemplate(t: TaskTemplateClientDTO) { this.templates.unshift(t); this.pagination.total++; },
    updateTemplate(t: TaskTemplateClientDTO) {
      const i = this.templates.findIndex((x) => x.id === t.id);
      if (i !== -1) this.templates[i] = t;
      if (this.currentTemplate?.id === t.id) this.currentTemplate = t;
    },
    removeTemplate(id: string) {
      this.templates = this.templates.filter((t) => t.id !== id);
      this.pagination.total--;
      if (this.currentTemplate?.id === id) this.currentTemplate = null;
    },
    setCurrentTemplate(t: TaskTemplateClientDTO | null) { this.currentTemplate = t; },

    setInstances(i: TaskInstanceClientDTO[]) { this.instances = i; },
    addInstance(i: TaskInstanceClientDTO) { this.instances.push(i); },
    updateInstance(i: TaskInstanceClientDTO) {
      const idx = this.instances.findIndex((x) => x.id === i.id);
      if (idx !== -1) this.instances[idx] = i;
      if (this.currentInstance?.id === i.id) this.currentInstance = i;
    },
    removeInstance(id: string) { this.instances = this.instances.filter((i) => i.id !== id); },
    setCurrentInstance(i: TaskInstanceClientDTO | null) { this.currentInstance = i; },

    setFolders(f: TaskFolderClientDTO[]) { this.folders = f; },

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

export type TaskStoreType = ReturnType<typeof useTaskStore>;
