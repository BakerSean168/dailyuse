/**
 * SQLite Setting Repository Implementation
 * 搴旂敤璁剧疆鐨?SQLite 浠撳偍瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Setting } from '@dailyuse/domain-server/setting';
import type { ISettingRepository, SettingQueryOptions } from '@dailyuse/domain-server/setting';

export class SqliteSettingRepository implements ISettingRepository {
  constructor(private db: Database.Database) {}

  async save(setting: Setting): Promise<void> {
    const dto = setting.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO settings (
        uuid, category, key, value, is_default, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        is_default = excluded.is_default,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.category,
      dto.key,
      JSON.stringify(dto.value),
      dto.is_default ? 1 : 0,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(settings: Setting[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO settings (
        uuid, category, key, value, is_default, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        value = excluded.value,
        is_default = excluded.is_default,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: Setting[]) => {
      for (const setting of items) {
        const dto = setting.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.category,
          dto.key,
          JSON.stringify(dto.value),
          dto.is_default ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(settings);
  }

  async findByUuid(uuid: string): Promise<Setting | null> {
    const stmt = this.db.prepare(`SELECT * FROM settings WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Setting.fromPersistenceDTO({
      uuid: row.uuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      is_default: row.is_default === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByCategory(category: string): Promise<Setting[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM settings WHERE category = ? ORDER BY key ASC`
    );
    const rows = stmt.all(category) as any[];

    return rows.map((row) =>
      Setting.fromPersistenceDTO({
        uuid: row.uuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        is_default: row.is_default === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByCategoryAndKey(category: string, key: string): Promise<Setting | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM settings WHERE category = ? AND key = ? LIMIT 1`
    );
    const row = stmt.get(category, key) as any;

    if (!row) return null;

    return Setting.fromPersistenceDTO({
      uuid: row.uuid,
      category: row.category,
      key: row.key,
      value: JSON.parse(row.value),
      is_default: row.is_default === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByQuery(options: SettingQueryOptions): Promise<Setting[]> {
    let query = `SELECT * FROM settings WHERE 1=1`;
    const params: any[] = [];

    if (options.category) {
      query += ` AND category = ?`;
      params.push(options.category);
    }

    if (options.isDefault !== undefined) {
      query += ` AND is_default = ?`;
      params.push(options.isDefault ? 1 : 0);
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
      Setting.fromPersistenceDTO({
        uuid: row.uuid,
        category: row.category,
        key: row.key,
        value: JSON.parse(row.value),
        is_default: row.is_default === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM settings WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByCategory(category: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM settings WHERE category = ?`);
    const result = stmt.run(category);
    return result.changes ?? 0;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM settings WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

