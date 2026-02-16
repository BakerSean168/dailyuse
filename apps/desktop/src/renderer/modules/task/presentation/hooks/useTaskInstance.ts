/**
 * useTaskInstance Hook
 *
 * 任务实例管理 Hook
 * 
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useTaskStore 作为唯一数据源
 * - 返回 Entity 类型（TaskInstance）
 * - 移除内部 useState，统一使用 Store 状态
 * 
 * React/Zustand 模式修复:
 * - useCallback 依赖数组为空 []
 * - 在 callback 内部使用 useTaskStore.getState() 获取最新 actions
 */

import { useCallback } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '@dailyuse/task/application-client';
import type { TaskInstance } from '@dailyuse/task/domain-client';

// ===== Types =====

export interface UseTaskInstanceReturn {
  // State from Store
  instances: TaskInstance[];
  loading: boolean;
  error: string | null;
  
  // Query
  loadInstances: () => Promise<void>;
  getTodayInstances: () => TaskInstance[];
  getPendingInstances: () => TaskInstance[];
  getCompletedInstances: () => TaskInstance[];
  getInstancesByTemplate: (templateId: string) => TaskInstance[];
  getFilteredInstances: () => TaskInstance[];
  loadInstancesByDateRange: (templateId: string, startDate: Date, endDate: Date) => Promise<TaskInstance[]>;
  getInstance: (id: string) => Promise<TaskInstance | null>;
  
  // Actions
  startInstance: (id: string) => Promise<void>;
  completeInstance: (id: string) => Promise<void>;
  skipInstance: (id: string) => Promise<void>;
  deleteInstance: (id: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useTaskInstance(): UseTaskInstanceReturn {
  // ===== Store State (只订阅数据，不订阅 actions) =====
  const instances = useTaskStore((state) => state.instances);
  const loading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);

  // ===== Query =====

  const loadInstances = useCallback(async () => {
    const store = useTaskStore.getState();
    await store.fetchInstances();
  }, []);

  const loadInstancesByDateRange = useCallback(async (
    templateId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TaskInstance[]> => {
    return taskApplicationService.getInstancesByDateRange({
      templateId,
      from: startDate.getTime(),
      to: endDate.getTime(),
    });
  }, []);

  const getInstance = useCallback(async (id: string): Promise<TaskInstance | null> => {
    // 先从 Store 查找
    const store = useTaskStore.getState();
    const cached = store.getInstanceById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return taskApplicationService.getInstance(id);
  }, []);

  // ===== Filtered Selectors (从 store 获取) =====
  const getTodayInstances = useCallback(() => {
    return useTaskStore.getState().getTodayInstances();
  }, []);

  const getPendingInstances = useCallback(() => {
    return useTaskStore.getState().getPendingInstances();
  }, []);

  const getCompletedInstances = useCallback(() => {
    return useTaskStore.getState().getCompletedInstances();
  }, []);

  const getInstancesByTemplate = useCallback((templateId: string) => {
    return useTaskStore.getState().getInstancesByTemplate(templateId);
  }, []);

  const getFilteredInstances = useCallback(() => {
    return useTaskStore.getState().getFilteredInstances();
  }, []);

  // ===== Actions =====

  const startInstance = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    try {
      const instance = await taskApplicationService.startInstance(id);
      store.updateInstance(instance.id, instance);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '开始任务失败';
      store.setError(errorMessage);
      throw e;
    }
  }, []);

  const completeInstance = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    await store.completeInstance(id);
  }, []);

  const skipInstance = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    await store.skipInstance(id);
  }, []);

  const deleteInstance = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    try {
      await taskApplicationService.deleteInstance(id);
      store.removeInstance(id);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务实例失败';
      store.setError(errorMessage);
      throw e;
    }
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    useTaskStore.getState().setError(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadInstances();
  }, [loadInstances]);

  // ===== 注意: 移除 auto-load useEffect =====
  // 数据加载应该由使用此 hook 的组件显式调用 loadInstances()
  // 避免在 hook 内部自动触发加载导致的无限循环

  // ===== Return =====

  return {
    // State from Store
    instances,
    loading,
    error,
    // Query
    loadInstances,
    getTodayInstances,
    getPendingInstances,
    getCompletedInstances,
    getInstancesByTemplate,
    getFilteredInstances,
    loadInstancesByDateRange,
    getInstance,
    // Actions
    startInstance,
    completeInstance,
    skipInstance,
    deleteInstance,
    // Utilities
    clearError,
    refresh,
  };
}

export default useTaskInstance;
