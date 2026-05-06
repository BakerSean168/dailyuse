import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId } from '../../../../primitives';

export interface GoalCompletedEvent {
  identityId: IdentityId;
  goal: GoalServerDTO;
  finalProgress: number;
  completedAt: number;
}
