import type { GoalServerDTO } from '../../aggregates';

export interface GoalArchivedEvent {
  identityId: string;
  goal: GoalServerDTO;
  archivedAt: number;
}
