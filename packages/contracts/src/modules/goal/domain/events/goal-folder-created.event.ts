import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';

export interface GoalFolderCreatedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
}
