import { computed, inject, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/task-store';
import { TASK_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { CreateTaskTemplateReq, UpdateTaskTemplateReq } from '@dailyuse/contracts/task';
import type { GoalId, TaskFolderId } from '@dailyuse/contracts/primitives';
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
type TaskTemplateEntityLike = { toDTO(): TaskTemplateDTO };

export function useTaskTemplates() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useTaskStore();
  const { t } = useI18n();
  const savingId = ref<string | null>(null);
  const isSaving = computed(() => savingId.value !== null);

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
      desktopApi,
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
        const dto = result.data.template.toDTO();
        store.addTemplate(dto);
        toast.success(
          t(
            result.data.todayInstanceCreated
              ? 'task.error.createTemplateWithTodayInstanceSuccess'
              : 'task.error.createTemplateWithoutTodayInstanceSuccess',
            { count: result.data.instanceCount },
          ),
        );
        return {
          template: dto,
          instanceCount: result.data.instanceCount,
          todayInstanceCreated: result.data.todayInstanceCreated,
        };
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

  return {
    isSaving,
    fetchTemplates,
    fetchTaskGraph,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
  };
}
