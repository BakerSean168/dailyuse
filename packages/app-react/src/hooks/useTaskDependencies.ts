import { useCallback, useEffect, useState } from 'react';

import type { DependencyChainClientDTO } from '@memoflow/contracts/task';
import { presentErrorMessage } from '@memoflow/http-client';

import { useAppSession } from './useAppSession';
import { useTaskService } from './useTaskService';

export interface TaskDependencyInfo {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  predecessorTaskTitle?: string;
  successorTaskTitle?: string;
  dependencyType: string;
  lagDays?: number;
}

export function useTaskDependencies(taskId: string | null) {
  const service = useTaskService();
  const { isRemoteAuthenticated } = useAppSession();

  const [dependencies, setDependencies] = useState<TaskDependencyInfo[]>([]);
  const [dependents, setDependents] = useState<TaskDependencyInfo[]>([]);
  const [chain, setChain] = useState<DependencyChainClientDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDependencies = useCallback(async () => {
    if (!taskId || !isRemoteAuthenticated) {
      setDependencies([]);
      setDependents([]);
      setChain(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const [depsResult, dependentsResult, chainResult] = await Promise.all([
      service.getDependencies(taskId),
      service.getDependents(taskId),
      service.getDependencyChain(taskId),
    ]);

    if (!depsResult.ok) {
      setError(presentErrorMessage(depsResult.error));
      setIsLoading(false);
      return;
    }

    setDependencies(
      depsResult.data.map((d) => ({
        id: d.id,
        predecessorTaskId: d.predecessorTaskId,
        successorTaskId: d.successorTaskId,
        predecessorTaskTitle: d.predecessorTaskTitle,
        successorTaskTitle: d.successorTaskTitle,
        dependencyType: d.dependencyType,
        lagDays: d.lagDays,
      })),
    );

    if (dependentsResult.ok) {
      setDependents(
        dependentsResult.data.map((d) => ({
          id: d.id,
          predecessorTaskId: d.predecessorTaskId,
          successorTaskId: d.successorTaskId,
          predecessorTaskTitle: d.predecessorTaskTitle,
          successorTaskTitle: d.successorTaskTitle,
          dependencyType: d.dependencyType,
          lagDays: d.lagDays,
        })),
      );
    }

    if (chainResult.ok) {
      setChain(chainResult.data);
    }

    setIsLoading(false);
  }, [taskId, isRemoteAuthenticated, service]);

  useEffect(() => {
    void loadDependencies();
  }, [loadDependencies]);

  const refresh = useCallback(async () => {
    await loadDependencies();
  }, [loadDependencies]);

  const hasDependencies = dependencies.length > 0;
  const hasDependents = dependents.length > 0;
  const isOnCriticalPath = chain?.isOnCriticalPath ?? false;
  const depth = chain?.depth ?? 0;

  return {
    dependencies,
    dependents,
    chain,
    isLoading,
    error,
    refresh,
    hasDependencies,
    hasDependents,
    isOnCriticalPath,
    depth,
  };
}
