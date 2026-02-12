/**
 * @deprecated Use useSchedule() instead. This is a backward compatibility shim.
 */
import { useSchedule } from './useSchedule';

export function useScheduleEvent() {
  const schedule = useSchedule();
  return {
    schedules: schedule.tasks,
    isLoading: schedule.isLoading,
    error: schedule.error,
    createSchedule: schedule.createTask,
    updateSchedule: schedule.updateTask,
    deleteSchedule: schedule.deleteTask,
    getSchedulesByAccount: schedule.fetchTasks,
    loadSchedulesByTimeRange: schedule.fetchTasks,
    setActiveSchedule: (id: string) => schedule.fetchTask(id),
  };
}
