/**
 * useTask - 任务模块主 composable
 *
 * 通过 inject 获取 TaskClientService，所有方法返回 Result<T>。
 */

import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/taskStore';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  CompleteTaskInstanceReq,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
} from '@dailyuse/contracts/task';
import type { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-client';
import {
  getDesktopAuthApi,
  recoverDesktopAuthIfNeeded,
} from '../../../shared/utils/desktopAuthRecovery';

type TaskTemplateListParams = {
  page?: number;
  limit?: number;
  status?: string;
  goalId?: string;
  tags?: string[];
};

export function useTask() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const store = useTaskStore();
  const { t } = useI18n();
  const savingId = ref<string | null>(null);

  const templates = computed(() => store.templates);
  const instances = computed(() => store.instances);
  const currentTemplate = computed(() => store.currentTemplate);
  const currentInstance = computed(() => store.currentInstance);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(message: string): void {
    store.setError(message);
    toast.error(t('task.error.operationFailed'), { description: message });
  }

  async function maybeRecoverAuth(error: { code?: string }): Promise<boolean> {
    return recoverDesktopAuthIfNeeded(error, getDesktopAuthApi(), 'Task');
  }

  // ========== Templates ==========
  async function fetchTemplates(query?: TaskTemplateListParams) {
    store.setLoading(true);
    store.setError(null);
    try {
      let result = await service.listTemplates(
        sanitizeForIpc({
          ...query,
          page: store.pagination.page,
          limit: store.pagination.pageSize,
        }),
      );

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.listTemplates(
          sanitizeForIpc({
            ...query,
            page: store.pagination.page,
            limit: store.pagination.pageSize,
          }),
        );
      }

      if (result.ok) {
        store.setTemplates(
          (result.data.templates ?? []).map((t: TaskTemplate) => t.toDTO()),
          result.data.total ?? 0,
        );
      } else {
        handleError(result.error.message || t('task.error.loadTemplatesFailed'));
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true);
    store.setError(null);
    try {
      let result = await service.getTemplate(id);
      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.getTemplate(id);
      }
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentTemplate(dto);
        return dto;
      }
      handleError(result.error.message || t('task.error.loadTemplatesFailed'));
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  async function createTemplate(req: CreateTaskTemplateReq) {
    savingId.value = 'new';
    store.setError(null);
    try {
      let result = await service.createTemplate(sanitizeForIpc(req));
      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.createTemplate(sanitizeForIpc(req));
      }
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addTemplate(dto);
        toast.success(t('task.error.createSuccess'));
        return dto;
      }
      handleError(result.error.message || t('task.error.createFailed'));
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateTemplate(id: string, req: UpdateTaskTemplateReq) {
    savingId.value = id;
    store.setError(null);
    try {
      let result = await service.updateTemplate(id, sanitizeForIpc(req));
      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.updateTemplate(id, sanitizeForIpc(req));
      }
      if (result.ok) {
        const dto = result.data.toDTO();
        store.updateTemplate(dto);
        toast.success(t('task.error.updateSuccess'));
        return dto;
      }
      handleError(result.error.message || t('task.error.updateFailed'));
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteTemplate(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      let result = await service.deleteTemplate(id);
      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.deleteTemplate(id);
      }
      if (result.ok) {
        store.removeTemplate(id);
        toast.success(t('task.error.deleteSuccess'));
        return true;
      }
      handleError(result.error.message || t('task.error.deleteFailed'));
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function activateTemplate(id: string) {
    let result = await service.activateTemplate(id);
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.activateTemplate(id);
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.activateSuccess'));
      return dto;
    }
    handleError(result.error.message || t('task.error.activateFailed'));
    return null;
  }

  async function pauseTemplate(id: string) {
    let result = await service.pauseTemplate(id);
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.pauseTemplate(id);
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.pauseSuccess'));
      return dto;
    }
    handleError(result.error.message || t('task.error.pauseFailed'));
    return null;
  }

  async function archiveTemplate(id: string) {
    let result = await service.archiveTemplate(id);
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.archiveTemplate(id);
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.archiveSuccess'));
      return dto;
    }
    handleError(result.error.message || t('task.error.archiveFailed'));
    return null;
  }

  // ========== Instances ==========
  async function fetchInstances(query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      let result = await service.listInstances(
        sanitizeForIpc(query) as Parameters<typeof service.listInstances>[0],
      );

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.listInstances(
          sanitizeForIpc(query) as Parameters<typeof service.listInstances>[0],
        );
      }

      if (result.ok) {
        store.setInstances((result.data ?? []).map((i: TaskInstance) => i.toDTO()));
      } else {
        handleError(result.error.message || t('task.error.loadInstancesFailed'));
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function startInstance(id: string) {
    let result = await service.startInstance(id);
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.startInstance(id);
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      return dto;
    }
    handleError(result.error.message || t('task.error.startFailed'));
    return null;
  }

  async function completeInstance(id: string, request?: CompleteTaskInstanceReq) {
    let result = await service.completeInstance(id, sanitizeForIpc(request));
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.completeInstance(id, sanitizeForIpc(request));
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success(t('task.error.completeSuccess'));
      return dto;
    }
    handleError(result.error.message || t('task.error.completeFailed'));
    return null;
  }

  async function skipInstance(id: string) {
    let result = await service.skipInstance(id);
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await service.skipInstance(id);
    }
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success(t('task.error.skipSuccess'));
      return dto;
    }
    handleError(result.error.message || t('task.error.skipFailed'));
    return null;
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchTemplates();
  }

  return {
    templates,
    instances,
    currentTemplate,
    currentInstance,
    isLoading,
    isSaving,
    error,
    pagination,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
    fetchInstances,
    startInstance,
    completeInstance,
    skipInstance,
    setPage,
  };
}
