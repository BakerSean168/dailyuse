import type { GoalServerDTO } from '../../aggregates/goal-server';

export interface GoalUpdatedEvent {
  identityId: string;
  goal: GoalServerDTO;
  changes: string[];
}
