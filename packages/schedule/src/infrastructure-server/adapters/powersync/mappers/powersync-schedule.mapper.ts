import { CalendarEntry } from '../../../../domain-server/aggregates/calendar-entry';
import type { CalendarEntryState } from '../../../../domain-server/aggregates/calendar-entry';
import { ScheduleId } from '../../../../domain-shared/value-objects/schedule-id';
import type { IdentityId } from '@dailyuse/domain-shared';

export type PowerSyncScheduleRow = {
  id: string;
  identity_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  has_conflict: number | boolean;
  conflicting_schedules: string | null;
  priority: number | null;
  location: string | null;
  attendees: string | null;
  created_at: string;
  updated_at: string;
};

export class PowerSyncScheduleMapper {
  static toDomain(data: PowerSyncScheduleRow): CalendarEntry {
    const state: CalendarEntryState = {
      id: ScheduleId.of(data.id),
      identityId: data.identity_id as IdentityId,
      title: data.title,
      description: data.description,
      startTime: new Date(data.start_time).getTime(),
      endTime: new Date(data.end_time).getTime(),
      duration: Number(data.duration),
      hasConflict: data.has_conflict === true || data.has_conflict === 1,
      conflictingEntries: data.conflicting_schedules
        ? JSON.parse(data.conflicting_schedules)
        : null,
      priority: data.priority,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
    return CalendarEntry.load(state);
  }

  static toPersistence(schedule: CalendarEntry) {
    return {
      id: String(schedule.id),
      identityId: schedule.identityId,
      title: schedule.title,
      description: schedule.description ?? null,
      startTime: new Date(schedule.startTime).toISOString(),
      endTime: new Date(schedule.endTime).toISOString(),
      duration: schedule.duration,
      hasConflict: schedule.hasConflict ? 1 : 0,
      conflictingSchedules:
        schedule.conflictingEntries && schedule.conflictingEntries.length > 0
          ? JSON.stringify(schedule.conflictingEntries)
          : null,
      priority: schedule.priority ?? null,
      location: schedule.location ?? null,
      attendees: schedule.attendees ? JSON.stringify(schedule.attendees) : null,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };
  }
}
