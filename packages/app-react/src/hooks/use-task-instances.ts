import { useEffect, useState } from 'react';

import type { TaskInstanceStatus, TaskTimeConfigDTO } from '@dailyuse/contracts/task';
import type { TaskInstance } from '@dailyuse/task/domain-client';

import { useAppSession } from './use-app-session';
import { useTaskService } from './use-task-service';

export type TaskInstanceSummary = {
  id: string;
  templateId: string;
  instanceDate: number;
  status: TaskInstanceStatus;
  timeConfig: TaskTimeConfigDTO;
  actualStartTime: number | null;
  actualEndTime: number | null;
  comment: string | null;
};

function mapInstance(instance: TaskInstance): TaskInstanceSummary {
  return {
    id: String(instance.id),
    templateId: String(instance.templateId),
    instanceDate: instance.instanceDate.getTime(),
    status: instance.status,
    timeConfig: {
      timeType: instance.timeConfig.timeType,
      startDate: instance.timeConfig.startDate ? instance.timeConfig.startDate.getTime() : null,
      timePoint: instance.timeConfig.timePoint,
      timeRange: instance.timeConfig.timeRange ?? null,
    },
    actualStartTime: instance.actualStartTime?.getTime() ?? null,
    actualEndTime: instance.actualEndTime?.getTime() ?? null,
    comment: instance.comment,
  };
}

export function useTaskInstances(taskId: string | null) {
  const service = useTaskService();
  const { isRemoteAuthenticated } = useAppSession();
  const [instances, setInstances] = useState<TaskInstanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isRemoteAuthenticated || !taskId) {
      setInstances([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await service.listInstances({ templateId: taskId, limit: 20 });
    if (!result.ok) {
      setInstances([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    const sorted = result.data
      .map((instance) => mapInstance(instance))
      .sort((left, right) => right.instanceDate - left.instanceDate);
    setInstances(sorted);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [isRemoteAuthenticated, taskId]);

  async function refresh() {
    await load();
  }

  async function startInstance(id: string) {
    const result = await service.startInstance(id);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await load();
    return true;
  }

  async function completeInstance(id: string) {
    const result = await service.completeInstance(id);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await load();
    return true;
  }

  async function skipInstance(id: string) {
    const result = await service.skipInstance(id);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    await load();
    return true;
  }

  return {
    completeInstance,
    error,
    instances,
    isLoading,
    refresh,
    skipInstance,
    startInstance,
  };
}
