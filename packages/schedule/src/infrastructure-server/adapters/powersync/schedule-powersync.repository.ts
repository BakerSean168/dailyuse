import type { IScheduleRepository } from '../../../domain-server/repositories/i-schedule-repository';
import type { CalendarEntry } from '../../../domain-server/aggregates/calendar-entry';
import {
  PowerSyncScheduleMapper,
  type PowerSyncScheduleRow,
} from './mappers/powersync-schedule.mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

const eventBusAdapter = createEventBusAdapter(eventBus);

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class PowerSyncScheduleRepository implements IScheduleRepository {
  constructor(private readonly db: Queryable) {}

  async save(schedule: CalendarEntry): Promise<void> {
    const data = PowerSyncScheduleMapper.toPersistence(schedule);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM schedules WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE schedules
         SET title = ?,
             description = ?,
             start_time = ?,
             end_time = ?,
             duration = ?,
             has_conflict = ?,
             conflicting_schedules = ?,
             priority = ?,
             location = ?,
             attendees = ?,
             updated_at = ?
         WHERE id = ?`,
        [
          data.title,
          data.description,
          data.startTime,
          data.endTime,
          data.duration,
          data.hasConflict,
          data.conflictingSchedules,
          data.priority,
          data.location,
          data.attendees,
          data.updatedAt,
          data.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO schedules (
          id, identity_id, title, description, start_time, end_time, duration,
          has_conflict, conflicting_schedules, priority, location, attendees, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.identityId,
          data.title,
          data.description,
          data.startTime,
          data.endTime,
          data.duration,
          data.hasConflict,
          data.conflictingSchedules,
          data.priority,
          data.location,
          data.attendees,
          data.createdAt,
          data.updatedAt,
        ],
      );
    }
  }

  async findById(id: string): Promise<CalendarEntry | null> {
    const row = await this.db.getOptional<PowerSyncScheduleRow>(
      'SELECT * FROM schedules WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncScheduleMapper.toDomain(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    const rows = await this.db.getAll<PowerSyncScheduleRow>(
      'SELECT * FROM schedules WHERE identity_id = ? ORDER BY start_time ASC',
      [identityId],
    );
    return rows.map((row) => PowerSyncScheduleMapper.toDomain(row));
  }

  async deleteById(id: string): Promise<void> {
    await this.db.execute('DELETE FROM schedules WHERE id = ?', [id]);
  }

  async deleteAggregate(entry: CalendarEntry): Promise<void> {
    await this.db.execute('DELETE FROM schedules WHERE id = ?', [entry.id]);
    await publishAggregateEvents(entry, eventBusAdapter);
  }

  async findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string,
  ): Promise<CalendarEntry[]> {
    const rows = await this.db.getAll<PowerSyncScheduleRow>(
      `SELECT * FROM schedules
       WHERE identity_id = ?
         AND start_time < ?
         AND end_time > ?
         ${excludeId ? 'AND id != ?' : ''}
       ORDER BY start_time ASC`,
      excludeId
        ? [
            identityId,
            new Date(endTime).toISOString(),
            new Date(startTime).toISOString(),
            excludeId,
          ]
        : [identityId, new Date(endTime).toISOString(), new Date(startTime).toISOString()],
    );
    return rows.map((row) => PowerSyncScheduleMapper.toDomain(row));
  }

  async withTransaction<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
