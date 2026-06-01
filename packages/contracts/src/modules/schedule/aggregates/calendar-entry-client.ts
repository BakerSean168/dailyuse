/**
 * CalendarEntry Aggregate Client DTO
 *
 * Client-side representation of a calendar entry/event.
 * This DTO is used for calendar rendering and conflict visualization.
 *
 * @module Schedule
 */

import type { ScheduleId, IdentityId, TransferDate } from '../../../primitives';

export interface CalendarEntryClientDTO {
  id: ScheduleId;
  identityId: IdentityId;
  title: string;
  description?: string;
  startTime: TransferDate;
  endTime: TransferDate;
  duration: number;
  hasConflict: boolean;
  conflictingEntries?: string[];
  priority?: number;
  location?: string;
  attendees?: string[];
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
