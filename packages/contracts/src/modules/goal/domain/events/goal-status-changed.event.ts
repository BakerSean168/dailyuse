import type { GoalServerDTO } from '../../aggregates/goal-server';

export interface GoalStatusChangedEvent {
  identityId: string;
  goal: GoalServerDTO;
  previousStatus: string;
  newStatus: string;
}
