import type { GoalServerDTO } from '../../aggregates';

export interface GoalUpdatedEvent {
  identityId: string;
  goal: GoalServerDTO;
  changes: string[];
}
