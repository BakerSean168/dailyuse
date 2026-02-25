/**
 * Schedule Store - Pinia 状态管理
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type {
  ScheduleTaskClientDTO,
  ScheduleExecutionClientDTO,
} from '@dailyuse/contracts/schedule';

export interface ScheduleState {
  tasks: ScheduleTaskClientDTO[];
  executions: ScheduleExecutionClientDTO[];
  currentTask: ScheduleTaskClientDTO | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useScheduleStore = defineStore('schedule', {
  state: (): ScheduleState => ({
    tasks: [],
    executions: [],
    currentTask: null,
    isLoading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  actions: {
    setTasks(items: ScheduleTaskClientDTO[], total?: number) {
      this.tasks = items;
      if (total !== undefined) this.pagination.total = total;
    },
    addTask(t: ScheduleTaskClientDTO) { this.tasks.push(t); },
    updateTask(t: ScheduleTaskClientDTO) {
      const idx = this.tasks.findIndex((x) => x.id === t.id);
      if (idx >= 0) this.tasks[idx] = t;
    },
    removeTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
    },
    setCurrentTask(t: ScheduleTaskClientDTO | null) { this.currentTask = t; },

    setExecutions(items: ScheduleExecutionClientDTO[]) { this.executions = items; },

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

export type ScheduleStoreType = ReturnType<typeof useScheduleStore>;
