/**
 * Goal Store - Pinia 状态管理
 *
 * 纯状态容器 — API 调用由 composables 执行。
 *
 * @module goal/presentation/stores
 */

import { defineStore } from 'pinia';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalFolderClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
} from '@dailyuse/contracts/goal';
import type { GoalStatus } from '@dailyuse/contracts/goal';

export interface GoalState {
  goals: GoalClientDTO[];
  currentGoal: GoalClientDTO | null;
  keyResults: KeyResultClientDTO[];
  goalFolders: GoalFolderClientDTO[];
  goalReviews: GoalReviewClientDTO[];
  goalRecords: GoalRecordClientDTO[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: GoalStatus | null;
  pagination: { page: number; pageSize: number; total: number };
  isInitialized: boolean;
}

export const useGoalStore = defineStore('goal', {
  state: (): GoalState => ({
    goals: [],
    currentGoal: null,
    keyResults: [],
    goalFolders: [],
    goalReviews: [],
    goalRecords: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    filterStatus: null,
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  getters: {
    getGoalById: (state) => (id: string) => state.goals.find((g) => g.id === id),
    getGoalsByStatus: (state) => (status: GoalStatus) => state.goals.filter((g) => g.status === status),
    getGoalsByFolder: (state) => (folderId: string) => state.goals.filter((g) => g.folderId === folderId),
    activeGoalCount: (state): number => state.goals.filter((g) => g.status === 'Active').length,
    completedGoalCount: (state): number => state.goals.filter((g) => g.status === 'Completed').length,
    totalPages: (state): number => Math.ceil(state.pagination.total / state.pagination.pageSize),
    hasActiveFilter: (state): boolean => state.filterStatus !== null || state.searchQuery.length > 0,
  },

  actions: {
    setGoals(goals: GoalClientDTO[], total?: number) {
      this.goals = goals;
      if (total !== undefined) this.pagination.total = total;
    },
    addGoal(goal: GoalClientDTO) { this.goals.unshift(goal); this.pagination.total++; },
    updateGoal(goal: GoalClientDTO) {
      const i = this.goals.findIndex((g) => g.id === goal.id);
      if (i !== -1) this.goals[i] = goal;
      if (this.currentGoal?.id === goal.id) this.currentGoal = goal;
    },
    removeGoal(id: string) {
      this.goals = this.goals.filter((g) => g.id !== id);
      this.pagination.total--;
      if (this.currentGoal?.id === id) this.currentGoal = null;
    },
    setCurrentGoal(goal: GoalClientDTO | null) { this.currentGoal = goal; },

    setKeyResults(krs: KeyResultClientDTO[]) { this.keyResults = krs; },
    addKeyResult(kr: KeyResultClientDTO) { this.keyResults.push(kr); },
    updateKeyResult(kr: KeyResultClientDTO) {
      const i = this.keyResults.findIndex((k) => k.id === kr.id);
      if (i !== -1) this.keyResults[i] = kr;
    },
    removeKeyResult(id: string) { this.keyResults = this.keyResults.filter((k) => k.id !== id); },

    setGoalFolders(folders: GoalFolderClientDTO[]) { this.goalFolders = folders; },
    addGoalFolder(f: GoalFolderClientDTO) { this.goalFolders.push(f); },
    updateGoalFolder(f: GoalFolderClientDTO) {
      const i = this.goalFolders.findIndex((x) => x.id === f.id);
      if (i !== -1) this.goalFolders[i] = f;
    },
    removeGoalFolder(id: string) { this.goalFolders = this.goalFolders.filter((f) => f.id !== id); },

    setGoalReviews(r: GoalReviewClientDTO[]) { this.goalReviews = r; },
    addGoalReview(r: GoalReviewClientDTO) { this.goalReviews.push(r); },

    setGoalRecords(r: GoalRecordClientDTO[]) { this.goalRecords = r; },
    addGoalRecord(r: GoalRecordClientDTO) { this.goalRecords.push(r); },

    setSearchQuery(q: string) { this.searchQuery = q; this.pagination.page = 1; },
    setFilterStatus(s: GoalStatus | null) { this.filterStatus = s; this.pagination.page = 1; },
    clearFilters() { this.filterStatus = null; this.searchQuery = ''; this.pagination.page = 1; },

    setPage(p: number) { this.pagination.page = p; },
    setPageSize(s: number) { this.pagination.pageSize = s; this.pagination.page = 1; },

    setLoading(v: boolean) { this.isLoading = v; },
    setError(e: string | null) { this.error = e; },
    setInitialized(v: boolean) { this.isInitialized = v; },

    reset() { this.$reset(); },
  },

  persist: {
    pick: ['filterStatus', 'pagination'] as string[],
  },
});

export type GoalStoreType = ReturnType<typeof useGoalStore>;
