/**
 * SQLite SyncProfile Repository Implementation
 * 鍚屾閰嶇疆鏂囦欢鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { SyncProfile } from '@dailyuse/domain-server/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';

export class SqliteSyncProfileRepository implements ISyncProfileRepository {
  constructor(private db: Database.Database) {}

  async save(profile: SyncProfile): Promise<void> {
    const dto = profile.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO sync_profiles (
        uuid, accountUuid, name, sync_interval, conflict_resolution_strategy,
        is_active, last_sync_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        sync_interval = excluded.sync_interval,
        conflict_resolution_strategy = excluded.conflict_resolution_strategy,
        is_active = excluded.is_active,
        last_sync_at = excluded.last_sync_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.sync_interval,
      dto.conflict_resolution_strategy,
      dto.is_active ? 1 : 0,
      dto.last_sync_at || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<SyncProfile | null> {
    const stmt = this.db.prepare(`SELECT * FROM sync_profiles WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SyncProfile.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      sync_interval: row.sync_interval,
      conflict_resolution_strategy: row.conflict_resolution_strategy,
      is_active: row.is_active === 1,
      last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<SyncProfile[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncProfile.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        name: row.name,
        sync_interval: row.sync_interval,
        conflict_resolution_strategy: row.conflict_resolution_strategy,
        is_active: row.is_active === 1,
        last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findActiveProfiles(accountUuid: string): Promise<SyncProfile[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE accountUuid = ? AND is_active = 1 ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncProfile.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        name: row.name,
        sync_interval: row.sync_interval,
        conflict_resolution_strategy: row.conflict_resolution_strategy,
        is_active: row.is_active === 1,
        last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<SyncProfile | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE accountUuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return SyncProfile.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      name: row.name,
      sync_interval: row.sync_interval,
      conflict_resolution_strategy: row.conflict_resolution_strategy,
      is_active: row.is_active === 1,
      last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM sync_profiles WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM sync_profiles WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM sync_profiles WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

