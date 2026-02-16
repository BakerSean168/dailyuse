/**
 * SQLite UserSetting Repository Implementation
 * 鐢ㄦ埛璁剧疆鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import type { IUserSettingRepository, UserSettingQueryOptions } from '@/domain-server/repositories/IUserSettingRepository';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  constructor(private db: Database.Database) {}

  async save(setting: UserSetting): Promise<void> {
    const dto = setting.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO user_settings (
        id, identityId, category, key, value, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.identityId,
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
        id, identityId, category, key, value, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: UserSetting[]) => {
      for (const setting of items) {
        const dto = setting.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.identityId,
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

  async findById(id: string): Promise<UserSetting | null> {
    const stmt = this.db.prepare(`SELECT * FROM user_settings WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return UserSetting.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountId(identityId: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE identityId = ? ORDER BY category, key ASC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByIdentityIdAndCategory(identityId: string, category: string): Promise<UserSetting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE identityId = ? AND category = ? ORDER BY key ASC`
    );
    const rows = stmt.all(identityId, category) as any[];

    return rows.map((row) =>
      UserSetting.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByIdentityIdCategoryAndKey(
    identityId: string,
    category: string,
    key: string,
  ): Promise<UserSetting | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM user_settings WHERE identityId = ? AND category = ? AND key = ? LIMIT 1`
    );
    const row = stmt.get(identityId, category, key) as any;

    if (!row) return null;

    return UserSetting.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByQuery(identityId: string, options: UserSettingQueryOptions): Promise<UserSetting[]> {
    let query = `SELECT * FROM user_settings WHERE identityId = ?`;
    const params: any[] = [identityId];

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
        id: row.id,
        identity_id: row.identityId,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE id = ?`);
    stmt.run(id);
  }

  async deleteByAccountId(identityId: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM user_settings WHERE identityId = ?`);
    const result = stmt.run(identityId);
    return result.changes ?? 0;
  }

  async deleteByIdentityIdAndCategory(identityId: string, category: string): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM user_settings WHERE identityId = ? AND category = ?`
    );
    const result = stmt.run(identityId, category);
    return result.changes ?? 0;
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM user_settings WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}

