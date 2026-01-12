/**
 * useTaskTemplate Hook
 *
 * 任务模板管理 Hook
 * 
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useTaskStore 作为唯一数据源
 * - 返回 Entity 类型（TaskTemplate）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useCallback, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '../../application/services';
import type { TaskTemplate } from '@dailyuse/domain-client/task';
import type { UpdateTaskTemplateRequest, CreateTaskTemplateRequest } from '@dailyuse/contracts/task';

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
  updateTemplate: (uuid: string, request: UpdateTaskTemplateRequest) => Promise<void>;
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
  // ===== Store State =====
  const templates = useTaskStore((state) => state.templates);
  const loading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  
  // ===== Store Actions =====
  const storeSetTemplates = useTaskStore((state) => state.setTemplates);
  const storeAddTemplate = useTaskStore((state) => state.addTemplate);
  const storeUpdateTemplate = useTaskStore((state) => state.updateTemplate);
  const storeRemoveTemplate = useTaskStore((state) => state.removeTemplate);
  const storeFetchTemplates = useTaskStore((state) => state.fetchTemplates);
  const storeSetLoading = useTaskStore((state) => state.setLoading);
  const storeSetError = useTaskStore((state) => state.setError);
  
  // ===== Store Selectors =====
  const getActiveTemplates = useTaskStore((state) => state.getActiveTemplates);
  const getPausedTemplates = useTaskStore((state) => state.getPausedTemplates);
  const getArchivedTemplates = useTaskStore((state) => state.getArchivedTemplates);
  const getTemplateById = useTaskStore((state) => state.getTemplateById);

  // ===== Local Selection State (不需要全局共享) =====
  // 使用 Store 中的数据，但选择状态可以是本地的
  const [selectedTemplate, setSelectedTemplate] = React.useState<TaskTemplate | null>(null);

  // ===== Query =====

  const loadTemplates = useCallback(async () => {
    await storeFetchTemplates();
  }, [storeFetchTemplates]);

  const getTemplate = useCallback(async (id: string): Promise<TaskTemplate | null> => {
    // 先从 Store 查找
    const cached = getTemplateById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return taskApplicationService.getTemplate(id);
  }, [getTemplateById]);

  // ===== Mutations =====

  const createTemplate = useCallback(async (input: CreateTaskTemplateRequest): Promise<TaskTemplate> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const template = await taskApplicationService.createTemplate(input);
      storeAddTemplate(template);
      storeSetLoading(false);
      return template;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建任务模板失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeAddTemplate, storeSetLoading, storeSetError]);

  const updateTemplate = useCallback(async (uuid: string, request: UpdateTaskTemplateRequest): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      const template = await taskApplicationService.updateTemplate(uuid, request);
      storeUpdateTemplate(template.uuid, template);
      
      // 如果更新的是当前选中的模板，更新选择状态
      if (selectedTemplate?.uuid === uuid) {
        setSelectedTemplate(template);
      }
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新任务模板失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeUpdateTemplate, storeSetLoading, storeSetError, selectedTemplate]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    storeSetLoading(true);
    storeSetError(null);

    try {
      await taskApplicationService.deleteTemplate(id);
      storeRemoveTemplate(id);
      
      // 如果删除的是当前选中的模板，清除选择
      if (selectedTemplate?.uuid === id) {
        setSelectedTemplate(null);
      }
      storeSetLoading(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务模板失败';
      storeSetError(errorMessage);
      storeSetLoading(false);
      throw e;
    }
  }, [storeRemoveTemplate, storeSetLoading, storeSetError, selectedTemplate]);

  // ===== Status Changes =====

  const activateTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      await taskApplicationService.activateTemplate(id);
      // 重新加载所有模板以获取最新状态
      await storeFetchTemplates();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '激活任务失败';
      storeSetError(errorMessage);
      throw e;
    }
  }, [storeFetchTemplates, storeSetError]);

  const pauseTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      const template = await taskApplicationService.pauseTemplate(id);
      storeUpdateTemplate(template.uuid, template);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '暂停任务失败';
      storeSetError(errorMessage);
      throw e;
    }
  }, [storeUpdateTemplate, storeSetError]);

  const archiveTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      const template = await taskApplicationService.archiveTemplate(id);
      storeUpdateTemplate(template.uuid, template);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '归档任务失败';
      storeSetError(errorMessage);
      throw e;
    }
  }, [storeUpdateTemplate, storeSetError]);

  // ===== Selection =====

  const selectTemplate = useCallback((template: TaskTemplate | null) => {
    setSelectedTemplate(template);
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  const refresh = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  // ===== Effects =====

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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

// 需要导入 React
import React from 'react';

export default useTaskTemplate;
