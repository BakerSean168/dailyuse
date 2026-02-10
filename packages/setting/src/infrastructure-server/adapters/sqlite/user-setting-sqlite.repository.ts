/**
 * SQLite UserSetting Repository Implementation
 * 鐢ㄦ埛璁剧疆鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { UserSetting } from '@/domain-server';
import type { IUserSettingRepository, UserSettingQueryOptions } from '@/domain-server';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    const dto = setting.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO user_settings (
        uuid, accountUuid, category, key, value, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.category,
      dto.key,
      JSON.stringify(dto.value),
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(settings: UserSetting[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO user_settings (
        uuid, accountUuid, category, key, value, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: UserSetting[]) => {
      for (const setting of items) {
        const dto = setting.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.accountUuid,
          dto.category,
          dto.key,
          JSON.stringify(dto.value),
          dto.createdAt,
          dto.updatedAt,
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
      account_uuid: row.accountUuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE accountUuid = ? ORDER BY category, key ASC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccountUuidAndCategory(accountUuid: string, category: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE accountUuid = ? AND category = ? ORDER BY key ASC`
    );
    const rows = stmt.all(accountUuid, category) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccountUuidCategoryAndKey(
    accountUuid: string,
    category: string,
    key: string,
  ): Promise<UserSetting | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE accountUuid = ? AND category = ? AND key = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid, category, key) as any;

    if (!row) return null;

    return UserSetting.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByQuery(accountUuid: string, options: UserSettingQueryOptions): Promise<UserSetting[]> {
    let query = `SELECT * FROM user_settings WHERE accountUuid = ?`;
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
        account_uuid: row.accountUuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes ?? 0;
  }

  async deleteByAccountUuidAndCategory(accountUuid: string, category: string): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM user_settings WHERE accountUuid = ? AND category = ?`
    );
    const result = stmt.run(accountUuid, category);
    return result.changes ?? 0;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM user_settings WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

