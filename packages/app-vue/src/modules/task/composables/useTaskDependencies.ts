import { inject } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/task-store';
import { TASK_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { DependencyType } from '@dailyuse/contracts/task';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

export function useTaskDependencies() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useTaskStore();
  const { t } = useI18n();

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

  return {
    createDependency,
    deleteDependency,
  };
}
