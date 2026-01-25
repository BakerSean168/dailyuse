/**
 * SQLite Goal Repository Implementation
 * 鐩爣鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { Goal } from '@dailyuse/domain-server/goal';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';

export class SqliteGoalRepository implements IGoalRepository {
  constructor(private db: Database.Database) {}

  async save(goal: Goal): Promise<void> {
    const dto = goal.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO goals (
        uuid, account_uuid, title, description, status, importance, tags,
        folder_uuid, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        importance = excluded.importance,
        tags = excluded.tags,
        folder_uuid = excluded.folder_uuid,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.description || null,
      dto.status,
      dto.importance,
      dto.tags,
      dto.folderUuid || null,
      dto.sortOrder,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Goal | null> {
    const stmt = this.db.prepare(`SELECT * FROM goals WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Goal.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.title,
      description: row.description,
      status: row.status,
      importance: row.importance,
      tags: row.tags || '[]',
      folderUuid: row.folder_uuid,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    let query = `SELECT * FROM goals WHERE account_uuid = ?`;
    const params: any[] = [accountUuid];

    if (options?.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.folderUuid) {
      query += ` AND folder_uuid = ?`;
      params.push(options.folderUuid);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      Goal.fromPersistenceDTO({
        uuid: row.uuid,
        accountUuid: row.account_uuid,
        name: row.title,
        description: row.description,
        status: row.status,
        importance: row.importance,
        tags: row.tags || '[]',
        folderUuid: row.folder_uuid,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goals WHERE folder_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(folderUuid) as any[];

    return rows.map((row) =>
      Goal.fromPersistenceDTO({
        uuid: row.uuid,
        accountUuid: row.account_uuid,
        name: row.title,
        description: row.description,
        status: row.status,
        importance: row.importance,
        tags: row.tags || '[]',
        folderUuid: row.folder_uuid,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE goals SET status = 'DELETED', updatedAt = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM goals WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    const placeholders = uuids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `UPDATE goals SET status = ?, updatedAt = ? WHERE uuid IN (${placeholders})`
    );
    stmt.run(status, Date.now(), ...uuids);
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    const placeholders = uuids.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `UPDATE goals SET folder_uuid = ?, updated_at = ? WHERE uuid IN (${placeholders})`
    );
    stmt.run(folderUuid || null, Date.now(), ...uuids);
  }
}


