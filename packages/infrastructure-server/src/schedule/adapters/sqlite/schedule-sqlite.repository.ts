/**
 * SQLite Schedule Repository Implementation
 * 日程的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { Schedule } from '@dailyuse/domain-server/schedule';
import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';

export class SqliteScheduleRepository implements IScheduleRepository {
  constructor(private db: Database.Database) {}

  async save(schedule: Schedule): Promise<void> {
    const dto = schedule.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedules (
        uuid, account_uuid, title, description, start_time, end_time,
        location, all_day, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        location = excluded.location,
        all_day = excluded.all_day,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.title,
      dto.description || null,
      dto.start_time,
      dto.end_time,
      dto.location || null,
      dto.all_day ? 1 : 0,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<Schedule | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedules WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Schedule.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      all_day: row.all_day === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<Schedule[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedules WHERE account_uuid = ? ORDER BY start_time DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      Schedule.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        description: row.description,
        start_time: row.start_time,
        end_time: row.end_time,
        location: row.location,
        all_day: row.all_day === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async deleteByUuid(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedules WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findByTimeRange(
    accountUuid: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string,
  ): Promise<Schedule[]> {
    let query = `SELECT * FROM schedules WHERE account_uuid = ? AND start_time <= ? AND end_time >= ? `;
    const params: any[] = [accountUuid, endTime, startTime];

    if (excludeUuid) {
      query += `AND uuid != ? `;
      params.push(excludeUuid);
    }

    query += `ORDER BY start_time ASC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      Schedule.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        description: row.description,
        start_time: row.start_time,
        end_time: row.end_time,
        location: row.location,
        all_day: row.all_day === 1,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }
}
