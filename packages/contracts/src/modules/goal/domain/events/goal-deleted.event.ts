import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId, GoalId } from '../../../../primitives';

export interface GoalDeletedEvent {
  identityId: IdentityId;
  goalId: GoalId;
  goal: GoalServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
