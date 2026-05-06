import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';
import type { IdentityId, GoalFolderId } from '../../../../primitives';

export interface GoalFolderDeletedEvent {
  identityId: IdentityId;
  folderId: GoalFolderId;
  folder: GoalFolderServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
