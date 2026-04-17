import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { KeyResultServerDTO } from '../../entities/key-result-server';

export interface KeyResultUpdatedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResult: KeyResultServerDTO;
  changes: string[];
  previousValue: number | null;
  newValue: number | null;
  goalProgress: number;
}
