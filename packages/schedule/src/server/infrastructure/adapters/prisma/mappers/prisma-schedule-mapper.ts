/**
 * Prisma Schedule (CalendarEntry) Mapper
 *
 * Maps between CalendarEntry domain aggregate and Prisma Schedule model.
 * Handles timestamp/Date conversions and JSON serialization.
 */

import type { Schedule as PrismaSchedule } from '@memoflow/database';
import { CalendarEntry } from '../../../../domain/aggregates/calendar-entry';
import type { CalendarEntryState } from '../../../../domain/aggregates/calendar-entry';
import { ScheduleId } from '../../../../domain/value-objects/schedule-id';
import type { IdentityId } from '@memoflow/domain-shared';

export class PrismaScheduleMapper {
  /** Converts a Prisma Schedule to a Domain CalendarEntry aggregate. */
  static toDomain(data: PrismaSchedule): CalendarEntry {
    const state: CalendarEntryState = {
      id: ScheduleId.of(data.id),
      identityId: data.identityId as IdentityId,
      title: data.title,
      description: data.description,
      startTime: data.startTime.getTime(),
      endTime: data.endTime.getTime(),
      duration: data.duration,
      hasConflict: data.hasConflict,
      conflictingEntries: data.conflictingSchedules ? JSON.parse(data.conflictingSchedules) : null,
      priority: data.priority,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return CalendarEntry.load(state);
  }

  /** Converts a Domain CalendarEntry to Prisma write data. */
  static toPersistence(schedule: CalendarEntry) {
    return {
      id: schedule.id,
      identityId: schedule.identityId,
      title: schedule.title,
      description: schedule.description ?? null,
      startTime: new Date(schedule.startTime),
      endTime: new Date(schedule.endTime),
      duration: schedule.duration,
      hasConflict: schedule.hasConflict,
      conflictingSchedules:
        schedule.conflictingEntries && schedule.conflictingEntries.length > 0
          ? JSON.stringify(schedule.conflictingEntries)
          : null,
      priority: schedule.priority ?? null,
      location: schedule.location ?? null,
      attendees: schedule.attendees ? JSON.stringify(schedule.attendees) : null,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  /** Batch converts Prisma records to Domain aggregates. */
  static toDomainList(rows: PrismaSchedule[]): CalendarEntry[] {
    return rows.map((row) => PrismaScheduleMapper.toDomain(row));
  }
}
