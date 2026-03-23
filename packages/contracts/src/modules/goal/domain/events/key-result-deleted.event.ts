import type { GoalServerDTO } from '../../aggregates';
import type { KeyResultServerDTO } from '../../entities';

export interface KeyResultDeletedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResultId: string;
  keyResult: KeyResultServerDTO;
}
