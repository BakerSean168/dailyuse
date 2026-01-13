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

import { useState, useCallback, useRef } from 'react';
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
  // ===== Store State (只订阅数据，不订阅 actions) =====
  const goals = useGoalStore((state) => state.goals);
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Local Selection State (不需要全局共享) =====
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // 使用 ref 保存 selectedGoal，避免在 useCallback 依赖中使用导致函数重建
  const selectedGoalRef = useRef<Goal | null>(null);
  selectedGoalRef.current = selectedGoal;

  // ===== Query =====
  // 所有 useCallback 使用空依赖，在函数内部调用 getState() 获取最新 store

  const loadGoals = useCallback(async () => {
    const store = useGoalStore.getState();
    await store.fetchGoals();
  }, []);

  const getGoal = useCallback(async (id: string): Promise<Goal | null> => {
    const store = useGoalStore.getState();
    // 先从 Store 查找
    const cached = store.getGoalById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return goalApplicationService.getGoal(id);
  }, []);

  const searchGoalsFn = useCallback(async (input: SearchGoalsInput) => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);
    
    try {
      const result = await goalApplicationService.searchGoals(input);
      store.setGoals(result.goals);
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '搜索目标失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  // ===== Mutations =====

  const createGoal = useCallback(async (input: CreateGoalRequest): Promise<Goal> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const goal = await goalApplicationService.createGoal(input);
      store.addGoal(goal);
      store.setLoading(false);
      return goal;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建目标失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  const updateGoal = useCallback(async (uuid: string, request: UpdateGoalRequest): Promise<void> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const goal = await goalApplicationService.updateGoal(uuid, request);
      store.updateGoal(uuid, goal);
      
      // 如果更新的是当前选中的目标，更新选择状态
      if (selectedGoalRef.current?.uuid === uuid) {
        setSelectedGoal(goal);
      }
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新目标失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []); // 空依赖，使用 ref 访问 selectedGoal

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      await goalApplicationService.deleteGoal(id);
      store.removeGoal(id);
      
      // 如果删除的是当前选中的目标，清除选择
      if (selectedGoalRef.current?.uuid === id) {
        setSelectedGoal(null);
      }
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除目标失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []); // 空依赖，使用 ref 访问 selectedGoal

  // ===== Status Changes =====

  const activateGoal = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    try {
      const goal = await goalApplicationService.activateGoal(id);
      store.updateGoal(id, goal);
      
      if (selectedGoalRef.current?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '激活目标失败');
      throw e;
    }
  }, []); // 空依赖

  const pauseGoal = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    try {
      const goal = await goalApplicationService.pauseGoal(id);
      store.updateGoal(id, goal);
      
      if (selectedGoalRef.current?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '暂停目标失败');
      throw e;
    }
  }, []); // 空依赖

  const completeGoal = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    try {
      const goal = await goalApplicationService.completeGoal(id);
      store.updateGoal(id, goal);
      
      if (selectedGoalRef.current?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '完成目标失败');
      throw e;
    }
  }, []); // 空依赖

  const archiveGoal = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    try {
      const goal = await goalApplicationService.archiveGoal(id);
      store.updateGoal(id, goal);
      
      if (selectedGoalRef.current?.uuid === id) {
        setSelectedGoal(goal);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '归档目标失败');
      throw e;
    }
  }, []); // 空依赖

  const cloneGoal = useCallback(async (input: CloneGoalInput): Promise<void> => {
    const store = useGoalStore.getState();
    try {
      const { goalUuid, ...options } = input;
      const goal = await goalApplicationService.cloneGoal(goalUuid, options);
      store.addGoal(goal);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : '克隆目标失败');
      throw e;
    }
  }, []);

  // ===== Selection =====

  const selectGoal = useCallback((goal: Goal | null) => {
    setSelectedGoal(goal);
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    useGoalStore.getState().setError(null);
  }, []);

  const refresh = useCallback(async () => {
    await useGoalStore.getState().fetchGoals();
  }, []); // 空依赖，不依赖 loadGoals

  // 不再自动加载 - 让组件自己决定何时加载
  // 数据通过 goalStore 共享，只需加载一次

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
