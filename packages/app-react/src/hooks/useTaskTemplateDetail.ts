import { useEffect, useState } from 'react';

import { useAppSession } from './useAppSession';
import { mapTaskTemplateDetail, type TaskTemplateDetail } from './useTaskTemplates';
import { useTaskService } from './useTaskService';

export function useTaskTemplateDetail(taskId: string | null) {
  const service = useTaskService();
  const { isRemoteAuthenticated } = useAppSession();

  const [template, setTemplate] = useState<TaskTemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRemoteAuthenticated || !taskId) {
      setTemplate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const activeTaskId = taskId;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);

      const result = await service.getTemplate(activeTaskId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setTemplate(null);
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      setTemplate(mapTaskTemplateDetail(result.data));
      setIsLoading(false);
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [isRemoteAuthenticated, service, taskId]);

  async function refresh() {
    if (!isRemoteAuthenticated || !taskId) {
      return;
    }

    setIsLoading(true);
    const result = await service.getTemplate(taskId);
    if (!result.ok) {
      setTemplate(null);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setTemplate(mapTaskTemplateDetail(result.data));
    setError(null);
    setIsLoading(false);
  }

  return {
    error,
    isLoading,
    refresh,
    template,
  };
}
