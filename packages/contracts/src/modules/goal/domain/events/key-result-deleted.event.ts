import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { KeyResultServerDTO } from '../../entities/key-result-server';

export interface KeyResultDeletedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResultId: string;
  keyResult: KeyResultServerDTO;
}
