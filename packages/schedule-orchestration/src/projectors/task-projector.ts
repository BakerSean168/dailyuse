import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import type { TaskScheduleProjectionSource } from '@dailyuse/task/schedule-projection';
import type { Publisher } from '@dailyuse/utils/domain';
import { deleteSelection, replaceSelection } from './shared-projection';

export interface TaskProjector {
  upsertTemplate(templateId: string, identityId: string): Promise<void>;
  deleteTemplate(templateId: string, identityId: string): Promise<void>;
  deleteInstance(instanceId: string, identityId: string): Promise<void>;
}

export interface CreateTaskProjectorDeps {
  readonly source: TaskScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createTaskProjector(deps: CreateTaskProjectorDeps): TaskProjector {
  return {
    async upsertTemplate(templateId, identityId) {
      await replaceSelection(
        deps.scheduleTaskRepository,
        await deps.source.buildTemplatePlan(templateId, identityId),
        deps.scheduleEvents,
      );
    },

    async deleteTemplate(templateId, identityId) {
      await deleteSelection(
        deps.scheduleTaskRepository,
        deps.source.buildTemplateDeletionSelection(templateId, identityId),
        deps.scheduleEvents,
      );
    },

    async deleteInstance(instanceId, identityId) {
      await deleteSelection(
        deps.scheduleTaskRepository,
        deps.source.buildInstanceDeletionSelection(instanceId, identityId),
        deps.scheduleEvents,
      );
    },
  };
}
