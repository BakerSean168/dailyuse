import type { GoalFolderServerDTO } from '../../aggregates/goal-folder-server';

export interface GoalFolderStatsUpdatedEvent {
  identityId: string;
  folderId: string;
  folder: GoalFolderServerDTO;
  goalCount: number;
  completedGoalCount: number;
  completionRate: number;
}
