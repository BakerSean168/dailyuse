/**
 * useSchedule - 调度模块主 composable
 *
 * 通过 inject 获取 ScheduleClientService，所有方法返回 Result<T>。
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useScheduleStore } from '../stores/schedule-store';
import { SCHEDULE_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  ScheduleExecutionClientDTO,
  CreateScheduleTaskRequest,
  CalendarEntryClientDTO,
  CreateScheduleRequest,
} from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function useSchedule() {
  const { t } = useI18n();
  const service = useStrictInject(SCHEDULE_SERVICE_KEY, 'ScheduleService');

  const store = useScheduleStore();
  const savingId = ref<string | null>(null);

  const tasks = computed(() => store.tasks);
  const executions = computed(() => store.executions);
  const calendarEntries = computed(() => store.calendarEntries);
  const currentTask = computed(() => store.currentTask);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  async function fetchTasks(query?: Record<string, unknown>) {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getTasks();
      if (result.ok) {
        store.setTasks(
          result.data.map((t: ScheduleTask) => t.toDTO()),
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

  async function updateTask(id: string, data: Record<string, unknown>) {
    // TODO: ScheduleClientService does not yet provide updateTask — stub until service is extended
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

  async function fetchExecutions(taskId: string, query?: Record<string, unknown>) {
    // TODO: ScheduleClientService does not yet provide fetchExecutions — stub until service is extended
    console.warn('[schedule] fetchExecutions not yet available in ScheduleClientService');
    store.setExecutions([]);
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchTasks();
  }

  async function fetchCalendarEntries(
    startTime: number,
    endTime: number,
  ): Promise<CalendarEntryClientDTO[]> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getSchedulesByTimeRange(sanitizeForIpc({ startTime, endTime }));
      if (result.ok) {
        store.setCalendarEntries(result.data);
        return result.data;
      }
      handleError(result.error, 'schedule.error.loadCalendarEntriesFailed');
      return [];
    } finally {
      store.setLoading(false);
    }
  }

  async function createCalendarEntry(data: {
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    description?: string;
    priority?: number;
    location?: string;
    attendees?: string[];
    autoDetectConflicts?: boolean;
  }) {
    store.setError(null);
    try {
      const request = sanitizeForIpc(data) as unknown as CreateScheduleRequest;
      const result = data.autoDetectConflicts
        ? await service.createScheduleWithConflictDetection(request)
        : await service.createSchedule(request);

      if (result.ok) {
        const createdEntry = 'schedule' in result.data ? result.data.schedule : result.data;
        store.setCalendarEntries([...store.calendarEntries, createdEntry]);
        return createdEntry;
      }
      handleError(result.error, 'schedule.error.createCalendarEntryFailed');
      return null;
    } catch (e: any) {
      handleError(e, 'schedule.error.createCalendarEntryFailed');
      return null;
    }
  }

  async function deleteCalendarEntry(id: string) {
    store.setError(null);
    try {
      const result = await service.deleteSchedule(id);
      if (result.ok) {
        store.setCalendarEntries(store.calendarEntries.filter((e) => e.id !== id));
        return true;
      }
      handleError(result.error, 'schedule.error.deleteCalendarEntryFailed');
      return false;
    } catch (e: any) {
      handleError(e, 'schedule.error.deleteCalendarEntryFailed');
      return false;
    }
  }

  return {
    tasks,
    executions,
    calendarEntries,
    currentTask,
    isLoading,
    isSaving,
    error,
    pagination,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    pauseTask,
    resumeTask,
    fetchExecutions,
    setPage,
    fetchCalendarEntries,
    createCalendarEntry,
    deleteCalendarEntry,
  };
}
