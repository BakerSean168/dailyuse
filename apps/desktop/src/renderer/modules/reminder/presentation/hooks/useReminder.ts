/**
 * useReminder Hook
 *
 * 提醒管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { reminderApplicationService } from '@dailyuse/reminder/application-client';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';

// Type aliases for backward compatibility
type CreateReminderTemplateInput = CreateReminderTemplateRequest;
type UpdateReminderTemplateInput = { id: string; request: UpdateReminderTemplateRequest };
type SearchTemplatesInput = { identityId: string; query: string };
type CreateReminderGroupInput = CreateReminderGroupRequest;
type UpdateReminderGroupInput = { id: string; request: UpdateReminderGroupRequest };

// ===== Types =====

export interface ReminderState {
  templates: ReminderTemplateClientDTO[];
  groups: ReminderGroupClientDTO[];
  selectedTemplate: ReminderTemplateClientDTO | null;
  selectedGroup: ReminderGroupClientDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseReminderReturn extends ReminderState {
  // Template Query
  loadTemplates: (identityId: string) => Promise<void>;
  getTemplate: (id: string) => Promise<ReminderTemplateClientDTO | null>;
  searchTemplates: (input: SearchTemplatesInput) => Promise<ReminderTemplateClientDTO[]>;

  // Template Mutations
  createTemplate: (input: CreateReminderTemplateInput) => Promise<ReminderTemplateClientDTO>;
  updateTemplate: (input: UpdateReminderTemplateInput) => Promise<ReminderTemplateClientDTO>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleTemplateEnabled: (id: string) => Promise<void>;

  // Group Query
  loadGroups: (identityId: string) => Promise<void>;
  getGroup: (id: string) => Promise<ReminderGroupClientDTO | null>;

  // Group Mutations
  createGroup: (input: CreateReminderGroupInput) => Promise<ReminderGroupClientDTO>;
  updateGroup: (input: UpdateReminderGroupInput) => Promise<ReminderGroupClientDTO>;
  deleteGroup: (id: string) => Promise<void>;

  // Selection
  selectTemplate: (template: ReminderTemplateClientDTO | null) => void;
  selectGroup: (group: ReminderGroupClientDTO | null) => void;

  // Utilities
  clearError: () => void;
  refresh: (identityId: string) => Promise<void>;
}

// ===== Hook Implementation =====

export function useReminder(): UseReminderReturn {
  const [state, setState] = useState<ReminderState>({
    templates: [],
    groups: [],
    selectedTemplate: null,
    selectedGroup: null,
    loading: false,
    error: null,
  });

  // ===== Template Query =====

  const loadTemplates = useCallback(async (identityId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const templates = await reminderApplicationService.getUserTemplates(identityId);
      setState((prev) => ({ ...prev, templates, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载提醒模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getTemplate = useCallback(async (id: string) => {
    return reminderApplicationService.getReminderTemplate(id);
  }, []);

  const searchTemplatesFn = useCallback(async (input: SearchTemplatesInput) => {
    return reminderApplicationService.searchTemplates(input.identityId, input.query);
  }, []);

  // ===== Template Mutations =====

  const createTemplate = useCallback(async (input: CreateReminderTemplateInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const template = await reminderApplicationService.createReminderTemplate(input);
      setState((prev) => ({
        ...prev,
        templates: [...prev.templates, template],
        loading: false,
      }));
      return template;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建提醒模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateTemplate = useCallback(async (input: UpdateReminderTemplateInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const template = await reminderApplicationService.updateReminderTemplate(
        input.id,
        input.request,
      );
      setState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === input.id ? template : t)),
        loading: false,
      }));
      return template;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新提醒模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await reminderApplicationService.deleteReminderTemplate(id);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.filter((t) => t.id !== id),
        selectedTemplate: prev.selectedTemplate?.id === id ? null : prev.selectedTemplate,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除提醒模板失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const toggleTemplateEnabled = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const updated = await reminderApplicationService.toggleTemplateEnabled(id);
      setState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === id ? updated : t)),
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '切换提醒状态失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Group Query =====

  const loadGroups = useCallback(async (identityId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const groups = await reminderApplicationService.getUserReminderGroups(identityId);
      setState((prev) => ({ ...prev, groups, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载提醒分组失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getGroup = useCallback(async (id: string) => {
    return reminderApplicationService.getReminderGroup(id);
  }, []);

  // ===== Group Mutations =====

  const createGroup = useCallback(async (input: CreateReminderGroupInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const group = await reminderApplicationService.createReminderGroup(input);
      setState((prev) => ({
        ...prev,
        groups: [...prev.groups, group],
        loading: false,
      }));
      return group;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建提醒分组失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateGroup = useCallback(async (input: UpdateReminderGroupInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const group = await reminderApplicationService.updateReminderGroup(input.id, input.request);
      setState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.id === input.id ? group : g)),
        loading: false,
      }));
      return group;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新提醒分组失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await reminderApplicationService.deleteReminderGroup(id);
      setState((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== id),
        selectedGroup: prev.selectedGroup?.id === id ? null : prev.selectedGroup,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除提醒分组失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Selection =====

  const selectTemplate = useCallback((template: ReminderTemplateClientDTO | null) => {
    setState((prev) => ({ ...prev, selectedTemplate: template }));
  }, []);

  const selectGroup = useCallback((group: ReminderGroupClientDTO | null) => {
    setState((prev) => ({ ...prev, selectedGroup: group }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(
    async (identityId: string) => {
      await Promise.all([loadTemplates(identityId), loadGroups(identityId)]);
    },
    [loadTemplates, loadGroups],
  );

  // Note: Auto-loading removed - call loadTemplates/loadGroups manually with identityId

  return {
    ...state,
    loadTemplates,
    getTemplate,
    searchTemplates: searchTemplatesFn,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateEnabled,
    loadGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    selectTemplate,
    selectGroup,
    clearError,
    refresh,
  };
}
