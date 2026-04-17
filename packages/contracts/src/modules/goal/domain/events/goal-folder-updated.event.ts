import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';

export interface GoalFolderUpdatedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
  changes: string[];
}
