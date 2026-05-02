/**
 * Calendar Entry Rescheduled Event
 *
 * Triggered when a calendar entry's time window is moved to a new period.
 */
export interface CalendarEntryRescheduledEvent {
  entryId: string;
  oldStartTime: number;
  oldEndTime: number;
  newStartTime: number;
  newEndTime: number;
}
