/**
 * Residual 975: createComposableHandleError toast report path.
 */
import { inject } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '../stores/task-store';
import { TASK_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type { DependencyType } from '@memoflow/contracts/task';
import type { TaskTemplateId } from '@memoflow/contracts/primitives';
import type { Result } from '@memoflow/contracts/result';
import { createComposableHandleError } from '../../../shared/utils/create-composable-handle-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';
import { useServerStateIdentityScope, useServerStateRuntime } from '../../../platform/server-state';

export function useTaskDependencies() {
  const service = useStrictInject(TASK_SERVICE_KEY, 'TaskService');
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useTaskStore();
  const runtime = useServerStateRuntime();
  const resolveIdentityScope = useServerStateIdentityScope();
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
      // dependency 变更只影响 graph projection；经 dispatcher 失效 graph key（Step 4）。
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
        projection: 'graphs',
      });
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
      void runtime.dispatcher.invalidate({
        target: 'task-template',
        identityScope: resolveIdentityScope(),
        source: 'mutation',
        projection: 'graphs',
      });
      return true;
    }

    return false;
  }

  return {
    createDependency,
    deleteDependency,
  };
}
