import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId } from '../../../../primitives';

export interface GoalStatusChangedEvent {
  identityId: IdentityId;
  goal: GoalServerDTO;
  previousStatus: string;
  newStatus: string;
}
