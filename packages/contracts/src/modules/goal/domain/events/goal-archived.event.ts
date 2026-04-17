import type { GoalServerDTO } from '../../aggregates/goal-server';

export interface GoalArchivedEvent {
  identityId: string;
  goal: GoalServerDTO;
  archivedAt: number;
}
