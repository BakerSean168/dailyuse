import { computed } from 'vue';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type { CreateScheduleTaskRequest } from '@dailyuse/contracts/schedule';
import type { ScheduleContext } from './useScheduleContext';

export function useScheduleTasks(ctx: ScheduleContext) {
  const { store, service, savingId, handleError } = ctx;

  const isSaving = computed(() => savingId.value !== null);

  async function fetchTasks(_query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getTasks();
      if (result.ok) {
        store.setTasks(
          result.data.map((t) => t.toDTO()),
          result.data.length,
        );
      } else {
        handleError(result.error, 'schedule.error.loadTasksFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchTask(id: string) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getTaskById(id);
      if (result.ok) {
        const dto = result.data.toDTO();
        store.setCurrentTask(dto);
        return dto;
      }
      handleError(result.error, 'schedule.error.loadTasksFailed');
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  async function createTask(data: Record<string, unknown>) {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await service.createTask(
        sanitizeForIpc(data) as unknown as CreateScheduleTaskRequest,
      );
      if (result.ok) {
        const dto = result.data.toDTO();
        store.addTask(dto);
        return dto;
      }
      handleError(result.error, 'schedule.error.createTaskFailed');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateTask(_id: string, _data: Record<string, unknown>) {
    console.warn('[schedule] updateTask not yet available in ScheduleClientService');
    savingId.value = null;
    return null;
  }

  async function deleteTask(id: string) {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteTask(id);
      if (result.ok) {
        store.removeTask(id);
        return true;
      }
      handleError(result.error, 'schedule.error.deleteTaskFailed');
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function pauseTask(id: string) {
    const result = await service.pauseTask(id);
    if (!result.ok) {
      handleError(result.error, 'schedule.error.pauseTaskFailed');
      return null;
    }
    const refreshed = await service.getTaskById(id);
    if (refreshed.ok) {
      const dto = refreshed.data.toDTO();
      store.updateTask(dto);
      return dto;
    }
    handleError(refreshed.error, 'schedule.error.pauseRefreshFailed');
    return null;
  }

  async function resumeTask(id: string) {
    const result = await service.resumeTask(id);
    if (!result.ok) {
      handleError(result.error, 'schedule.error.resumeTaskFailed');
      return null;
    }
    const refreshed = await service.getTaskById(id);
    if (refreshed.ok) {
      const dto = refreshed.data.toDTO();
      store.updateTask(dto);
      return dto;
    }
    handleError(refreshed.error, 'schedule.error.resumeRefreshFailed');
    return null;
  }

  async function fetchExecutions(_taskId: string, _query?: Record<string, unknown>) {
    console.warn('[schedule] fetchExecutions not yet available in ScheduleClientService');
    store.setExecutions([]);
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchTasks();
  }

  return {
    isSaving,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    pauseTask,
    resumeTask,
    fetchExecutions,
    setPage,
  };
}
