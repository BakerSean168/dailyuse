/**
 * useSchedule - 调度模块主 composable
 *
 * 使用 @dailyuse/http-client 的 AxiosHttpClient 进行 HTTP 调用。
 */

import { computed, ref } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';
import { httpClient } from '@/shared/http';
import { HttpClientError } from '@dailyuse/http-client';
import type {
  ScheduleTaskClientDTO,
  ScheduleExecutionClientDTO,
} from '@dailyuse/contracts/schedule';

const BASE = '/schedule-tasks';

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
    const msg = err instanceof HttpClientError ? err.message : err instanceof Error ? err.message : fallback;
    store.setError(msg);
    console.error(fallback, err);
  }

  async function fetchTasks(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: ScheduleTaskClientDTO[]; total: number }>(BASE, {
        params: { ...query, page: store.pagination.page, pageSize: store.pagination.pageSize },
      });
      store.setTasks(res.data as ScheduleTaskClientDTO[], res.total);
    } catch (e) { handleError(e, '加载调度任务失败'); }
    finally { store.setLoading(false); }
  }

  async function fetchTask(id: string) {
    store.setLoading(true); store.setError(null);
    try {
      const t = await httpClient.get<ScheduleTaskClientDTO>(`${BASE}/${id}`);
      store.setCurrentTask(t);
      return t;
    } catch (e) { handleError(e, '加载调度任务失败'); return null; }
    finally { store.setLoading(false); }
  }

  async function createTask(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    try {
      const t = await httpClient.post<ScheduleTaskClientDTO>(BASE, data);
      store.addTask(t);
      return t;
    } catch (e) { handleError(e, '创建调度任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function updateTask(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    try {
      const t = await httpClient.put<ScheduleTaskClientDTO>(`${BASE}/${id}`, data);
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '更新调度任务失败'); return null; }
    finally { savingId.value = null; }
  }

  async function deleteTask(id: string) {
    savingId.value = id; store.setError(null);
    try { await httpClient.delete<void>(`${BASE}/${id}`); store.removeTask(id); return true; }
    catch (e) { handleError(e, '删除调度任务失败'); return false; }
    finally { savingId.value = null; }
  }

  async function pauseTask(id: string) {
    try {
      const t = await httpClient.patch<ScheduleTaskClientDTO>(`${BASE}/${id}/pause`);
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '暂停调度任务失败'); return null; }
  }

  async function resumeTask(id: string) {
    try {
      const t = await httpClient.patch<ScheduleTaskClientDTO>(`${BASE}/${id}/resume`);
      store.updateTask(t);
      return t;
    } catch (e) { handleError(e, '恢复调度任务失败'); return null; }
  }

  async function fetchExecutions(taskId: string, query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    try {
      const res = await httpClient.get<{ data: ScheduleExecutionClientDTO[]; total: number }>(`${BASE}/${taskId}/executions`, { params: query });
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
