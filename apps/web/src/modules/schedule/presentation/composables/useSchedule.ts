/**
 * useSchedule - 调度模块主 composable
 */

import { computed, ref } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';
import { scheduleApi, ScheduleApiError } from '../services/scheduleApi';
import type {
  ScheduleTaskClientDTO,
  ScheduleExecutionClientDTO,
} from '@dailyuse/contracts/schedule';

export function useSchedule() {
  const store = useScheduleStore();
  const savingId = ref<string | null>(null);

  const tasks = computed(() => store.tasks);
  const executions = computed(() => store.executions);
  const currentTask = computed(() => store.currentTask);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(err: unknown, fallback: string): void {
    const msg = err instanceof ScheduleApiError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  async function fetchTasks(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await scheduleApi.listTasks({
        ...query, page: store.pagination.page, pageSize: store.pagination.pageSize,
      });
      store.setTasks(res.data as ScheduleTaskClientDTO[], res.total);
    } catch (e) { handleError(e, '加载调度任务失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchTask(id: string) {
    store.setLoading(true); store.setError(null);
    try {
      const t = await scheduleApi.getTask(id) as ScheduleTaskClientDTO;
      store.setCurrentTask(t);
      return t;
    } catch (e) { handleError(e, '加载调度任务失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createTask(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    try {
      const t = await scheduleApi.createTask(data) as ScheduleTaskClientDTO;
      store.addTask(t);
      return t;
    } catch (e) { handleError(e, '创建调度任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateTask(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const t = await scheduleApi.updateTask(id, data) as ScheduleTaskClientDTO;
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '更新调度任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteTask(id: string) {
    savingId.value = id; store.setError(null);
    try { await scheduleApi.deleteTask(id); store.removeTask(id); return true; }
    catch (e) { handleError(e, '删除调度任务失败'); return false; }
    finally { savingId.value = null; }
  }

  async function pauseTask(id: string) {
    try {
      const t = await scheduleApi.pauseTask(id) as ScheduleTaskClientDTO;
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '暂停调度任务失败'); return null; }
  }

  async function resumeTask(id: string) {
    try {
      const t = await scheduleApi.resumeTask(id) as ScheduleTaskClientDTO;
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '恢复调度任务失败'); return null; }
  }

  async function fetchExecutions(taskId: string, query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await scheduleApi.listExecutions(taskId, query);
      store.setExecutions(res.data as ScheduleExecutionClientDTO[]);
    } catch (e) { handleError(e, '加载执行记录失败'); }
    finally { store.setLoading(false); }
  }

  function setPage(p: number) { store.setPage(p); fetchTasks(); }

  return {
    tasks, executions, currentTask, isLoading, isSaving, error, pagination,
    fetchTasks, fetchTask, createTask, updateTask, deleteTask,
    pauseTask, resumeTask, fetchExecutions, setPage,
  };
}
