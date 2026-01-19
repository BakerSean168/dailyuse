/**
 * Account Store - Pinia 状态管理
 *
 * 管理 Account 模块的所有状态
 * - Vue 3 + Pinia（Web 应用专用）
 * - 对应 desktop 应用的 Zustand store
 *
 * EPIC-018 重构:
 * - 框架无关的 Service 只返回数据
 * - Store 在 Composables 中被调用
 * - Composables 处理 Store 更新和 UI 状态
 *
 * @module account/presentation/stores
 */

import { defineStore } from 'pinia';
import type {
  AccountDTO,
  SubscriptionDTO,
  AccountHistoryDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';
import {
  AccountStatus as AccountStatusEnum,
  SubscriptionPlan as SubscriptionPlanEnum,
} from '@dailyuse/contracts/account';

// ============ State Interface ============
export interface AccountState {
  // 当前账户
  currentAccount: AccountDTO | null;

  // 订阅信息
  subscription: SubscriptionDTO | null;

  // 账户历史记录
  accountHistory: AccountHistoryDTO[];

  // 账户统计
  accountStats: AccountStatsResponseDTO | null;

  // UI 状态
  isLoading: boolean;
  error: string | null;

  // 已保存的账户列表（多账户支持）
  savedAccounts: AccountDTO[];
}

// ============ Store ============
export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    currentAccount: null,
    subscription: null,
    accountHistory: [],
    accountStats: null,
    isLoading: false,
    error: null,
    savedAccounts: [],
  }),

  getters: {
    // ========== 认证状态 ==========
    isAuthenticated: (state) => state.currentAccount !== null,

    getCurrentAccountUuid: (state) => state.currentAccount?.uuid ?? null,

    // ========== 账户状态 ==========
    getAccountStatus: (state) => state.currentAccount?.status ?? null,

    isActiveAccount: (state) => state.currentAccount?.status === AccountStatusEnum.ACTIVE,

    isDeactivatedAccount: (state) => state.currentAccount?.status === AccountStatusEnum.INACTIVE,

    isSuspendedAccount: (state) => state.currentAccount?.status === AccountStatusEnum.SUSPENDED,

    isDeletedAccount: (state) => state.currentAccount?.status === AccountStatusEnum.DELETED,

    // ========== 验证状态 ==========
    isEmailVerified: (state) => state.currentAccount?.emailVerified ?? false,

    isPhoneVerified: (state) => state.currentAccount?.phoneVerified ?? false,

    isTwoFactorEnabled: (state) => state.currentAccount?.security?.twoFactorEnabled ?? false,

    // ========== 订阅状态 ==========
    getCurrentSubscriptionPlan: (state) => state.subscription?.plan ?? SubscriptionPlanEnum.FREE,

    isPremiumUser: (state) => {
      const plan = state.subscription?.plan;
      return plan === SubscriptionPlanEnum.PRO || plan === SubscriptionPlanEnum.ENTERPRISE;
    },

    // ========== 存储状态 ==========
    getStorageUsagePercentage: (state) => {
      const storage = state.currentAccount?.storage;
      if (!storage) return 0;
      const { used, quota } = storage;
      if (quota <= 0) return 0;
      return Math.round((used / quota) * 100);
    },

    // ========== 多账户 ==========
    getRememberedAccounts: (state) => {
      return state.savedAccounts.filter((account: any) => account.remember);
    },
  },

  actions: {
    // ========== Account Actions ==========
    setCurrentAccount(account: AccountDTO | null) {
      this.currentAccount = account;
    },

    clearCurrentAccount() {
      this.currentAccount = null;
      this.subscription = null;
      this.accountHistory = [];
    },

    // ========== Subscription Actions ==========
    setSubscription(subscription: SubscriptionDTO | null) {
      this.subscription = subscription;
    },

    // ========== History Actions ==========
    setAccountHistory(history: AccountHistoryDTO[]) {
      this.accountHistory = history;
    },

    addHistoryRecord(record: AccountHistoryDTO) {
      this.accountHistory.unshift(record);
    },

    // ========== Stats Actions ==========
    setAccountStats(stats: AccountStatsResponseDTO | null) {
      this.accountStats = stats;
    },

    // ========== Status Actions ==========
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    // ========== Multi-Account Actions ==========
    setSavedAccounts(accounts: AccountDTO[]) {
      this.savedAccounts = accounts;
    },

    addSavedAccount(account: AccountDTO) {
      const exists = this.savedAccounts.find((acc) => acc.uuid === account.uuid);
      if (!exists) {
        this.savedAccounts.push(account);
      }
    },

    removeSavedAccount(accountUuid: string) {
      this.savedAccounts = this.savedAccounts.filter((acc) => acc.uuid !== accountUuid);
    },

    // ========== Lifecycle ==========
    reset() {
      this.currentAccount = null;
      this.subscription = null;
      this.accountHistory = [];
      this.accountStats = null;
      this.isLoading = false;
      this.error = null;
      this.savedAccounts = [];
    },
  },

  persist: {
    // 持久化账户偏好，不持久化敏感数据
    paths: ['savedAccounts'],
  },
});
