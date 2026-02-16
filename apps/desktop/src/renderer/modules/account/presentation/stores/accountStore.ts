/**
 * Account Store - Zustand 状态管理
 *
 * 管理 Account 模块的所有状态
 *
 * EPIC-018 重构:
 * - 移除 Container 依赖
 * - Store 仅管理状态
 * - 服务调用移至 useAccount Hook
 *
 * @module account/presentation/stores
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AccountClientDTO,
  SubscriptionClientDTO,
  AccountHistoryClientDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';
import {
  AccountStatus as AccountStatusEnum,
  SubscriptionPlan as SubscriptionPlanEnum,
} from '@dailyuse/contracts/account';

// 本地类型别名 - 使用 Client DTO
type AccountDTO = AccountClientDTO;
type SubscriptionDTO = SubscriptionClientDTO;
type AccountHistoryDTO = AccountHistoryClientDTO;
type AccountStatsDTO = AccountStatsResponseDTO;

// ============ State Interface ============
export interface AccountState {
  // 当前账户
  currentAccount: AccountDTO | null;
  
  // 订阅信息
  subscription: SubscriptionDTO | null;
  
  // 账户历史记录
  accountHistory: AccountHistoryDTO[];
  
  // 账户统计
  accountStats: AccountStatsDTO | null;
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // 已保存的账户列表（多账户支持）
  savedAccounts: AccountDTO[];
}

// ============ Actions Interface ============
export interface AccountActions {
  // 账户操作
  setCurrentAccount: (account: AccountDTO | null) => void;
  clearCurrentAccount: () => void;
  
  // 订阅操作
  setSubscription: (subscription: SubscriptionDTO | null) => void;
  
  // 历史记录操作
  setAccountHistory: (history: AccountHistoryDTO[]) => void;
  addHistoryRecord: (record: AccountHistoryDTO) => void;
  
  // 统计操作
  setAccountStats: (stats: AccountStatsDTO | null) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 多账户操作
  setSavedAccounts: (accounts: AccountDTO[]) => void;
  addSavedAccount: (account: AccountDTO) => void;
  removeSavedAccount: (identityId: string) => void;
  
  // 生命周期
  reset: () => void;
}

// ============ Selectors Interface ============
export interface AccountSelectors {
  // 认证状态
  isAuthenticated: () => boolean;
  getCurrentAccountId: () => string | null;
  
  // 账户状态
  getAccountStatus: () => string | null;
  isActiveAccount: () => boolean;
  isDeactivatedAccount: () => boolean;
  isSuspendedAccount: () => boolean;
  isDeletedAccount: () => boolean;
  
  // 验证状态
  isEmailVerified: () => boolean;
  isPhoneVerified: () => boolean;
  isTwoFactorEnabled: () => boolean;
  
  // 订阅状态
  getCurrentSubscriptionPlan: () => string;
  isPremiumUser: () => boolean;
  
  // 存储状态
  getStorageUsagePercentage: () => number;
  
  // 多账户
  getRememberedAccounts: () => AccountDTO[];
}

// ============ Initial State ============
const initialState: AccountState = {
  currentAccount: null,
  subscription: null,
  accountHistory: [],
  accountStats: null,
  isLoading: false,
  error: null,
  savedAccounts: [],
};

// ============ Store ============
export const useAccountStore = create<AccountState & AccountActions & AccountSelectors>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ========== Account Actions ==========
        setCurrentAccount: (account) => set((state) => {
          state.currentAccount = account;
        }),
        
        clearCurrentAccount: () => set((state) => {
          state.currentAccount = null;
          state.subscription = null;
          state.accountHistory = [];
        }),
        
        // ========== Subscription Actions ==========
        setSubscription: (subscription) => set({ subscription }),
        
        // ========== History Actions ==========
        setAccountHistory: (history) => set({ accountHistory: history }),
        
        addHistoryRecord: (record) => set((state) => {
          state.accountHistory.unshift(record);
        }),
        
        // ========== Stats Actions ==========
        setAccountStats: (stats) => set({ accountStats: stats }),
        
        // ========== Status Actions ==========
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        
        // ========== Multi-Account Actions ==========
        setSavedAccounts: (accounts) => set({ savedAccounts: accounts }),
        
        addSavedAccount: (account) => set((state) => {
          const exists = state.savedAccounts.find(acc => acc.id === account.id);
          if (!exists) {
            state.savedAccounts.push(account);
          }
        }),
        
        removeSavedAccount: (identityId) => set((state) => {
          state.savedAccounts = state.savedAccounts.filter(acc => acc.id !== identityId);
        }),
        
        reset: () => set(initialState),
        
        // ========== Selectors ==========
        isAuthenticated: () => get().currentAccount !== null,
        
        getCurrentAccountId: () => get().currentAccount?.id ?? null,
        
        getAccountStatus: () => get().currentAccount?.status ?? null,
        
        isActiveAccount: () => get().currentAccount?.status === AccountStatusEnum.ACTIVE,
        
        isDeactivatedAccount: () => get().currentAccount?.status === AccountStatusEnum.INACTIVE,
        
        isSuspendedAccount: () => get().currentAccount?.status === AccountStatusEnum.SUSPENDED,
        
        isDeletedAccount: () => get().currentAccount?.status === AccountStatusEnum.DELETED,
        
        isEmailVerified: () => get().currentAccount?.emailVerified ?? false,
        
        isPhoneVerified: () => get().currentAccount?.phoneVerified ?? false,
        
        isTwoFactorEnabled: () => get().currentAccount?.security?.twoFactorEnabled ?? false,
        
        getCurrentSubscriptionPlan: () => get().subscription?.plan ?? SubscriptionPlanEnum.FREE,
        
        isPremiumUser: () => {
          const plan = get().subscription?.plan;
          return plan === SubscriptionPlanEnum.PRO || plan === SubscriptionPlanEnum.ENTERPRISE;
        },
        
        getStorageUsagePercentage: () => {
          const storage = get().currentAccount?.storage;
          if (!storage) return 0;
          const { used, quota } = storage;
          if (quota <= 0) return 0;
          return Math.round((used / quota) * 100);
        },
        
        getRememberedAccounts: () => {
          return get().savedAccounts.filter((account: any) => account.remember);
        },
      }),
      {
        name: 'account-store',
        storage: createJSONStorage(() => localStorage),
        // 持久化账户偏好，不持久化敏感数据
        partialize: (state) => ({
          savedAccounts: state.savedAccounts,
        }),
      }
    )
  )
);
