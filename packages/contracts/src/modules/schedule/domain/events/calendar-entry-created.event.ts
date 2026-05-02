/**
 * Calendar Entry Created Event
 *
 * Triggered when a new calendar entry is added to a schedule.
 */
export interface CalendarEntryCreatedEvent {
  identityId: string;
  title: string;
  startTime: number;
  endTime: number;
}
