/**
 * SQLite UserSetting Repository Implementation
 * 用户设置的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { IUserSettingRepository, UserSettingQueryOptions } from '@dailyuse/domain-server/setting';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    const dto = setting.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO user_settings (
        uuid, account_uuid, category, key, value, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.category,
      dto.key,
      JSON.stringify(dto.value),
      dto.created_at,
      dto.updated_at,
    );
  }

  async saveMany(settings: UserSetting[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO user_settings (
        uuid, account_uuid, category, key, value, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: UserSetting[]) => {
      for (const setting of items) {
        const dto = setting.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.account_uuid,
          dto.category,
          dto.key,
          JSON.stringify(dto.value),
          dto.created_at,
          dto.updated_at,
        );
      }
    });

    transaction(settings);
  }

  async findByUuid(uuid: string): Promise<UserSetting | null> {
    const stmt = this.db.prepare(`SELECT * FROM user_settings WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return UserSetting.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE account_uuid = ? ORDER BY category, key ASC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByAccountUuidAndCategory(accountUuid: string, category: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE account_uuid = ? AND category = ? ORDER BY key ASC`
    );
    const rows = stmt.all(accountUuid, category) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByAccountUuidCategoryAndKey(
    accountUuid: string,
    category: string,
    key: string,
  ): Promise<UserSetting | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE account_uuid = ? AND category = ? AND key = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, category, key) as any;

    if (!row) return null;

    return UserSetting.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByQuery(accountUuid: string, options: UserSettingQueryOptions): Promise<UserSetting[]> {
    let query = `SELECT * FROM user_settings WHERE account_uuid = ?`;
    const params: any[] = [accountUuid];

    if (options.category) {
      query += ` AND category = ?`;
      params.push(options.category);
    }

    query += ` ORDER BY category, key ASC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE account_uuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async deleteByAccountUuidAndCategory(accountUuid: string, category: string): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM user_settings WHERE account_uuid = ? AND category = ?`
    );
    const result = stmt.run(accountUuid, category);
    return result.changes ?? 0;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM user_settings WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}
