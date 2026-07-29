import { sanitizeForIpc } from '../../../shared/utils/ipc';
import type {
  CalendarEntryClientDTO,
  CreateScheduleRequest,
} from '@memoflow/contracts/schedule';
import type { ScheduleContext } from './useScheduleContext';

export function useScheduleCalendar(ctx: ScheduleContext) {
  const { store, service, handleError } = ctx;

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
    } catch (e: unknown) {
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
    } catch (e: unknown) {
      handleError(e, 'schedule.error.deleteCalendarEntryFailed');
      return false;
    }
  }

  return {
    fetchCalendarEntries,
    createCalendarEntry,
    deleteCalendarEntry,
  };
}
