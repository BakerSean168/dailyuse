import type { GoalServerDTO } from '../../aggregates';

export interface GoalDeletedEvent {
  identityId: string;
  goalId: string;
  goal: GoalServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
