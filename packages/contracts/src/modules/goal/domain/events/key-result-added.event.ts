import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { KeyResultServerDTO } from '../../entities/key-result-server';
import type { IdentityId } from '../../../../primitives';

export interface KeyResultAddedEvent {
  identityId: IdentityId;
  goal: GoalServerDTO;
  keyResult: KeyResultServerDTO;
}
