import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';

export interface GoalFolderDeletedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
