import type { GoalFolderServerDTO } from '../../aggregates';

export interface GoalFolderDeletedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
