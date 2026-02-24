import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';

export interface TaskFolderSqliteRow {
  id: string;
  identity_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  order_index: number;
  version: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export class SqliteTaskFolderMapper {
  static toDTO(row: TaskFolderSqliteRow): TaskFolderServerDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      order: row.order_index,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  static toDTOList(rows: TaskFolderSqliteRow[]): TaskFolderServerDTO[] {
    return rows.map((row) => SqliteTaskFolderMapper.toDTO(row));
  }
}
