/**
 * CalendarEntry Aggregate Server DTO
 *
 * Represents a user-facing calendar entry with conflict detection capability.
 * This model is for visualization/time-occupancy and is separate from ScheduleTask.
 *
 * @module Schedule
 */

import type { ScheduleId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';

export interface CalendarEntryServer {
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

export interface CalendarEntryServerDTO {
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

export interface CalendarEntryPersistenceDTO {
  id: string;
  identityId: string;
  title: string;
  description: string | null;
  startTime: PersistenceDate;
  endTime: PersistenceDate;
  duration: number;
  hasConflict: boolean;
  conflictingEntries: string | null;
  priority: number | null;
  location: string | null;
  attendees: string | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
