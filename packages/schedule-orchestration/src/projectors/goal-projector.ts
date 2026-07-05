import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type {
  GoalScheduleProjectionSource,
} from '@dailyuse/goal/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import type { Publisher } from '@dailyuse/utils/domain';
import { deleteSelection, replaceSelection } from './shared-projection';

export interface GoalProjector {
  upsertGoal(goalId: string, identityId?: string): Promise<void>;
  deleteGoal(goalId: string, identityId?: string): Promise<void>;
}

export interface CreateGoalProjectorDeps {
  readonly source: GoalScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createGoalProjector(deps: CreateGoalProjectorDeps): GoalProjector {
  return {
    async upsertGoal(goalId, identityId) {
      await replaceSelection(
        deps.scheduleTaskRepository,
        await deps.source.buildGoalPlan(goalId, identityId),
        deps.scheduleEvents,
      );
    },

    async deleteGoal(goalId, identityId) {
      await deleteSelection(
        deps.scheduleTaskRepository,
        deps.source.buildGoalDeletionSelection(goalId, identityId),
        deps.scheduleEvents,
      );
    },
  };
}
