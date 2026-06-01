import type { IdentityId } from '../../../../primitives';

/**
 * Calendar Entry Created Event
 *
 * Triggered when a new calendar entry is added to a schedule.
 */
export interface CalendarEntryCreatedEvent {
  identityId: IdentityId;
  title: string;
  startTime: number;
  endTime: number;
}
