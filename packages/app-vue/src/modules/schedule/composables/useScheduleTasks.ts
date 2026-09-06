import type { ScheduleContext } from './useScheduleContext';

/**
 * Read-only raw Scheduler diagnostics for the Web/Desktop UI.
 *
 * Business modules own scheduling mutations through SchedulingPort and their
 * own product commands. Raw ScheduleTask worker jobs are deliberately not
 * creatable, pausable, resumable or deletable from the shared Vue product UI.
 * The HTTP task API remains temporarily available for the deferred Mobile
 * compatibility lane; do not re-expose it here.
 */
export function useScheduleTasks(ctx: ScheduleContext) {
  const { store, service, handleError } = ctx;

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

  async function fetchExecutions(_taskId: string, _query?: Record<string, unknown>) {
    console.warn('[schedule] fetchExecutions not yet available in ScheduleClientService');
    store.setExecutions([]);
  }

  function setPage(p: number) {
    store.setPage(p);
    void fetchTasks();
  }

  return {
    fetchTasks,
    fetchTask,
    fetchExecutions,
    setPage,
  };
}
