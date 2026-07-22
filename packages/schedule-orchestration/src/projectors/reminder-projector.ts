import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type {
  ReminderScheduleProjectionSource,
} from '@dailyuse/reminder/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import type { Publisher } from '@dailyuse/utils/domain';
import { deleteSelection, replaceSelection } from './shared-projection';

export interface ReminderProjector {
  upsertTemplate(templateId: string, identityId: string): Promise<void>;
  deleteTemplate(templateId: string, identityId: string): Promise<void>;
}

export interface CreateReminderProjectorDeps {
  readonly source: ReminderScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createReminderProjector(deps: CreateReminderProjectorDeps): ReminderProjector {
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
  };
}
