import type { GoalFolderServerDTO } from '../../aggregates';

export interface GoalFolderCreatedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
}
