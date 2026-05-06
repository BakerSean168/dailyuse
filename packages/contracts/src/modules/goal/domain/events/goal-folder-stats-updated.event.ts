import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';
import type { IdentityId, GoalFolderId } from '../../../../primitives';

export interface GoalFolderStatsUpdatedEvent {
  identityId: IdentityId;
  folderId: GoalFolderId;
  folder: GoalFolderServerDTO;
  goalCount: number;
  completedGoalCount: number;
  completionRate: number;
}
