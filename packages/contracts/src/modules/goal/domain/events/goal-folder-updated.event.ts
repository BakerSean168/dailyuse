import type { GoalFolderServerDTO } from '../../aggregates';

export interface GoalFolderUpdatedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
  changes: string[];
}
