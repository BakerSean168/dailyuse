/**
 * useSchedule - 调度模块主 composable
 *
 * 薄编排层，组合 useScheduleTasks / useScheduleCalendar。
 * 所有具体逻辑由子 composable 承载。
 */

import { computed } from 'vue';
import { useScheduleStore } from '../stores/schedule-store';
import { createScheduleContext } from './useScheduleContext';
import { useScheduleTasks } from './useScheduleTasks';
import { useScheduleCalendar } from './useScheduleCalendar';

export function useSchedule() {
  const ctx = createScheduleContext();
  const taskOps = useScheduleTasks(ctx);
  const calendarOps = useScheduleCalendar(ctx);

  return {
    // State
    tasks: computed(() => ctx.store.tasks),
    executions: computed(() => ctx.store.executions),
    calendarEntries: computed(() => ctx.store.calendarEntries),
    currentTask: computed(() => ctx.store.currentTask),
    isLoading: computed(() => ctx.store.isLoading),
    isSaving: taskOps.isSaving,
    error: computed(() => ctx.store.error),
    pagination: computed(() => ctx.store.pagination),
    // Task operations
    fetchTasks: taskOps.fetchTasks,
    fetchTask: taskOps.fetchTask,
    createTask: taskOps.createTask,
    updateTask: taskOps.updateTask,
    deleteTask: taskOps.deleteTask,
    pauseTask: taskOps.pauseTask,
    resumeTask: taskOps.resumeTask,
    fetchExecutions: taskOps.fetchExecutions,
    setPage: taskOps.setPage,
    // Calendar operations
    fetchCalendarEntries: calendarOps.fetchCalendarEntries,
    createCalendarEntry: calendarOps.createCalendarEntry,
    deleteCalendarEntry: calendarOps.deleteCalendarEntry,
  };
}
