/**
 * CalendarEntry Aggregate Server DTO
 *
 * Represents a user-facing calendar entry with conflict detection capability.
 * This model is for visualization/time-occupancy and is separate from ScheduleTask.
 *
 * @module Schedule
 */

import type { ScheduleId, IdentityId, TransferDate } from '../../../primitives';

export interface CalendarEntryServerDTO {
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
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
