import type { GoalServerDTO } from '../../aggregates/goal-server';

export interface GoalDeletedEvent {
  identityId: string;
  goalId: string;
  goal: GoalServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
