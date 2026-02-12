/**
 * useSchedule Hook
 *
 * 日程管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { scheduleApplicationService } from '@dailyuse/schedule/application-client';
import type { ScheduleClientDTO } from '../stores/scheduleStore';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';
import type {
  CreateScheduleTaskRequest,
  GetSchedulesByTimeRangeRequest,
} from '@dailyuse/contracts/schedule';

// Local input types for hook interface
export interface CompleteScheduleTaskInput {
  taskUuid: string;
  reason?: string;
}

export interface CancelScheduleTaskInput {
  taskUuid: string;
  reason?: string;
}

// ===== Types =====

export interface ScheduleState {
  tasks: ScheduleTask[];
  events: ScheduleClientDTO[];
  selectedTask: ScheduleTask | null;
  selectedEvent: ScheduleClientDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseScheduleReturn extends ScheduleState {
  // Task Query
  loadTasks: () => Promise<void>;
  getTask: (id: string) => Promise<ScheduleTask | null>;

  // Task Mutations
  createTask: (input: CreateScheduleTaskRequest) => Promise<ScheduleTask>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  completeTask: (input: CompleteScheduleTaskInput) => Promise<void>;
  cancelTask: (input: CancelScheduleTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Event Query
  getEventsByTimeRange: (input: GetSchedulesByTimeRangeRequest) => Promise<ScheduleClientDTO[]>;

  // Selection
  selectTask: (task: ScheduleTask | null) => void;
  selectEvent: (event: ScheduleClientDTO | null) => void;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useSchedule(): UseScheduleReturn {
  const [state, setState] = useState<ScheduleState>({
    tasks: [],
    events: [],
    selectedTask: null,
    selectedEvent: null,
    loading: false,
    error: null,
  });

  // ===== Task Query =====

  const loadTasks = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const tasks = await scheduleApplicationService.listScheduleTasks();
      setState((prev) => ({ ...prev, tasks, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getTask = useCallback(async (id: string) => {
    return scheduleApplicationService.getScheduleTask(id);
  }, []);

  // ===== Task Mutations =====

  const createTask = useCallback(async (input: CreateScheduleTaskRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const task = await scheduleApplicationService.createScheduleTask(input);
      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, task],
        loading: false,
      }));
      return task;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const pauseTask = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await scheduleApplicationService.pauseScheduleTask(id);
      // Reload tasks after pause
      const tasks = await scheduleApplicationService.listScheduleTasks();
      setState((prev) => ({
        ...prev,
        tasks,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '暂停日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const resumeTask = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await scheduleApplicationService.resumeScheduleTask(id);
      // Reload tasks after resume
      const tasks = await scheduleApplicationService.listScheduleTasks();
      setState((prev) => ({
        ...prev,
        tasks,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '恢复日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const completeTask = useCallback(async (input: CompleteScheduleTaskInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await scheduleApplicationService.completeScheduleTask(input.taskUuid, input.reason);
      // Reload tasks after complete
      const tasks = await scheduleApplicationService.listScheduleTasks();
      setState((prev) => ({
        ...prev,
        tasks,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '完成日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const cancelTask = useCallback(async (input: CancelScheduleTaskInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await scheduleApplicationService.cancelScheduleTask(input.taskUuid, input.reason);
      // Reload tasks after cancel
      const tasks = await scheduleApplicationService.listScheduleTasks();
      setState((prev) => ({
        ...prev,
        tasks,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '取消日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await scheduleApplicationService.deleteScheduleTask(id);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.uuid !== id),
        selectedTask: prev.selectedTask?.uuid === id ? null : prev.selectedTask,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除日程任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Event Query =====

  const getEventsByTimeRange = useCallback(
    async (input: GetSchedulesByTimeRangeRequest): Promise<ScheduleClientDTO[]> => {
      // 将 application service 返回的类型转换为本地类型
      const result = await scheduleApplicationService.getSchedulesByTimeRange(input);
      return result as unknown as ScheduleClientDTO[];
    },
    [],
  );

  // ===== Selection =====

  const selectTask = useCallback((task: ScheduleTask | null) => {
    setState((prev) => ({ ...prev, selectedTask: task }));
  }, []);

  const selectEvent = useCallback((event: ScheduleClientDTO | null) => {
    setState((prev) => ({ ...prev, selectedEvent: event }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // ===== Effects =====

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    ...state,
    loadTasks,
    getTask,
    createTask,
    pauseTask,
    resumeTask,
    completeTask,
    cancelTask,
    deleteTask,
    getEventsByTimeRange,
    selectTask,
    selectEvent,
    clearError,
    refresh,
  };
}
