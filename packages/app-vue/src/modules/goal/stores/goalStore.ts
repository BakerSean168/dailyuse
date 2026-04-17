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
  GoalSystemView,
  GoalStatus,
  KeyResultClientDTO,
  GoalFolderClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
  FocusModeClientDTO,
} from '@dailyuse/contracts/goal';

export interface GoalState {
  goals: GoalClientDTO[];
  currentGoal: GoalClientDTO | null;
  keyResults: KeyResultClientDTO[];
  goalFolders: GoalFolderClientDTO[];
  goalReviews: GoalReviewClientDTO[];
  goalRecords: GoalRecordClientDTO[];
  selectedFolderId: string | null;
  currentFocusMode: FocusModeClientDTO | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  systemView: GoalSystemView;
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
    selectedFolderId: null,
    currentFocusMode: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    systemView: 'active',
    pagination: { page: 1, pageSize: 20, total: 0 },
    isInitialized: false,
  }),

  getters: {
    getGoalById: (state) => (id: string) => state.goals.find((g) => g.id === id),
    getGoalsByStatus: (state) => (status: GoalStatus) =>
      state.goals.filter((g) => g.status === status),
    getGoalsByFolder: (state) => (folderId: string) =>
      state.goals.filter((g) => g.folderId === folderId),
    activeGoalCount: (state): number =>
      state.goals.filter((g) => !g.archivedAt && !g.deletedAt).length,
    completedGoalCount: (state): number =>
      state.goals.filter((g) => !!g.archivedAt && !!g.completedAt && !g.deletedAt).length,
    totalPages: (state): number => Math.ceil(state.pagination.total / state.pagination.pageSize),
    hasActiveFilter: (state): boolean => state.searchQuery.length > 0,
  },

  actions: {
    setGoals(goals: GoalClientDTO[], total?: number) {
      this.goals = goals;
      if (total !== undefined) this.pagination.total = total;
    },
    addGoal(goal: GoalClientDTO) {
      this.goals.unshift(goal);
      this.pagination.total++;
    },
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
    setCurrentGoal(goal: GoalClientDTO | null) {
      this.currentGoal = goal;
    },

    setKeyResults(krs: KeyResultClientDTO[]) {
      this.keyResults = krs;
      if (this.currentGoal) {
        this.currentGoal = { ...this.currentGoal, keyResults: [...krs] };
      }
    },
    addKeyResult(kr: KeyResultClientDTO) {
      this.keyResults.push(kr);
      if (this.currentGoal) {
        this.currentGoal = {
          ...this.currentGoal,
          keyResults: [...(this.currentGoal.keyResults ?? []), kr],
        };
      }
    },
    updateKeyResult(kr: KeyResultClientDTO) {
      const i = this.keyResults.findIndex((k) => k.id === kr.id);
      if (i !== -1) this.keyResults[i] = kr;
      if (this.currentGoal?.keyResults) {
        this.currentGoal = {
          ...this.currentGoal,
          keyResults: this.currentGoal.keyResults.map((item) => (item.id === kr.id ? kr : item)),
        };
      }
    },
    removeKeyResult(id: string) {
      this.keyResults = this.keyResults.filter((k) => k.id !== id);
      if (this.currentGoal?.keyResults) {
        this.currentGoal = {
          ...this.currentGoal,
          keyResults: this.currentGoal.keyResults.filter((item) => item.id !== id),
        };
      }
    },

    setGoalFolders(folders: GoalFolderClientDTO[]) {
      this.goalFolders = folders;
    },
    addGoalFolder(f: GoalFolderClientDTO) {
      this.goalFolders.push(f);
    },
    updateGoalFolder(f: GoalFolderClientDTO) {
      const i = this.goalFolders.findIndex((x) => x.id === f.id);
      if (i !== -1) this.goalFolders[i] = f;
    },
    removeGoalFolder(id: string) {
      this.goalFolders = this.goalFolders.filter((f) => f.id !== id);
    },

    setGoalReviews(r: GoalReviewClientDTO[]) {
      this.goalReviews = r;
      if (this.currentGoal) {
        this.currentGoal = { ...this.currentGoal, reviews: [...r] };
      }
    },
    addGoalReview(r: GoalReviewClientDTO) {
      this.goalReviews.push(r);
      if (this.currentGoal) {
        this.currentGoal = {
          ...this.currentGoal,
          reviews: [...(this.currentGoal.reviews ?? []), r],
        };
      }
    },

    setGoalRecords(r: GoalRecordClientDTO[]) {
      this.goalRecords = r;
    },
    addGoalRecord(r: GoalRecordClientDTO) {
      this.goalRecords.push(r);
    },

    setSelectedFolderId(id: string | null) {
      this.selectedFolderId = id;
    },

    setCurrentFocusMode(mode: FocusModeClientDTO | null) {
      this.currentFocusMode = mode;
    },

    setSearchQuery(q: string) {
      this.searchQuery = q;
      this.pagination.page = 1;
    },
    setSystemView(v: GoalSystemView) {
      this.systemView = v;
      this.pagination.page = 1;
    },
    clearFilters() {
      this.searchQuery = '';
      this.pagination.page = 1;
    },

    setPage(p: number) {
      this.pagination.page = p;
    },
    setPageSize(s: number) {
      this.pagination.pageSize = s;
      this.pagination.page = 1;
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
    pick: ['systemView', 'pagination'] as string[],
  },
});

export type GoalStoreType = ReturnType<typeof useGoalStore>;
