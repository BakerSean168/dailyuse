/**
 * useGoalFolder Hook
 *
 * 目标文件夹管理 Hook
 * 
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useGoalStore 作为唯一数据源
 * - 返回 Entity 类型（GoalFolder）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useCallback, useEffect } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { goalApplicationService } from '../../application/services';
import type { GoalFolder } from '@dailyuse/domain-client/goal';
import type { CreateGoalFolderRequest, UpdateGoalFolderRequest } from '@dailyuse/contracts/goal';

// ===== Types =====

export interface UseGoalFolderReturn {
  // State from Store
  folders: GoalFolder[];
  loading: boolean;
  error: string | null;

  // Query
  loadFolders: () => Promise<void>;
  getFolder: (id: string) => Promise<GoalFolder | null>;

  // Mutations
  createFolder: (input: CreateGoalFolderRequest) => Promise<GoalFolder>;
  updateFolder: (uuid: string, request: UpdateGoalFolderRequest) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useGoalFolder(): UseGoalFolderReturn {
  // ===== Store State (只订阅数据，不订阅 actions) =====
  const folders = useGoalStore((state) => state.folders);
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Query =====
  // 所有 useCallback 使用空依赖，在函数内部调用 getState() 获取最新 store

  const loadFolders = useCallback(async () => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const result = await goalApplicationService.listFolders();
      store.setFolders(result);
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载文件夹失败';
      store.setError(errorMessage);
      store.setLoading(false);
    }
  }, []); // 空依赖，函数内部获取 store

  const getFolder = useCallback(async (id: string): Promise<GoalFolder | null> => {
    const store = useGoalStore.getState();
    // 先从 Store 查找
    const cached = store.getFolderById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return goalApplicationService.getFolder(id);
  }, []); // 空依赖

  // ===== Mutations =====

  const createFolder = useCallback(async (input: CreateGoalFolderRequest): Promise<GoalFolder> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const folder = await goalApplicationService.createFolder(input);
      store.addFolder(folder);
      store.setLoading(false);
      return folder;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建文件夹失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  const updateFolder = useCallback(async (uuid: string, request: UpdateGoalFolderRequest): Promise<void> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const folder = await goalApplicationService.updateFolder(uuid, request);
      store.updateFolder(uuid, folder);
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新文件夹失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      await goalApplicationService.deleteFolder(id);
      store.removeFolder(id);
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除文件夹失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    useGoalStore.getState().setError(null);
  }, []);

  const refresh = useCallback(async () => {
    const store = useGoalStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const result = await goalApplicationService.listFolders();
      store.setFolders(result);
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载文件夹失败';
      store.setError(errorMessage);
      store.setLoading(false);
    }
  }, []); // 空依赖，不依赖 loadFolders

  // 不再自动加载 - 让组件自己决定何时加载
  // 数据通过 goalStore 共享，只需加载一次

  // ===== Return =====

  return {
    // State from Store
    folders,
    loading,
    error,
    // Query
    loadFolders,
    getFolder,
    // Mutations
    createFolder,
    updateFolder,
    deleteFolder,
    // Utilities
    clearError,
    refresh,
  };
}

export default useGoalFolder;
