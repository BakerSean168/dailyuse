/**
 * Residual 975: createComposableHandleError toast report path.
 */
import { inject } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/task-store';
import { TASK_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { CompleteTaskInstanceReq } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

type TaskInstanceDTO = ReturnType<typeof useTaskStore>['instances'][number];
type TaskInstanceEntityLike = { toDTO(): TaskInstanceDTO };

export function useTaskInstances() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useTaskStore();
  const { t } = useI18n();

  const handleError = createComposableHandleError({
    t,
    setError: (message) => store.setError(message),
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

  return {
    fetchInstances,
    fetchInstancesByDateRange,
    startInstance,
    completeInstance,
    skipInstance,
  };
}
