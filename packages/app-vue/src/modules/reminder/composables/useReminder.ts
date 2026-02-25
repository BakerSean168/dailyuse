/**
 * useReminder - 提醒模块主 composable
 *
 * 编排 ReminderClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(REMINDER_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 */

import { computed, inject, ref } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import { REMINDER_SERVICE_KEY } from '../../../di/keys';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';

export function useReminder() {
  const service = inject(REMINDER_SERVICE_KEY);
  if (!service) throw new Error('REMINDER_SERVICE_KEY not provided');

  const store = useReminderStore();
  const savingId = ref<string | null>(null);

  const templates = computed(() => store.templates);
  const groups = computed(() => store.groups);
  const currentTemplate = computed(() => store.currentTemplate);
  const currentGroup = computed(() => store.currentGroup);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  // ── Templates ──

  async function fetchTemplates() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getReminderTemplates({
        page: store.pagination.page,
        limit: store.pagination.pageSize,
      });
      if (result.ok) {
        store.setTemplates(result.data.templates, result.data.total);
      } else {
        handleError(result.error.message || '加载提醒模板失败');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchTemplate(id: string): Promise<ReminderTemplateClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getReminderTemplate(id);
      if (result.ok) {
        store.setCurrentTemplate(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '加载提醒模板失败');
        return null;
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createTemplate(data: CreateReminderTemplateReq): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await service.createReminderTemplate(data);
      if (result.ok) {
        store.addTemplate(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '创建提醒失败');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function updateTemplate(id: string, data: UpdateReminderTemplateReq): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.updateReminderTemplate(id, data);
      if (result.ok) {
        store.updateTemplate(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '更新提醒失败');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteTemplate(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteReminderTemplate(id);
      if (result.ok) {
        store.removeTemplate(id);
        return true;
      } else {
        handleError(result.error.message || '删除提醒失败');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  // ── Groups ──

  async function fetchGroups() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getReminderGroups();
      if (result.ok) {
        store.setGroups(result.data.groups);
      } else {
        handleError(result.error.message || '加载提醒分组失败');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createGroup(data: CreateReminderGroupReq): Promise<ReminderGroupClientDTO | null> {
    savingId.value = 'new-group';
    store.setError(null);
    try {
      const result = await service.createReminderGroup(data);
      if (result.ok) {
        store.addGroup(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '创建分组失败');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function updateGroup(id: string, data: UpdateReminderGroupReq): Promise<ReminderGroupClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.updateReminderGroup(id, data);
      if (result.ok) {
        store.updateGroup(result.data);
        return result.data;
      } else {
        handleError(result.error.message || '更新分组失败');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteGroup(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteReminderGroup(id);
      if (result.ok) {
        store.removeGroup(id);
        return true;
      } else {
        handleError(result.error.message || '删除分组失败');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  function setPage(p: number) { store.setPage(p); fetchTemplates(); }

  return {
    templates, groups, currentTemplate, currentGroup,
    isLoading, isSaving, error, pagination,
    fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate,
    fetchGroups, createGroup, updateGroup, deleteGroup,
    setPage,
  };
}
