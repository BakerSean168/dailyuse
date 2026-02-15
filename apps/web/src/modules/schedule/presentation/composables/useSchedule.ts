/**
 * useSchedule - 调度模块主 composable
 *
 * 通过 inject 获取 ScheduleClientService，所有方法返回 Result<T>。
 */

import { computed, inject, ref } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';
import { SCHEDULE_SERVICE_KEY } from '@/shared/di';
import { resultHttpClient } from '@/shared/http';
import type {
  ScheduleTaskClientDTO,
  ScheduleExecutionClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';

export function useSchedule() {
  const service = inject(SCHEDULE_SERVICE_KEY)!;
  const store = useScheduleStore();
  const savingId = ref<string | null>(null);

  const tasks = computed(() => store.tasks);
  const executions = computed(() => store.executions);
  const currentTask = computed(() => store.currentTask);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const pagination = computed(() => store.pagination);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(message: string): void {
    store.setError(message);
    console.error(message);
  }

  async function fetchTasks(query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    const result = await service.getTasks();
    if (result.ok) {
      store.setTasks(result.data.tasks.map((t: ScheduleTask) => t.toDTO()), result.data.total);
    } else {
      handleError(result.error.message || '加载调度任务失败');
    }
    store.setLoading(false);
  }

  async function fetchTask(id: string) {
    store.setLoading(true); store.setError(null);
    const result = await service.getTaskById(id);
    store.setLoading(false);
    if (result.ok) { const dto = result.data.toDTO(); store.setCurrentTask(dto); return dto; }
    handleError(result.error.message || '加载调度任务失败');
    return null;
  }

  async function createTask(data: Record<string, unknown>) {
    savingId.value = 'new'; store.setError(null);
    const result = await service.createTask(data as unknown as CreateScheduleTaskRequest);
    savingId.value = null;
    if (result.ok) { const dto = result.data.toDTO(); store.addTask(dto); return dto; }
    handleError(result.error.message || '创建调度任务失败');
    return null;
  }

  async function updateTask(id: string, data: Record<string, unknown>) {
    savingId.value = id; store.setError(null);
    const result = await resultHttpClient.put<ScheduleTaskClientDTO>(`/schedule-tasks/${id}`, data);
    savingId.value = null;
    if (result.ok) { store.updateTask(result.data); return result.data; }
    handleError(result.error.message || '更新调度任务失败');
    return null;
  }

  async function deleteTask(id: string) {
    savingId.value = id; store.setError(null);
    const result = await service.deleteTask(id);
    savingId.value = null;
    if (result.ok) { store.removeTask(id); return true; }
    handleError(result.error.message || '删除调度任务失败');
    return false;
  }

  async function pauseTask(id: string) {
    const result = await service.pauseTask(id);
    if (!result.ok) { handleError(result.error.message || '暂停调度任务失败'); return null; }
    const refreshed = await service.getTaskById(id);
    if (refreshed.ok) { const dto = refreshed.data.toDTO(); store.updateTask(dto); return dto; }
    handleError(refreshed.error.message || '暂停后刷新任务失败');
    return null;
  }

  async function resumeTask(id: string) {
    const result = await service.resumeTask(id);
    if (!result.ok) { handleError(result.error.message || '恢复调度任务失败'); return null; }
    const refreshed = await service.getTaskById(id);
    if (refreshed.ok) { const dto = refreshed.data.toDTO(); store.updateTask(dto); return dto; }
    handleError(refreshed.error.message || '恢复后刷新任务失败');
    return null;
  }

  async function fetchExecutions(taskId: string, query?: Record<string, unknown>) {
    store.setLoading(true); store.setError(null);
    const result = await resultHttpClient.get<{ data: ScheduleExecutionClientDTO[]; total: number }>(`/schedule-tasks/${taskId}/executions`, { params: query });
    if (result.ok) {
      store.setExecutions(result.data.data as ScheduleExecutionClientDTO[]);
    } else {
      handleError(result.error.message || '加载执行记录失败');
    }
    store.setLoading(false);
  }

  function setPage(p: number) { store.setPage(p); fetchTasks(); }

  return {
    tasks, executions, currentTask, isLoading, isSaving, error, pagination,
    fetchTasks, fetchTask, createTask, updateTask, deleteTask,
    pauseTask, resumeTask, fetchExecutions, setPage,
  };
}
