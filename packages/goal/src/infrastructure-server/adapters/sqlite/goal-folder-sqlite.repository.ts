/**
 * SQLite GoalFolder Repository Implementation
 * 目标文件夹的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { GoalFolder } from '@/domain-server';
import type { IGoalFolderRepository } from '@/domain-server';
import type { GoalFolderPersistenceDTO } from '@dailyuse/contracts/goal';

// Helper: Date → INTEGER (millis)
function dateToInt(d: Date | null | undefined): number | null {
  if (!d) return null;
  return d instanceof Date ? d.getTime() : (d as number);
}

export class SqliteGoalFolderRepository implements IGoalFolderRepository {
  constructor(private db: Database.Database) {}

  async save(folder: GoalFolder): Promise<void> {
    const dto = folder.toPersistenceDTO();

    this.db
      .prepare(
        `INSERT INTO goal_folders (
        id, identity_id, name, description, icon, color,
        parent_folder_id, sort_order, folder_type,
        goal_count, completed_goal_count, version,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        icon = excluded.icon,
        color = excluded.color,
        parent_folder_id = excluded.parent_folder_id,
        sort_order = excluded.sort_order,
        folder_type = excluded.folder_type,
        goal_count = excluded.goal_count,
        completed_goal_count = excluded.completed_goal_count,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
      )
      .run(
        dto.id as string,
        dto.identityId as string,
        dto.name,
        dto.description,
        dto.icon,
        dto.color,
        dto.parentFolderId ? (dto.parentFolderId as string) : null,
        dto.sortOrder,
        dto.folderType,
        dto.goalCount,
        dto.completedGoalCount,
        dto.version,
        dateToInt(dto.createdAt),
        dateToInt(dto.updatedAt),
        dateToInt(dto.deletedAt),
      );
  }

  async findById(uuid: string): Promise<GoalFolder | null> {
    const row = this.db
      .prepare(`SELECT * FROM goal_folders WHERE id = ? LIMIT 1`)
      .get(uuid) as any;

    if (!row) return null;

    return this.rowToGoalFolder(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM goal_folders WHERE identity_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`,
      )
      .all(accountUuid) as any[];

    return rows.map((row) => this.rowToGoalFolder(row));
  }

  async delete(uuid: string): Promise<void> {
    this.db.prepare(`DELETE FROM goal_folders WHERE id = ?`).run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM goal_folders WHERE id = ? LIMIT 1`)
      .get(uuid);
    return row !== undefined;
  }

  private rowToGoalFolder(row: any): GoalFolder {
    const dto: GoalFolderPersistenceDTO = {
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      description: row.description ?? null,
      icon: row.icon ?? null,
      color: row.color ?? null,
      parentFolderId: row.parent_folder_id ?? null,
      sortOrder: row.sort_order ?? 0,
      folderType: row.folder_type ?? null,
      goalCount: row.goal_count ?? 0,
      completedGoalCount: row.completed_goal_count ?? 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      version: row.version ?? 1,
    };

    return GoalFolder.fromPersistenceDTO(dto);
  }
}
