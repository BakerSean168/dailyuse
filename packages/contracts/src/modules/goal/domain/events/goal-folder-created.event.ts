import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';
import type { IdentityId, GoalFolderId } from '../../../../primitives';

export interface GoalFolderCreatedEvent {
  identityId: IdentityId;
  folderId: GoalFolderId;
  folder: GoalFolderServerDTO;
}
