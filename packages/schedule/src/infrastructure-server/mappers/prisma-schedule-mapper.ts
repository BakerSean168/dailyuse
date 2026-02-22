/**
 * Prisma Schedule (CalendarEntry) Mapper
 *
 * Maps between CalendarEntry domain aggregate and Prisma Schedule model.
 * Handles timestamp/Date conversions and JSON serialization.
 */

import type { Schedule as PrismaSchedule } from '@dailyuse/database';
import { CalendarEntry } from '../../../domain-server/aggregates/calendar-entry';

export class PrismaScheduleMapper {
  /**
   * Prisma Schedule → Domain CalendarEntry aggregate
   */
  static toDomain(data: PrismaSchedule): CalendarEntry {
    return CalendarEntry.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      title: data.title,
      description: data.description,
      startTime: data.startTime.getTime(),
      endTime: data.endTime.getTime(),
      duration: data.duration,
      hasConflict: data.hasConflict,
      conflictingEntries: data.conflictingSchedules
        ? JSON.parse(data.conflictingSchedules)
        : null,
      priority: data.priority,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : null,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }

  /**
   * Domain CalendarEntry → Prisma write data
   */
  static toPersistence(schedule: CalendarEntry) {
    const dto = schedule.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      title: dto.title,
      description: dto.description ?? null,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      duration: dto.duration,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingEntries && dto.conflictingEntries.length > 0
        ? JSON.stringify(dto.conflictingEntries)
        : null,
      priority: dto.priority ?? null,
      location: dto.location ?? null,
      attendees: dto.attendees ? JSON.stringify(dto.attendees) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaSchedule[]): CalendarEntry[] {
    return rows.map((row) => PrismaScheduleMapper.toDomain(row));
  }
}
