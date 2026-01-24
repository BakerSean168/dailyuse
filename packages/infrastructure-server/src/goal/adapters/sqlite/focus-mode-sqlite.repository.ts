/**
 * SQLite FocusMode Repository Implementation
 * 涓撴敞鍛ㄦ湡鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { FocusMode } from '@dailyuse/domain-server/goal';
import type { IFocusModeRepository } from '@dailyuse/domain-server/goal';

export class SqliteFocusModeRepository implements IFocusModeRepository {
  constructor(private db: Database.Database) {}

  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO focus_modes (
        uuid, accountUuid, name, start_time, end_time, is_active,
        actual_end_time, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        is_active = excluded.is_active,
        actual_end_time = excluded.actual_end_time,
        updatedAt = excluded\.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto\.accountUuid,
      dto.name,
      dto.start_time,
      dto.end_time,
      dto.is_active ? 1 : 0,
      dto.actual_end_time || null,
      dto\.createdAt,
      dto\.updatedAt,
    );
  }

  async findById(uuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_modes WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return FocusMode.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_active === 1,
      actual_end_time: row.actual_end_time,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE accountUuid = ? AND is_active = 1 ORDER BY start_time DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return FocusMode.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_active === 1,
      actual_end_time: row.actual_end_time,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<FocusMode[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      FocusMode.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row\.accountUuid,
        name: row.name,
        start_time: row.start_time,
        end_time: row.end_time,
        is_active: row.is_active === 1,
        actual_end_time: row.actual_end_time,
        createdAt: new Date(row\.createdAt),
        updatedAt: new Date(row\.updatedAt),
      })
    );
  }

  async deactivateExpired(): Promise<number> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE focus_modes
      SET is_active = 0, actual_end_time = ?, updatedAt = ?
      WHERE is_active = 1 AND end_time < ?
    `);

    const result = stmt.run(now, now, now);
    return result.changes ?? 0;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM focus_modes WHERE uuid = ?`);
    stmt.run(uuid);
  }
}


