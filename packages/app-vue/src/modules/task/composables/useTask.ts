/**
 * useTask - 任务模块主 composable
 *
 * 通过 inject 获取 TaskClientService，所有方法返回 Result<T>。
 */

import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/task-store';
import { TASK_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  CompleteTaskInstanceReq,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  DependencyType,
} from '@dailyuse/contracts/task';
import type { GoalId, TaskFolderId, TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

type TaskTemplateListParams = {
  page?: number;
  limit?: number;
  status?: string[];
  goalId?: string;
  folderId?: string;
  tags?: string[];
};

type TaskTemplateDTO = ReturnType<typeof useTaskStore>['templates'][number];
type TaskInstanceDTO = ReturnType<typeof useTaskStore>['instances'][number];
type TaskTemplateEntityLike = { toDTO(): TaskTemplateDTO };
type TaskInstanceEntityLike = { toDTO(): TaskInstanceDTO };

export function useTask() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const store = useTaskStore();
  const { t } = useI18n();
  const savingId = ref<string | null>(null);
  const isSaving = computed(() => savingId.value !== null);

  const templates = computed(() => store.templates);
  const instances = computed(() => store.instances);
  const dependencies = computed(() => store.dependencies);
  const currentTemplate = computed(() => store.currentTemplate);
  const currentInstance = computed(() => store.currentInstance);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    toast.error(t('task.error.operationFailed'), { description: message });
  }

  async function executeTaskOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackKey: string,
  ): Promise<Result<T>> {
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'Task',
      t,
      fallbackKey,
      onError: (error) => {
        handleError(error, fallbackKey);
      },
    });
  }

  function buildTemplateListParams(
    query?: TaskTemplateListParams,
  ): Parameters<typeof service.listTemplates>[0] {
    const payload: NonNullable<Parameters<typeof service.listTemplates>[0]> = {
      page: query?.page ?? store.pagination.page,
      limit: query?.limit ?? store.pagination.pageSize,
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.goalId ? { goalId: query.goalId as GoalId } : {}),
      ...(query?.folderId ? { folderId: query.folderId as TaskFolderId } : {}),
      ...(query?.tags ? { tags: query.tags } : {}),
    };

    return sanitizeForIpc(payload) as Parameters<typeof service.listTemplates>[0];
  }

  // ========== Templates ==========
  async function fetchTemplates(query?: TaskTemplateListParams) {
    store.setLoading(true);
    store.setError(null);
    try {
      const payload = buildTemplateListParams(query);
      const result = await executeTaskOperation(
        () => service.listTemplates(payload),
        'task.error.loadTemplatesFailed',
      );

      if (result.ok) {
        store.setTemplates(
          (result.data.templates ?? []).map((template) =>
            (template as TaskTemplateEntityLike).toDTO(),
          ),
          result.data.total ?? 0,
        );
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchTaskGraph(query?: TaskTemplateListParams) {
    store.setLoading(true);
    store.setError(null);
    try {
      const payload = buildTemplateListParams(query);
      const result = await executeTaskOperation(
        () => service.getTaskGraph(payload),
        'task.error.loadTemplatesFailed',
      );

      if (result.ok) {
        store.setTemplates(
          (result.data.templates ?? []).map((template) =>
            (template as TaskTemplateEntityLike).toDTO(),
          ),
          result.data.total ?? 0,
        );
        store.setDependencies(result.data.dependencies ?? []);
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchTemplate(id: string) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeTaskOperation(() => service.getTemplate(id), 'task.error.loadTemplatesFailed');
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentTemplate(dto);
        return dto;
      }
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  async function createTemplate(req: CreateTaskTemplateReq) {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await executeTaskOperation(
        () => service.createTemplate(sanitizeForIpc(req)),
        'task.error.createFailed',
      );
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addTemplate(dto);
        toast.success(t('task.error.createSuccess'));
        return dto;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateTemplate(id: string, req: UpdateTaskTemplateReq) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeTaskOperation(
        () => service.updateTemplate(id, sanitizeForIpc(req)),
        'task.error.updateFailed',
      );
      if (result.ok) {
        const dto = result.data.toDTO();
        store.updateTemplate(dto);
        toast.success(t('task.error.updateSuccess'));
        return dto;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteTemplate(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeTaskOperation(() => service.deleteTemplate(id), 'task.error.deleteFailed');
      if (result.ok) {
        store.removeTemplate(id);
        toast.success(t('task.error.deleteSuccess'));
        return true;
      }
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function activateTemplate(id: string) {
    const result = await executeTaskOperation(
      () => service.activateTemplate(id),
      'task.error.activateFailed',
    );
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.activateSuccess'));
      return dto;
    }
    return null;
  }

  async function pauseTemplate(id: string) {
    const result = await executeTaskOperation(() => service.pauseTemplate(id), 'task.error.pauseFailed');
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.pauseSuccess'));
      return dto;
    }
    return null;
  }

  async function archiveTemplate(id: string) {
    const result = await executeTaskOperation(
      () => service.archiveTemplate(id),
      'task.error.archiveFailed',
    );
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateTemplate(dto);
      toast.success(t('task.error.archiveSuccess'));
      return dto;
    }
    return null;
  }

  async function createDependency(request: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType: DependencyType;
  }) {
    store.setError(null);
    const result = await executeTaskOperation(
      () =>
        service.createDependency(request.successorTaskId, {
          predecessorTaskId: request.predecessorTaskId as TaskTemplateId,
          successorTaskId: request.successorTaskId as TaskTemplateId,
          dependencyType: request.dependencyType,
        }),
      'task.error.operationFailed',
    );

    if (result.ok) {
      toast.success(t('common.success'));
      return result.data;
    }

    return null;
  }

  async function deleteDependency(id: string) {
    store.setError(null);
    const result = await executeTaskOperation(
      () => service.deleteDependency(id),
      'task.error.operationFailed',
    );

    if (result.ok) {
      toast.success(t('common.success'));
      return true;
    }

    return false;
  }

  // ========== Instances ==========
  async function fetchInstances(query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      const payload = sanitizeForIpc(query) as Parameters<typeof service.listInstances>[0];
      const result = await executeTaskOperation(
        () => service.listInstances(payload),
        'task.error.loadInstancesFailed',
      );

      if (result.ok) {
        store.setInstances(
          (result.data ?? []).map((instance) => (instance as TaskInstanceEntityLike).toDTO()),
        );
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchInstancesByDateRange(startDate: number, endDate: number) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeTaskOperation(
        () => service.listInstancesByDateRange(startDate, endDate),
        'task.error.loadInstancesFailed',
      );

      if (result.ok) {
        store.setInstances(
          (result.data ?? []).map((instance) => (instance as TaskInstanceEntityLike).toDTO()),
        );
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function startInstance(id: string) {
    const result = await executeTaskOperation(() => service.startInstance(id), 'task.error.startFailed');
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      return dto;
    }
    return null;
  }

  async function completeInstance(id: string, request?: CompleteTaskInstanceReq) {
    const result = await executeTaskOperation(
      () => service.completeInstance(id, sanitizeForIpc(request)),
      'task.error.completeFailed',
    );
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success(t('task.error.completeSuccess'));
      return dto;
    }
    return null;
  }

  async function skipInstance(id: string) {
    const result = await executeTaskOperation(() => service.skipInstance(id), 'task.error.skipFailed');
    if (result.ok) {
      const dto = result.data.toDTO();
      store.updateInstance(dto);
      toast.success(t('task.error.skipSuccess'));
      return dto;
    }
    return null;
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchTemplates();
  }

  return {
    templates,
    instances,
    dependencies,
    currentTemplate,
    currentInstance,
    isLoading,
    isSaving,
    error,
    pagination,
    fetchTemplates,
    fetchTaskGraph,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
    createDependency,
    deleteDependency,
    fetchInstances,
    fetchInstancesByDateRange,
    startInstance,
    completeInstance,
    skipInstance,
    setPage,
  };
}
