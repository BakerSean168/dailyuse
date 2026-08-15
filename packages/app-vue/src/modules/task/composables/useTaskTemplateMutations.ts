/**
 * useTaskTemplateMutations — Task template server-state mutations (pilot authority, §3.4).
 *
 * - create / single delete / batch delete：**server-confirmed**（不伪造临时 id、不猜测多
 *   projection；batch 保持逐项、首错停止、已成功项不回滚的 API 语义）；
 * - update / activate / pause / archive：**optimistic pilot** —— cancel 受影响的 queries、
 *   snapshot 全部匹配 list/detail/graph entries、按 id patch；任一 failure exact restore
 *   快照；onSettled 一律经 dispatcher invalidate（组件不再手动 refresh）。
 *
 * 所有 service 调用继续走 `executeDesktopAuthenticatedResult`（Desktop auth recovery），
 * 网络失败经 runtime `networkMode: 'always'` + `retry:0` 立即进入 onError/rollback。
 */
import { computed, inject } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { unwrap, type Result } from '@memoflow/contracts/result';
import type {
  CreateTaskTemplateReq,
  TaskTemplateClientDTO,
  UpdateTaskTemplateReq,
} from '@memoflow/contracts/task';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { TASK_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import {
  useServerStateIdentityScope,
  useServerStateRuntime,
} from '../../../platform/server-state';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import {
  mergeTaskTemplateUpdate,
  patchTaskTemplateEverywhere,
  removeTaskTemplateFromCache,
  restoreTaskTemplateSnapshot,
  snapshotTaskTemplateCache,
} from './taskTemplateCache';
import { taskTemplateQueryKeys } from '../../../platform/server-state/query-keys';

/** Feedback intent for create (plan §2.2: preserve instanceCount/todayInstanceCreated feedback). */
export type CreateTemplateFeedbackIntent = 'plan' | 'quick';

/**
 * Create the Task template mutation set (create/update/delete/batch/activate/pause/archive).
 * 创建任务模板 mutation 集合。
 */
export function useTaskTemplateMutations() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const runtime = useServerStateRuntime();
  const resolveIdentityScope = useServerStateIdentityScope();
  const { t } = useI18n();

  const handleError = createComposableHandleError({
    t,
    setError: () => {},
    report: (message) => {
      toast.error(t('task.error.operationFailed'), { description: message });
    },
  });

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

  function createFeedbackKey(
    feedbackIntent: CreateTemplateFeedbackIntent,
    todayInstanceCreated: boolean,
  ): string {
    if (feedbackIntent === 'quick') {
      return todayInstanceCreated
        ? 'task.error.createQuickTaskWithTodayInstanceSuccess'
        : 'task.error.createQuickTaskWithoutTodayInstanceSuccess';
    }
    return todayInstanceCreated
      ? 'task.error.createTemplateWithTodayInstanceSuccess'
      : 'task.error.createTemplateWithoutTodayInstanceSuccess';
  }

  const createTemplate = useMutation({
    mutationFn: async ({
      req,
    }: {
      req: CreateTaskTemplateReq;
      feedbackIntent?: CreateTemplateFeedbackIntent;
    }) => {
      const result = await executeTaskOperation(
        () => service.createTemplate(sanitizeForIpc(req)),
        'task.error.createFailed',
      );
      return unwrap(result);
    },
    onSuccess: (data, { feedbackIntent }) => {
      toast.success(
        t(createFeedbackKey(feedbackIntent ?? 'plan', data.todayInstanceCreated), {
          count: data.instanceCount,
        }),
      );
    },
    onSettled: () => {
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, req }: { id: string; req: UpdateTaskTemplateReq }) => {
      const result = await executeTaskOperation(
        () => service.updateTemplate(id, sanitizeForIpc(req)),
        'task.error.updateFailed',
      );
      return unwrap(result);
    },
    onMutate: async ({ id, req }) => {
      const identityScope = resolveIdentityScope();
      await runtime.queryClient.cancelQueries({
        queryKey: ['server-state', 'task-template', identityScope],
      });
      const snapshot = snapshotTaskTemplateCache(runtime.queryClient, identityScope);
      const optimistic = mergeTaskTemplateUpdate(runtime.queryClient, identityScope, id, req);
      if (optimistic) {
        patchTaskTemplateEverywhere(runtime.queryClient, identityScope, optimistic);
      }
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      if (context?.snapshot) {
        restoreTaskTemplateSnapshot(runtime.queryClient, context.snapshot);
      }
    },
    onSuccess: (dto) => {
      patchTaskTemplateEverywhere(runtime.queryClient, resolveIdentityScope(), dto.toDTO());
      toast.success(t('task.error.updateSuccess'));
    },
    onSettled: (_data, _error, vars) => {
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
        entityId: vars.id,
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const result = await executeTaskOperation(
        () => service.deleteTemplate(id),
        'task.error.deleteFailed',
      );
      unwrap(result);
      return id;
    },
    onSuccess: (id) => {
      removeTaskTemplateFromCache(runtime.queryClient, resolveIdentityScope(), id);
      toast.success(t('task.error.deleteSuccess'));
    },
    onSettled: (_data, _error, id) => {
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
        entityId: id,
      });
    },
  });

  const deleteTemplates = useMutation({
    mutationFn: async (ids: readonly string[]) => {
      const identityScope = resolveIdentityScope();
      let deleted = 0;
      for (const id of ids) {
        const result = await executeTaskOperation(
          () => service.deleteTemplate(id),
          'task.error.deleteFailed',
        );
        unwrap(result); // first failure stops the batch (partial success preserved)
        removeTaskTemplateFromCache(runtime.queryClient, identityScope, id);
        deleted++;
      }
      return deleted;
    },
    onSettled: () => {
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
      });
    },
  });

  function createStatusMutation(
    operation: (id: string) => Promise<Result<{ toDTO(): TaskTemplateClientDTO }>>,
    fallbackKey: string,
    successKey: string,
    optimisticStatus: TaskTemplateClientDTO['status'],
  ) {
    return useMutation({
      mutationFn: async (id: string) => {
        const result = await executeTaskOperation(() => operation(id), fallbackKey);
        return unwrap(result);
      },
      onMutate: async (id) => {
        const identityScope = resolveIdentityScope();
        await runtime.queryClient.cancelQueries({
          queryKey: taskTemplateQueryKeys.identity(identityScope),
        });
        const snapshot = snapshotTaskTemplateCache(runtime.queryClient, identityScope);
        const cached = runtime.queryClient.getQueryData<TaskTemplateClientDTO>(
          taskTemplateQueryKeys.detail(identityScope, id),
        );
        const base = cached ?? ({ id, status: optimisticStatus } as TaskTemplateClientDTO);
        patchTaskTemplateEverywhere(runtime.queryClient, identityScope, {
          ...base,
          status: optimisticStatus,
          updatedAt: Date.now(),
        });
        return { snapshot };
      },
      onError: (_error, _id, context) => {
        if (context?.snapshot) {
          restoreTaskTemplateSnapshot(runtime.queryClient, context.snapshot);
        }
      },
      onSuccess: (dto) => {
        patchTaskTemplateEverywhere(runtime.queryClient, resolveIdentityScope(), dto.toDTO());
        toast.success(t(successKey));
      },
      onSettled: (_data, _error, id) => {
        void runtime.dispatcher.invalidate({
          target: 'task-template',
          identityScope: resolveIdentityScope(),
          source: 'mutation',
          entityId: id,
        });
      },
    });
  }

  const activateTemplate = createStatusMutation(
    (id) => service.activateTemplate(id),
    'task.error.activateFailed',
    'task.error.activateSuccess',
    'Active',
  );
  const pauseTemplate = createStatusMutation(
    (id) => service.pauseTemplate(id),
    'task.error.pauseFailed',
    'task.error.pauseSuccess',
    'Paused',
  );
  const archiveTemplate = createStatusMutation(
    (id) => service.archiveTemplate(id),
    'task.error.archiveFailed',
    'task.error.archiveSuccess',
    'Archived',
  );

  // 视图兼容的 safe wrappers：失败返回 null/false（错误已由 onError/toast 报告），成功返回结果。
  // View-compatible safe wrappers: null/false on failure, resolved data on success.
  async function createTemplateSafe(
    req: CreateTaskTemplateReq,
    feedbackIntent: CreateTemplateFeedbackIntent = 'plan',
  ) {
    try {
      return await createTemplate.mutateAsync({ req, feedbackIntent });
    } catch {
      return null;
    }
  }

  async function updateTemplateSafe(id: string, req: UpdateTaskTemplateReq) {
    try {
      return await updateTemplate.mutateAsync({ id, req });
    } catch {
      return null;
    }
  }

  async function deleteTemplateSafe(id: string): Promise<boolean> {
    try {
      await deleteTemplate.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }

  async function deleteTemplatesSafe(ids: readonly string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    try {
      await deleteTemplates.mutateAsync(ids);
      return true;
    } catch {
      return false;
    }
  }

  async function statusSafe(
    mutation: typeof activateTemplate,
    id: string,
  ) {
    try {
      return await mutation.mutateAsync(id);
    } catch {
      return null;
    }
  }

  return {
    // Raw mutations (optimistic lifecycle; used by tests / advanced callers).
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deleteTemplates,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
    // View-compatible safe wrappers.
    createTemplateSafe,
    updateTemplateSafe,
    deleteTemplateSafe,
    deleteTemplatesSafe,
    activateTemplateSafe: (id: string) => statusSafe(activateTemplate, id),
    pauseTemplateSafe: (id: string) => statusSafe(pauseTemplate, id),
    archiveTemplateSafe: (id: string) => statusSafe(archiveTemplate, id),
    isSaving: computed(
      () =>
        createTemplate.isPending.value ||
        updateTemplate.isPending.value ||
        deleteTemplate.isPending.value ||
        deleteTemplates.isPending.value ||
        activateTemplate.isPending.value ||
        pauseTemplate.isPending.value ||
        archiveTemplate.isPending.value,
    ),
  };
}
