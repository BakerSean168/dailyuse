import type { IGoalRepository } from '../domain';
import type { GoalScheduleExecutionSource } from '../../schedule-execution';

export interface CreateGoalScheduleExecutionSourceDeps {
  readonly goalRepository: Pick<IGoalRepository, 'findByIdForIdentity'>;
}

export function createGoalScheduleExecutionSource(
  deps: CreateGoalScheduleExecutionSourceDeps,
): GoalScheduleExecutionSource {
  return {
    async executeGoal(task) {
      const goal = await deps.goalRepository.findByIdForIdentity(
        String(task.identityId),
        task.sourceEntityId,
        {
          includeChildren: true,
        },
      );

      if (
        !goal ||
        goal.deletedAt ||
        goal.archivedAt ||
        goal.completedAt ||
        goal.status !== 'Active' ||
        !goal.reminderConfig?.enabled
      ) {
        return { nextRunAt: null, result: { skipped: true } };
      }

      const payload = task.metadata.toDTO().payload;
      const triggerType =
        typeof payload['triggerType'] === 'string' ? payload['triggerType'] : undefined;
      const triggerValue =
        typeof payload['triggerValue'] === 'number' ? payload['triggerValue'] : undefined;

      return {
        nextRunAt: null,
        result: {
          goalId: goal.id,
          goalTitle: goal.name,
          triggerType,
          triggerValue,
        },
      };
    },
  };
}
