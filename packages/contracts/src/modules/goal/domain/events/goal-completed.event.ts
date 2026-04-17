import type { GoalServerDTO } from '../../aggregates/goal-server';

export interface GoalCompletedEvent {
  identityId: string;
  goal: GoalServerDTO;
  finalProgress: number;
  completedAt: number;
}
