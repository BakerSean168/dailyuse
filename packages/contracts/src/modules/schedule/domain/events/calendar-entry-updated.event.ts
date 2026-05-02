/**
 * Calendar Entry Updated Event
 *
 * Triggered when an existing calendar entry is modified.
 */
export interface CalendarEntryUpdatedEvent {
  entryId: string;
  changedFields: string[];
}
