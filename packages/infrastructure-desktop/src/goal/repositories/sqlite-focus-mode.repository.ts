/**
 * SQLite FocusMode Repository Implementation
 * 专注周期的 SQLite 仓储实现
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
        uuid, account_uuid, name, start_time, end_time, is_active,
        actual_end_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        is_active = excluded.is_active,
        actual_end_time = excluded.actual_end_time,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.start_time,
      dto.end_time,
      dto.is_active ? 1 : 0,
      dto.actual_end_time || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_modes WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return FocusMode.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_active === 1,
      actual_end_time: row.actual_end_time,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<FocusMode | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE account_uuid = ? AND is_active = 1 ORDER BY start_time DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return FocusMode.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_active === 1,
      actual_end_time: row.actual_end_time,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<FocusMode[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_modes WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      FocusMode.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        start_time: row.start_time,
        end_time: row.end_time,
        is_active: row.is_active === 1,
        actual_end_time: row.actual_end_time,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async deactivateExpired(): Promise<number> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE focus_modes
      SET is_active = 0, actual_end_time = ?, updated_at = ?
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
