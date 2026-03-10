import type { ITaskFolderRepository } from '../../../domain-server/repositories/ITaskFolderRepository';
import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';
import {
  PowerSyncTaskFolderMapper,
  type PowerSyncTaskFolderRow,
} from './mappers/powersync-task-folder.mapper';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class PowerSyncTaskFolderRepository implements ITaskFolderRepository {
  constructor(private readonly db: Queryable) {}

  async save(folder: TaskFolderServerDTO): Promise<void> {
    const createdAt = new Date(folder.createdAt).toISOString();
    const updatedAt = new Date(folder.updatedAt).toISOString();
    const deletedAt = folder.deletedAt != null ? new Date(folder.deletedAt).toISOString() : null;

    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM task_folders WHERE id = ? LIMIT 1',
      [folder.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE task_folders
         SET identity_id = ?,
             name = ?,
             color = ?,
             icon = ?,
             "order" = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          folder.identityId,
          folder.name,
          folder.color,
          folder.icon,
          folder.order,
          folder.version,
          updatedAt,
          deletedAt,
          folder.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO task_folders (
          id, identity_id, name, color, icon, "order", version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          folder.id,
          folder.identityId,
          folder.name,
          folder.color,
          folder.icon,
          folder.order,
          folder.version,
          createdAt,
          updatedAt,
          deletedAt,
        ],
      );
    }
  }

  async findById(id: string): Promise<TaskFolderServerDTO | null> {
    const row = await this.db.getOptional<PowerSyncTaskFolderRow>(
      'SELECT * FROM task_folders WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncTaskFolderMapper.toDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<TaskFolderServerDTO[]> {
    const rows = await this.db.getAll<PowerSyncTaskFolderRow>(
      'SELECT * FROM task_folders WHERE identity_id = ? AND deleted_at IS NULL ORDER BY "order" ASC, created_at ASC',
      [identityId],
    );
    return rows.map((row) => PowerSyncTaskFolderMapper.toDTO(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM task_folders WHERE id = ?', [id]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM task_folders WHERE id = ? LIMIT 1',
      [id],
    );
    return !!row;
  }
}
