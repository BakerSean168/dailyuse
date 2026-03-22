import type { GoalServerDTO } from '../../aggregates';
import type { KeyResultServerDTO } from '../../entities';

export interface KeyResultAddedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResult: KeyResultServerDTO;
}
