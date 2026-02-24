/**
 * SQLite TaskFolder Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { ITaskFolderRepository } from '@/domain-server/repositories/ITaskFolderRepository';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';
import { SqliteTaskFolderMapper, type TaskFolderSqliteRow } from './mappers/sqlite-task-folder-mapper';

export class SqliteTaskFolderRepository implements ITaskFolderRepository {
  constructor(private readonly db: Database.Database) {}

  async save(folder: TaskFolderServerDTO): Promise<void> {
    this.db.prepare(`
      INSERT INTO task_folders (
        id, identity_id, name, color, icon,
        order_index, version, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        identity_id = excluded.identity_id,
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        order_index = excluded.order_index,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `).run(
      folder.id,
      folder.identityId,
      folder.name,
      folder.color,
      folder.icon,
      folder.order,
      folder.version,
      typeof folder.createdAt === 'number' ? folder.createdAt : new Date(folder.createdAt).getTime(),
      typeof folder.updatedAt === 'number' ? folder.updatedAt : new Date(folder.updatedAt).getTime(),
      folder.deletedAt
        ? (typeof folder.deletedAt === 'number' ? folder.deletedAt : new Date(folder.deletedAt).getTime())
        : null,
    );
  }

  async findById(id: string): Promise<TaskFolderServerDTO | null> {
    const row = this.db
      .prepare(`SELECT * FROM task_folders WHERE id = ? LIMIT 1`)
      .get(id) as TaskFolderSqliteRow | undefined;

    return row ? SqliteTaskFolderMapper.toDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<TaskFolderServerDTO[]> {
    const rows = this.db
      .prepare(`
        SELECT * FROM task_folders
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY order_index ASC, created_at ASC
      `)
      .all(identityId) as TaskFolderSqliteRow[];

    return SqliteTaskFolderMapper.toDTOList(rows);
  }

  async delete(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM task_folders WHERE id = ?`).run(id);
  }

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT id FROM task_folders WHERE id = ? LIMIT 1`)
      .get(id) as { id: string } | undefined;

    return row !== undefined;
  }
}
