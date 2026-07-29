import type { FolderType } from '@memoflow/contracts/goal';
import { GoalFolder } from '../../../../domain';
import { GoalFolderId } from '../../../../domain';
import { IdentityId } from '@memoflow/domain-shared';
import { fromDbDateTime } from '../shared';

function requiredMs(value: string | null | undefined): number {
  return (fromDbDateTime(value) ?? new Date()).getTime();
}

function optionalMs(value: string | null | undefined): number | null {
  const d = fromDbDateTime(value);
  return d ? d.getTime() : null;
}

export class PowerSyncGoalFolderMapper {
  static toDomain(row: Record<string, unknown>): GoalFolder {
    return GoalFolder.load({
      id: GoalFolderId.of(String(row.id)),
      identityId: IdentityId.of(String(row.identity_id)),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      icon: row.icon ? String(row.icon) : null,
      color: row.color ? String(row.color) : null,
      parentFolderId: row.parent_folder_id ? GoalFolderId.of(String(row.parent_folder_id)) : null,
      sortOrder: Number(row.sort_order ?? 0),
      folderType: (row.folder_type ? String(row.folder_type) : null) as FolderType | null,
      isSystemFolder: Boolean(row.is_system_folder ?? 0),
      goalCount: Number(row.goal_count ?? 0),
      completedGoalCount: Number(row.completed_goal_count ?? 0),
      createdAt: requiredMs(row.created_at ? String(row.created_at) : null),
      updatedAt: requiredMs(row.updated_at ? String(row.updated_at) : null),
      deletedAt: optionalMs(row.deleted_at ? String(row.deleted_at) : null),
      version: Number(row.version ?? 1),
    });
  }

  static toPersistence(folder: GoalFolder) {
    return {
      id: folder.id,
      identityId: folder.identityId,
      name: folder.name,
      description: folder.description,
      icon: folder.icon,
      color: folder.color,
      parentFolderId: folder.parentFolderId,
      sortOrder: folder.sortOrder,
      folderType: folder.folderType,
      goalCount: folder.goalCount,
      completedGoalCount: folder.completedGoalCount,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      deletedAt: folder.deletedAt,
      version: folder.version,
    };
  }
}
