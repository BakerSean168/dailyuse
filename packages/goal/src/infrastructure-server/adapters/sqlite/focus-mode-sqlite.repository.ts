/**
 * SQLite FocusMode Repository Implementation
 * 涓撴敞鍛ㄦ湡鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { FocusMode } from '@/domain-server';
import type { IFocusModeRepository } from '@/domain-server';

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
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.startTime,
      dto.endTime,
      dto.isActive ? 1 : 0,
      dto.actualEndTime || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_modes WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToFocusMode(row);
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE accountUuid = ? AND is_active = 1 ORDER BY start_time DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return this.rowToFocusMode(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<FocusMode[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToFocusMode(row));
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

  // Private helper method to convert database row to FocusMode
  private rowToFocusMode(row: any): FocusMode {
    return FocusMode.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      startTime: row.start_time,
      endTime: row.end_time,
      isActive: row.is_active === 1,
      actualEndTime: row.actual_end_time,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}


