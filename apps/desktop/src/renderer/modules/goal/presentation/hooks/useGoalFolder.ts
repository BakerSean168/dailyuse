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
  // ===== Store State =====
  const folders = useGoalStore((state) => state.folders);
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Store Actions =====
  const storeSetFolders = useGoalStore((state) => state.setFolders);
  const storeAddFolder = useGoalStore((state) => state.addFolder);
  const storeUpdateFolder = useGoalStore((state) => state.updateFolder);
  const storeRemoveFolder = useGoalStore((state) => state.removeFolder);
  const storeSetLoading = useGoalStore((state) => state.setLoading);
  const storeSetError = useGoalStore((state) => state.setError);

  // ===== Store Selectors =====
  const getFolderById = useGoalStore((state) => state.getFolderById);

  // ===== Query =====

  const loadFolders = useCallback(async () => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const result = await goalApplicationService.listFolders();
      storeSetFolders(result);
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载文件夹失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
    }
  }, [storeSetFolders, storeSetLoading, storeSetError]);

  const getFolder = useCallback(async (id: string): Promise<GoalFolder | null> => {
    // 先从 Store 查找
    const cached = getFolderById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return goalApplicationService.getFolder(id);
  }, [getFolderById]);

  // ===== Mutations =====

  const createFolder = useCallback(async (input: CreateGoalFolderRequest): Promise<GoalFolder> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const folder = await goalApplicationService.createFolder(input);
      storeAddFolder(folder);
      storeSetLoading(false);
      return folder;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建文件夹失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeAddFolder, storeSetLoading, storeSetError]);

  const updateFolder = useCallback(async (uuid: string, request: UpdateGoalFolderRequest): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const folder = await goalApplicationService.updateFolder(uuid, request);
      storeUpdateFolder(uuid, folder);
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新文件夹失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeUpdateFolder, storeSetLoading, storeSetError]);

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      await goalApplicationService.deleteFolder(id);
      storeRemoveFolder(id);
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除文件夹失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeRemoveFolder, storeSetLoading, storeSetError]);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  const refresh = useCallback(async () => {
    await loadFolders();
  }, [loadFolders]);

  // ===== Effects =====

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

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
