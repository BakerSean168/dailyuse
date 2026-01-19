/**
 * Goal Store - Pinia 状态管理
 *
 * 管理 Goal 模块的所有状态
 * - Vue 3 + Pinia（Web 应用专用）
 *
 * EPIC-018 重构:
 * - 框架无关的 Service 只返回数据
 * - Store 在 Composables 中被调用
 * - Composables 处理 Store 更新和 UI 状态
 *
 * @module goal/presentation/stores
 */

import { defineStore } from 'pinia';
import type {
  GoalDTO,
  KeyResultDTO,
  GoalFolderDTO,
  GoalReviewDTO,
  GoalRecordDTO,
} from '@dailyuse/contracts/goal';

// ============ State Interface ============
export interface GoalState {
  // 目标列表
  goals: GoalDTO[];

  // 当前选中的目标
  currentGoal: GoalDTO | null;

  // 关键结果列表
  keyResults: KeyResultDTO[];

  // 目标文件夹
  goalFolders: GoalFolderDTO[];

  // 目标评审
  goalReviews: GoalReviewDTO[];

  // 目标记录
  goalRecords: GoalRecordDTO[];

  // UI 状态
  isLoading: boolean;
  error: string | null;

  // 搜索和过滤
  searchQuery: string;
  filterStatus: string | null;

  // 分页
  currentPage: number;
  pageSize: number;
  total: number;
}

// ============ Store ============
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
    currentPage: 1,
    pageSize: 20,
    total: 0,
  }),

  getters: {
    // ========== 目标查询 ==========
    getGoalById: (state) => (id: string) => state.goals.find((g) => g.id === id),

    getGoalsByStatus: (state) => (status: string) => state.goals.filter((g) => g.status === status),

    getGoalsByFolder: (state) => (folderId: string) =>
      state.goals.filter((g) => g.folderId === folderId),

    // ========== 关键结果查询 ==========
    getKeyResultsByGoal: (state) => (goalId: string) =>
      state.keyResults.filter((kr) => kr.goalId === goalId),

    // ========== 统计 ==========
    getTotalGoals: (state) => state.goals.length,

    getCompletedGoalsCount: (state) => state.goals.filter((g) => g.status === 'completed').length,

    getActiveGoalsCount: (state) => state.goals.filter((g) => g.status === 'active').length,

    // ========== 分页 ==========
    getTotalPages: (state) => Math.ceil(state.total / state.pageSize),
  },

  actions: {
    // ========== Goal Actions ==========
    setGoals(goals: GoalDTO[]) {
      this.goals = goals;
    },

    addGoal(goal: GoalDTO) {
      this.goals.push(goal);
      this.total++;
    },

    updateGoal(goal: GoalDTO) {
      const index = this.goals.findIndex((g) => g.id === goal.id);
      if (index !== -1) {
        this.goals[index] = goal;
      }
    },

    deleteGoal(goalId: string) {
      this.goals = this.goals.filter((g) => g.id !== goalId);
      this.total--;
    },

    setCurrentGoal(goal: GoalDTO | null) {
      this.currentGoal = goal;
    },

    // ========== KeyResult Actions ==========
    setKeyResults(keyResults: KeyResultDTO[]) {
      this.keyResults = keyResults;
    },

    addKeyResult(kr: KeyResultDTO) {
      this.keyResults.push(kr);
    },

    updateKeyResult(kr: KeyResultDTO) {
      const index = this.keyResults.findIndex((k) => k.id === kr.id);
      if (index !== -1) {
        this.keyResults[index] = kr;
      }
    },

    deleteKeyResult(krId: string) {
      this.keyResults = this.keyResults.filter((k) => k.id !== krId);
    },

    // ========== Folder Actions ==========
    setGoalFolders(folders: GoalFolderDTO[]) {
      this.goalFolders = folders;
    },

    addGoalFolder(folder: GoalFolderDTO) {
      this.goalFolders.push(folder);
    },

    updateGoalFolder(folder: GoalFolderDTO) {
      const index = this.goalFolders.findIndex((f) => f.id === folder.id);
      if (index !== -1) {
        this.goalFolders[index] = folder;
      }
    },

    deleteGoalFolder(folderId: string) {
      this.goalFolders = this.goalFolders.filter((f) => f.id !== folderId);
    },

    // ========== Review Actions ==========
    setGoalReviews(reviews: GoalReviewDTO[]) {
      this.goalReviews = reviews;
    },

    addGoalReview(review: GoalReviewDTO) {
      this.goalReviews.push(review);
    },

    // ========== Record Actions ==========
    setGoalRecords(records: GoalRecordDTO[]) {
      this.goalRecords = records;
    },

    addGoalRecord(record: GoalRecordDTO) {
      this.goalRecords.push(record);
    },

    // ========== Search & Filter ==========
    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.currentPage = 1;
    },

    setFilterStatus(status: string | null) {
      this.filterStatus = status;
      this.currentPage = 1;
    },

    // ========== Pagination ==========
    setCurrentPage(page: number) {
      this.currentPage = page;
    },

    setPageSize(size: number) {
      this.pageSize = size;
      this.currentPage = 1;
    },

    setTotal(total: number) {
      this.total = total;
    },

    // ========== Status Actions ==========
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    // ========== Lifecycle ==========
    reset() {
      this.goals = [];
      this.currentGoal = null;
      this.keyResults = [];
      this.goalFolders = [];
      this.goalReviews = [];
      this.goalRecords = [];
      this.isLoading = false;
      this.error = null;
      this.searchQuery = '';
      this.filterStatus = null;
      this.currentPage = 1;
      this.total = 0;
    },
  },

  persist: {
    paths: ['filterStatus', 'pageSize'],
  },
});
