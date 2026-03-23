import type { GoalServerDTO } from '../../aggregates';

export interface GoalCompletedEvent {
  identityId: string;
  goal: GoalServerDTO;
  finalProgress: number;
  completedAt: number;
}
