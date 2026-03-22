import type { GoalServerDTO } from '../../aggregates';

export interface GoalStatusChangedEvent {
  identityId: string;
  goal: GoalServerDTO;
  previousStatus: string;
  newStatus: string;
}
