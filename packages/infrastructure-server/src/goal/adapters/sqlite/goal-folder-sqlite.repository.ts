/**
 * SQLite GoalFolder Repository Implementation
 * 目标文件夹的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';

export class SqliteGoalFolderRepository implements IGoalFolderRepository {
  constructor(private db: Database.Database) {}

  async save(folder: GoalFolder): Promise<void> {
    const dto = folder.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO goal_folders (
        uuid, account_uuid, name, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.description || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<GoalFolder | null> {
    const stmt = this.db.prepare(`SELECT * FROM goal_folders WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return GoalFolder.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      description: row.description,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_folders WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      GoalFolder.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        name: row.name,
        description: row.description,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_folders WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM goal_folders WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}
