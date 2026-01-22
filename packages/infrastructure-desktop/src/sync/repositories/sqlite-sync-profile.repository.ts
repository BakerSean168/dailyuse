/**
 * SQLite SyncProfile Repository Implementation
 * 同步配置文件的 SQLite 仓储实现
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
        uuid, account_uuid, name, sync_interval, conflict_resolution_strategy,
        is_active, last_sync_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        sync_interval = excluded.sync_interval,
        conflict_resolution_strategy = excluded.conflict_resolution_strategy,
        is_active = excluded.is_active,
        last_sync_at = excluded.last_sync_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.sync_interval,
      dto.conflict_resolution_strategy,
      dto.is_active ? 1 : 0,
      dto.last_sync_at || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<SyncProfile | null> {
    const stmt = this.db.prepare(`SELECT * FROM sync_profiles WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return SyncProfile.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      sync_interval: row.sync_interval,
      conflict_resolution_strategy: row.conflict_resolution_strategy,
      is_active: row.is_active === 1,
      last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<SyncProfile[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncProfile.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        sync_interval: row.sync_interval,
        conflict_resolution_strategy: row.conflict_resolution_strategy,
        is_active: row.is_active === 1,
        last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findActiveProfiles(accountUuid: string): Promise<SyncProfile[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE account_uuid = ? AND is_active = 1 ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      SyncProfile.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        sync_interval: row.sync_interval,
        conflict_resolution_strategy: row.conflict_resolution_strategy,
        is_active: row.is_active === 1,
        last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<SyncProfile | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM sync_profiles WHERE account_uuid = ? AND name = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, name) as any;

    if (!row) return null;

    return SyncProfile.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      sync_interval: row.sync_interval,
      conflict_resolution_strategy: row.conflict_resolution_strategy,
      is_active: row.is_active === 1,
      last_sync_at: row.last_sync_at ? new Date(row.last_sync_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM sync_profiles WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM sync_profiles WHERE account_uuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM sync_profiles WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}
