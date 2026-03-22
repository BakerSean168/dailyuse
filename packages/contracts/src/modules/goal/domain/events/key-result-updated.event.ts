import type { GoalServerDTO } from '../../aggregates';
import type { KeyResultServerDTO } from '../../entities';

export interface KeyResultUpdatedEvent {
  identityId: string;
  goal: GoalServerDTO;
  keyResult: KeyResultServerDTO;
  changes: string[];
  previousValue: number | null;
  newValue: number | null;
  goalProgress: number;
}
