import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId } from '../../../../primitives';

export interface GoalUpdatedEvent {
  identityId: IdentityId;
  goal: GoalServerDTO;
  changes: string[];
}
