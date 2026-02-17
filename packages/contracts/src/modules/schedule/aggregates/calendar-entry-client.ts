/**
 * CalendarEntry Aggregate Client DTO
 *
 * Client-side representation of a calendar entry/event.
 * This DTO is used for calendar rendering and conflict visualization.
 *
 * @module Schedule
 */

import type { ScheduleId, IdentityId, DomainDate, TransferDate } from '@/primitives';

export interface CalendarEntryClient {
  id: ScheduleId;
  identityId: IdentityId;
  title: string;
  description: string | null;
  startTime: DomainDate;
  endTime: DomainDate;
  duration: number;
  hasConflict: boolean;
  conflictingEntries: string[] | null;
  priority: number | null;
  location: string | null;
  attendees: string[] | null;
}

export interface CalendarEntryClientDTO {
  id: string;
  identityId: string;
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
