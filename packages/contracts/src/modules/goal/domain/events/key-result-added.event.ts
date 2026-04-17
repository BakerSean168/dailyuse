import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { KeyResultServerDTO } from '../../entities/key-result-server';

export interface KeyResultAddedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResult: KeyResultServerDTO;
}
