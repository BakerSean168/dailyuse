import type Database from 'better-sqlite3';
import type { CalendarEntry } from '../../../domain-server/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../../domain-server/repositories/IScheduleRepository';
import { SqliteScheduleMapper, type SqliteScheduleRow } from './mappers/sqlite-schedule-mapper';

export class SqliteScheduleRepository implements IScheduleRepository {
  constructor(private readonly db: Database.Database) {}

  async save(schedule: CalendarEntry): Promise<void> {
    const data = SqliteScheduleMapper.toPersistence(schedule);

    this.db
      .prepare(
        `INSERT INTO schedules (
          id, identity_id, title, start_time, end_time, description, location, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          description = excluded.description,
          location = excluded.location,
          updated_at = excluded.updated_at`,
      )
      .run(
        data.id,
        data.identityId,
        data.title,
        data.startTime,
        data.endTime,
        data.description,
        data.location,
        data.createdAt,
        data.updatedAt,
      );
  }

  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    const rows = this.db
      .prepare('SELECT * FROM schedules WHERE identity_id = ? ORDER BY start_time ASC')
      .all(identityId) as SqliteScheduleRow[];
    return rows.map((row) => SqliteScheduleMapper.toDomain(row));
  }

  async findById(id: string): Promise<CalendarEntry | null> {
    const row = this.db.prepare('SELECT * FROM schedules WHERE id = ? LIMIT 1').get(id) as
      | SqliteScheduleRow
      | undefined;
    return row ? SqliteScheduleMapper.toDomain(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    this.db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  }

  async findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string,
  ): Promise<CalendarEntry[]> {
    const baseSql = `
      SELECT * FROM schedules
      WHERE identity_id = ?
        AND start_time < ?
        AND end_time > ?
    `;

    const sql = excludeId
      ? `${baseSql} AND id != ? ORDER BY start_time ASC`
      : `${baseSql} ORDER BY start_time ASC`;
    const params = excludeId
      ? [identityId, endTime, startTime, excludeId]
      : [identityId, endTime, startTime];

    const rows = this.db.prepare(sql).all(...params) as SqliteScheduleRow[];
    return rows.map((row) => SqliteScheduleMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    return this.deleteById(id);
  }

  async findAll(identityId: string): Promise<CalendarEntry[]> {
    return this.findByIdentityId(identityId);
  }

  async findByAccountId(identityId: string): Promise<CalendarEntry[]> {
    return this.findByIdentityId(identityId);
  }

  async findByDateRange(identityId: string, startTime: number, endTime: number): Promise<CalendarEntry[]> {
    return this.findByTimeRange(identityId, startTime, endTime);
  }

  async withTransaction<T>(fn: (repo: IScheduleRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }
}


