import { CalendarEntry, type CalendarEntryState } from '../../../../domain-server/aggregates/calendar-entry';
import { ScheduleId } from '../../../../domain-shared/value-objects/schedule-id';

export interface SqliteScheduleRow {
  id: string;
  identity_id: string;
  title: string;
  start_time: number;
  end_time: number;
  description: string | null;
  location: string | null;
  created_at: number;
  updated_at: number;
}

export class SqliteScheduleMapper {
  static toDomain(row: SqliteScheduleRow): CalendarEntry {
    const state: CalendarEntryState = {
      id: ScheduleId.of(row.id),
      identityId: row.identity_id,
      title: row.title,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: Math.round((row.end_time - row.start_time) / 60000),
      hasConflict: false,
      conflictingEntries: null,
      priority: null,
      location: row.location,
      attendees: null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return CalendarEntry.load(state);
  }

  static toPersistence(entry: CalendarEntry) {
    return {
      id: entry.id,
      identityId: entry.identityId,
      title: entry.title,
      description: entry.description ?? null,
      startTime: entry.startTime,
      endTime: entry.endTime,
      location: entry.location ?? null,
      createdAt: entry.createdAt.getTime(),
      updatedAt: entry.updatedAt.getTime(),
    };
  }
}
