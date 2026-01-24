/**
 * SQLite GoalFolder Repository Implementation
 * 鐩爣鏂囦欢澶圭殑 SQLite 浠撳偍瀹炵幇
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
        uuid, accountUuid, name, description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        updatedAt = excluded\.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto\.accountUuid,
      dto.name,
      dto.description || null,
      dto\.createdAt,
      dto\.updatedAt,
    );
  }

  async findById(uuid: string): Promise<GoalFolder | null> {
    const stmt = this.db.prepare(`SELECT * FROM goal_folders WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return GoalFolder.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      name: row.name,
      description: row.description,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_folders WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      GoalFolder.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row\.accountUuid,
        name: row.name,
        description: row.description,
        createdAt: new Date(row\.createdAt),
        updatedAt: new Date(row\.updatedAt),
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


