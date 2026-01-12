/**
 * useGoal Hook
 *
 * 目标管理 Hook
 * 
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useGoalStore 作为唯一数据源
 * - 返回 Entity 类型（Goal）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useState, useCallback, useEffect } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { goalApplicationService } from '../../application/services';
import type { Goal } from '@dailyuse/domain-client/goal';
import type { CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

/** Search goals input type */
type SearchGoalsInput = {
  keywords?: string;
  status?: string;
  dirUuid?: string;
  page?: number;
  limit?: number;
};

/** Clone goal input type */
type CloneGoalInput = {
  goalUuid: string;
  name?: string;
  description?: string;
  includeKeyResults?: boolean;
  includeRecords?: boolean;
};

// ===== Types =====

export interface UseGoalReturn {
  // State from Store
  goals: Goal[];
  selectedGoal: Goal | null;
  loading: boolean;
  error: string | null;

  // Query
  loadGoals: () => Promise<void>;
  getGoal: (id: string) => Promise<Goal | null>;
  searchGoals: (input: SearchGoalsInput) => Promise<void>;

  // Mutations
  createGoal: (input: CreateGoalRequest) => Promise<Goal>;
  updateGoal: (uuid: string, request: UpdateGoalRequest) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Status changes
  activateGoal: (id: string) => Promise<void>;
  pauseGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;
  cloneGoal: (input: CloneGoalInput) => Promise<void>;

  // Selection
  selectGoal: (goal: Goal | null) => void;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useGoal(): UseGoalReturn {
  // ===== Store State =====
  const goals = useGoalStore((state) => state.goals);
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Store Actions =====
  const storeSetGoals = useGoalStore((state) => state.setGoals);
  const storeAddGoal = useGoalStore((state) => state.addGoal);
  const storeUpdateGoal = useGoalStore((state) => state.updateGoal);
  const storeRemoveGoal = useGoalStore((state) => state.removeGoal);
  const storeFetchGoals = useGoalStore((state) => state.fetchGoals);
  const storeSetLoading = useGoalStore((state) => state.setLoading);
  const storeSetError = useGoalStore((state) => state.setError);

  // ===== Store Selectors =====
  const getGoalById = useGoalStore((state) => state.getGoalById);

  // ===== Local Selection State (不需要全局共享) =====
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // ===== Query =====

  const loadGoals = useCallback(async () => {
    await storeFetchGoals();
  }, [storeFetchGoals]);

  const getGoal = useCallback(async (id: string): Promise<Goal | null> => {
    // 先从 Store 查找
    const cached = getGoalById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return goalApplicationService.getGoal(id);
  }, [getGoalById]);

  const searchGoalsFn = useCallback(async (input: SearchGoalsInput) => {
    storeSetLoading(true);
    storeSetError(null);
    
    try {
      const result = await goalApplicationService.searchGoals(input);
      storeSetGoals(result.goals);
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '搜索目标失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeSetGoals, storeSetLoading, storeSetError]);

  // ===== Mutations =====

  const createGoal = useCallback(async (input: CreateGoalRequest): Promise<Goal> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const goal = await goalApplicationService.createGoal(input);
      storeAddGoal(goal);
      storeSetLoading(false);
      return goal;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建目标失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeAddGoal, storeSetLoading, storeSetError]);

  const updateGoal = useCallback(async (uuid: string, request: UpdateGoalRequest): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const goal = await goalApplicationService.updateGoal(uuid, request);
      storeUpdateGoal(uuid, goal);
      
      // 如果更新的是当前选中的目标，更新选择状态
      if (selectedGoal?.uuid === uuid) {
        setSelectedGoal(goal);
      }
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新目标失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeUpdateGoal, storeSetLoading, storeSetError, selectedGoal]);

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      await goalApplicationService.deleteGoal(id);
      storeRemoveGoal(id);
      
      // 如果删除的是当前选中的目标，清除选择
      if (selectedGoal?.uuid === id) {
        setSelectedGoal(null);
      }
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除目标失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeRemoveGoal, storeSetLoading, storeSetError, selectedGoal]);

  // ===== Status Changes =====

  const activateGoal = useCallback(async (id: string): Promise<void> => {
    try {
      const goal = await goalApplicationService.activateGoal(id);
      storeUpdateGoal(id, goal);
      
      if (selectedGoal?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      storeSetError(e instanceof Error ? e.message : '激活目标失败');
      throw e;
    }
  }, [storeUpdateGoal, storeSetError, selectedGoal]);

  const pauseGoal = useCallback(async (id: string): Promise<void> => {
    try {
      const goal = await goalApplicationService.pauseGoal(id);
      storeUpdateGoal(id, goal);
      
      if (selectedGoal?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      storeSetError(e instanceof Error ? e.message : '暂停目标失败');
      throw e;
    }
  }, [storeUpdateGoal, storeSetError, selectedGoal]);

  const completeGoal = useCallback(async (id: string): Promise<void> => {
    try {
      const goal = await goalApplicationService.completeGoal(id);
      storeUpdateGoal(id, goal);
      
      if (selectedGoal?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      storeSetError(e instanceof Error ? e.message : '完成目标失败');
      throw e;
    }
  }, [storeUpdateGoal, storeSetError, selectedGoal]);

  const archiveGoal = useCallback(async (id: string): Promise<void> => {
    try {
      const goal = await goalApplicationService.archiveGoal(id);
      storeUpdateGoal(id, goal);
      
      if (selectedGoal?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      storeSetError(e instanceof Error ? e.message : '归档目标失败');
      throw e;
    }
  }, [storeUpdateGoal, storeSetError, selectedGoal]);

  const cloneGoal = useCallback(async (input: CloneGoalInput): Promise<void> => {
    try {
      const { goalUuid, ...options } = input;
      const goal = await goalApplicationService.cloneGoal(goalUuid, options);
      storeAddGoal(goal);
    } catch (e) {
      storeSetError(e instanceof Error ? e.message : '克隆目标失败');
      throw e;
    }
  }, [storeAddGoal, storeSetError]);

  // ===== Selection =====

  const selectGoal = useCallback((goal: Goal | null) => {
    setSelectedGoal(goal);
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  const refresh = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  // ===== Effects =====

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // ===== Return =====

  return {
    // State from Store
    goals,
    selectedGoal,
    loading,
    error,
    // Query
    loadGoals,
    getGoal,
    searchGoals: searchGoalsFn,
    // Mutations
    createGoal,
    updateGoal,
    deleteGoal,
    // Status
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,
    cloneGoal,
    // Selection
    selectGoal,
    // Utilities
    clearError,
    refresh,
  };
}

export default useGoal;
