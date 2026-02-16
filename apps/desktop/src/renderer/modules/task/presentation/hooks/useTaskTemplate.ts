/**
 * useTaskTemplate Hook
 *
 * 任务模板管理 Hook
 *
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useTaskStore 作为唯一数据源
 * - 返回 Entity 类型（TaskTemplate）
 * - 移除内部 useState，统一使用 Store 状态
 *
 * React/Zustand 模式修复:
 * - useCallback 依赖数组为空 []
 * - 在 callback 内部使用 useTaskStore.getState() 获取最新 actions
 * - 使用 useRef 跟踪本地状态
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '@dailyuse/task/application-client';
import type { TaskTemplate } from '@dailyuse/task/domain-client';
import type {
  UpdateTaskTemplateRequest,
  CreateTaskTemplateRequest,
} from '@dailyuse/contracts/task';

// ===== Types =====

export interface UseTaskTemplateReturn {
  // State from Store
  templates: TaskTemplate[];
  selectedTemplate: TaskTemplate | null;
  loading: boolean;
  error: string | null;

  // Query
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<TaskTemplate | null>;

  // Mutations
  createTemplate: (input: CreateTaskTemplateRequest) => Promise<TaskTemplate>;
  updateTemplate: (id: string, request: UpdateTaskTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Status changes
  activateTemplate: (id: string) => Promise<void>;
  pauseTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;

  // Selection
  selectTemplate: (template: TaskTemplate | null) => void;

  // Filtered selectors
  getActiveTemplates: () => TaskTemplate[];
  getPausedTemplates: () => TaskTemplate[];
  getArchivedTemplates: () => TaskTemplate[];

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useTaskTemplate(): UseTaskTemplateReturn {
  // ===== Store State (只订阅数据，不订阅 actions) =====
  const templates = useTaskStore((state) => state.templates);
  const loading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);

  // ===== Local Selection State =====
  const [selectedTemplate, setSelectedTemplate] = React.useState<TaskTemplate | null>(null);

  // 使用 ref 跟踪 selectedTemplate，避免在 callback 中产生依赖
  const selectedTemplateRef = useRef<TaskTemplate | null>(null);

  // 使用 useEffect 安全地更新 ref
  React.useEffect(() => {
    selectedTemplateRef.current = selectedTemplate;
  }, [selectedTemplate]);

  // ===== Query =====

  const loadTemplates = useCallback(async () => {
    const store = useTaskStore.getState();
    await store.fetchTemplates();
  }, []);

  const getTemplate = useCallback(async (id: string): Promise<TaskTemplate | null> => {
    // 先从 Store 查找
    const store = useTaskStore.getState();
    const cached = store.getTemplateById(id);
    if (cached) return cached;

    // Store 中没有则从 API 获取
    return taskApplicationService.getTemplate(id);
  }, []);

  // ===== Mutations =====

  const createTemplate = useCallback(
    async (input: CreateTaskTemplateRequest): Promise<TaskTemplate> => {
      const store = useTaskStore.getState();
      store.setLoading(true);
      store.setError(null);

      try {
        const template = await taskApplicationService.createTemplate(input);
        store.addTemplate(template);
        store.setLoading(false);
        return template;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '创建任务模板失败';
        store.setError(errorMessage);
        store.setLoading(false);
        throw e;
      }
    },
    [],
  );

  const updateTemplate = useCallback(
    async (id: string, request: UpdateTaskTemplateRequest): Promise<void> => {
      const store = useTaskStore.getState();
      store.setLoading(true);
      store.setError(null);

      try {
        const template = await taskApplicationService.updateTemplate(id, request);
        store.updateTemplate(template.id, template);

        // 如果更新的是当前选中的模板，更新选择状态
        if (selectedTemplateRef.current?.id === id) {
          setSelectedTemplate(template);
        }
        store.setLoading(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新任务模板失败';
        store.setError(errorMessage);
        store.setLoading(false);
        throw e;
      }
    },
    [],
  );

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      await taskApplicationService.deleteTemplate(id);
      store.removeTemplate(id);

      // 如果删除的是当前选中的模板，清除选择
      if (selectedTemplateRef.current?.id === id) {
        setSelectedTemplate(null);
      }
      store.setLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务模板失败';
      store.setError(errorMessage);
      store.setLoading(false);
      throw e;
    }
  }, []);

  // ===== Status Changes =====

  const activateTemplate = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    try {
      await taskApplicationService.activateTemplate(id);
      // 重新加载所有模板以获取最新状态
      await store.fetchTemplates();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '激活任务失败';
      store.setError(errorMessage);
      throw e;
    }
  }, []);

  const pauseTemplate = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    try {
      const template = await taskApplicationService.pauseTemplate(id);
      store.updateTemplate(template.id, template);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '暂停任务失败';
      store.setError(errorMessage);
      throw e;
    }
  }, []);

  const archiveTemplate = useCallback(async (id: string): Promise<void> => {
    const store = useTaskStore.getState();
    try {
      const template = await taskApplicationService.archiveTemplate(id);
      store.updateTemplate(template.id, template);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '归档任务失败';
      store.setError(errorMessage);
      throw e;
    }
  }, []);

  // ===== Selection =====

  const selectTemplate = useCallback((template: TaskTemplate | null) => {
    setSelectedTemplate(template);
  }, []);

  // ===== Filtered Selectors (从 store 获取) =====
  const getActiveTemplates = useCallback(() => {
    return useTaskStore.getState().getActiveTemplates();
  }, []);

  const getPausedTemplates = useCallback(() => {
    return useTaskStore.getState().getPausedTemplates();
  }, []);

  const getArchivedTemplates = useCallback(() => {
    return useTaskStore.getState().getArchivedTemplates();
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    useTaskStore.getState().setError(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  // ===== 注意: 移除 auto-load useEffect =====
  // 数据加载应该由使用此 hook 的组件显式调用 loadTemplates()
  // 避免在 hook 内部自动触发加载导致的无限循环

  // ===== Return =====

  return {
    // State from Store
    templates,
    selectedTemplate,
    loading,
    error,
    // Query
    loadTemplates,
    getTemplate,
    // Mutations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Status
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
    // Selection
    selectTemplate,
    // Filtered selectors
    getActiveTemplates,
    getPausedTemplates,
    getArchivedTemplates,
    // Utilities
    clearError,
    refresh,
  };
}

export default useTaskTemplate;
