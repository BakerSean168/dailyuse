/**
 * Task Store - Pinia 状态管理
 * 管理 Task 模块的所有状态
 */

import { defineStore } from 'pinia';
import type { TaskDTO, TaskListResponseDTO } from '@dailyuse/contracts/task';

export interface TaskState {
  tasks: TaskDTO[];
  currentTask: TaskDTO | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  total: number;
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    tasks: [],
    currentTask: null,
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 20,
    total: 0,
  }),

  getters: {
    getTaskById: (state) => (id: string) => state.tasks.find((t) => t.id === id),
    getTotalTasks: (state) => state.total,
    getCompletedCount: (state) => state.tasks.filter((t) => t.status === 'completed').length,
    getPendingCount: (state) => state.tasks.filter((t) => t.status === 'pending').length,
  },

  actions: {
    setTasks(tasks: TaskDTO[]) {
      this.tasks = tasks;
    },

    addTask(task: TaskDTO) {
      this.tasks.push(task);
      this.total++;
    },

    updateTask(task: TaskDTO) {
      const idx = this.tasks.findIndex((t) => t.id === task.id);
      if (idx !== -1) this.tasks[idx] = task;
    },

    deleteTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.total--;
    },

    setCurrentTask(task: TaskDTO | null) {
      this.currentTask = task;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setCurrentPage(page: number) {
      this.currentPage = page;
    },

    setTotal(total: number) {
      this.total = total;
    },

    reset() {
      this.tasks = [];
      this.currentTask = null;
      this.isLoading = false;
      this.error = null;
      this.currentPage = 1;
      this.total = 0;
    },
  },

  persist: {
    paths: ['pageSize'],
  },
});
